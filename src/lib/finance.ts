import { supabase } from "./supabase";

/**
 * RE-CALCULATES all balances for a trip from scratch.
 * This ensures data consistency even after edits/deletes.
 */
export async function recalculateBalances(tripId: string) {
  try {
    // 1. Fetch all expenses for the trip
    const { data: expenses, error: expError } = await supabase
      .from("expenses")
      .select("*")
      .eq("trip_id", tripId);

    if (expError) throw expError;

    // 1.5 Fetch all settlement transactions
    const { data: settlements, error: setError } = await supabase
      .from("transactions")
      .select("*")
      .eq("trip_id", tripId)
      .eq("type", "settlement");

    if (setError) throw setError;

    // 2. Fetch all members
    const { data: members, error: memError } = await supabase
      .from("trip_members")
      .select("user_id")
      .eq("trip_id", tripId);

    if (memError) throw memError;

    // 3. Compute net balances
    const netBalances: Record<string, number> = {};
    members.forEach((m) => { netBalances[m.user_id] = 0; });

    // Add debts from expenses
    expenses?.forEach((e: any) => {
      if (!e.split_among || e.split_among.length === 0) return;
      const perPerson = e.amount / e.split_among.length;
      netBalances[e.paid_by] = (netBalances[e.paid_by] ?? 0) + e.amount;
      e.split_among.forEach((uid: string) => {
        netBalances[uid] = (netBalances[uid] ?? 0) - perPerson;
      });
    });

    // Add credits from settlements
    settlements?.forEach((s: any) => {
      netBalances[s.from_user_id] = (netBalances[s.from_user_id] ?? 0) + s.amount;
      netBalances[s.to_user_id] = (netBalances[s.to_user_id] ?? 0) - s.amount;
    });

    // 4. Resolve debts (simplified bipartite matching).
    // Work in integer paise so float drift can't leave half-cent residuals
    // that prevent index advancement (potential infinite loop) or skip a
    // valid pairing. We round once when entering this stage; all matching
    // arithmetic is integer.
    const toPaise = (rupees: number) => Math.round(rupees * 100);

    const debtors = Object.entries(netBalances)
      .filter(([, bal]) => bal < -0.01)
      .map(([id, bal]) => ({ id, paise: toPaise(Math.abs(bal)) }));

    const creditors = Object.entries(netBalances)
      .filter(([, bal]) => bal > 0.01)
      .map(([id, bal]) => ({ id, paise: toPaise(bal) }));

    const newBalances: { trip_id: string; from_user_id: string; to_user_id: string; amount: number; status: string }[] = [];

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const d = debtors[dIdx];
      const c = creditors[cIdx];
      const matchPaise = Math.min(d.paise, c.paise);

      if (matchPaise <= 0) {
        // Exhausted side(s); advance whichever is empty to avoid spinning.
        if (d.paise <= 0) dIdx++;
        if (c.paise <= 0) cIdx++;
        continue;
      }

      newBalances.push({
        trip_id: tripId,
        from_user_id: d.id,
        to_user_id: c.id,
        amount: matchPaise / 100,
        status: "pending",
      });

      d.paise -= matchPaise;
      c.paise -= matchPaise;

      if (d.paise <= 0) dIdx++;
      if (c.paise <= 0) cIdx++;
    }

    // 5. Update Database (Atomic Wipe & Replace)
    const { error: delError } = await supabase
      .from("balances")
      .delete()
      .eq("trip_id", tripId)
      .eq("status", "pending");

    if (delError) {
      console.error("Delete pending balances error:", delError);
      throw delError;
    }

    if (newBalances.length > 0) {
      const { error: insError } = await supabase.from("balances").insert(newBalances);
      if (insError) {
        console.error("Insert new balances error:", insError);
        throw insError;
      }
    }

    return { success: true };
  } catch (err: any) {
    // Log the full error object for debugging
    console.error("Error recalculating balances:", {
      message: err.message,
      details: err.details,
      hint: err.hint,
      code: err.code,
      full: err
    });
    return { success: false, error: err };
  }
}

export async function logExpenseAndNotify({
  tripId,
  payerId,
  splitAmong,
  amount,
  expenseTitle,
}: {
  tripId: string;
  payerId: string;
  splitAmong: string[];
  amount: number;
  expenseTitle: string;
}) {
  try {
    // 1. Recalculate balances (ensures accuracy)
    await recalculateBalances(tripId);

    // 2. Log Transactions (for history)
    const perPerson = amount / splitAmong.length;
    for (const userId of splitAmong) {
      if (userId === payerId) continue;
      
      await supabase.from("transactions").insert({
        trip_id: tripId,
        from_user_id: userId,
        to_user_id: payerId,
        amount: perPerson,
        type: "expense",
      });

      // 3. Notifications
      await supabase.from("notifications").insert([
        {
          user_id: userId,
          type: "expense",
          message: `${expenseTitle} added. You owe ₹${perPerson.toFixed(0)}.`,
        },
        {
          user_id: userId,
          type: "due",
          message: `Pending dues updated for ${expenseTitle}.`,
        }
      ]);
    }
  } catch (err) {
    console.error("Error in logExpenseAndNotify:", err);
  }
}

export async function processPayment({
  tripId,
  payerId,
  receiverId,
  amount,
  balanceId,
}: {
  tripId: string;
  payerId: string;
  receiverId: string;
  amount: number;
  balanceId?: string;
}) {
  try {
    // 1. Create Transaction
    await supabase.from("transactions").insert({
      trip_id: tripId,
      from_user_id: payerId,
      to_user_id: receiverId,
      amount: amount,
      type: "settlement",
    });

    // 2. Notify receiver
    await supabase.from("notifications").insert({
      user_id: receiverId,
      type: "payment",
      message: `Payment of ₹${amount.toFixed(0)} received from member!`,
    });

    // 3. Update balance
    if (balanceId) {
      const { data: balance } = await supabase.from("balances").select("*").eq("id", balanceId).single();
      if (balance) {
        const newAmount = balance.amount - amount;
        if (newAmount <= 0.01) {
          await supabase.from("balances").update({ status: "settled", amount: 0, updated_at: new Date().toISOString() }).eq("id", balanceId);
        } else {
          await supabase.from("balances").update({ amount: newAmount, updated_at: new Date().toISOString() }).eq("id", balanceId);
        }
      }
    }
    
    // Final sync
    await recalculateBalances(tripId);
  } catch (err) {
    console.error("Error in processPayment:", err);
  }
}
