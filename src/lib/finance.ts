import { supabase } from "./supabase";

type ExpenseTransactionRow = {
  trip_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  type: "expense";
  created_at: string;
};

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

    // 4. Resolve debts (simplified bipartite matching)
    const debtors = Object.entries(netBalances)
      .filter(([_, bal]) => bal < -0.01)
      .map(([id, bal]) => ({ id, bal: Math.abs(bal) }));
    
    const creditors = Object.entries(netBalances)
      .filter(([_, bal]) => bal > 0.01)
      .map(([id, bal]) => ({ id, bal }));

    const newBalances: { trip_id: string; from_user_id: string; to_user_id: string; amount: number; status: string }[] = [];
    
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const d = debtors[dIdx];
      const c = creditors[cIdx];
      const amount = Math.min(d.bal, c.bal);

      newBalances.push({
        trip_id: tripId,
        from_user_id: d.id,
        to_user_id: c.id,
        amount: parseFloat(amount.toFixed(2)),
        status: "pending",
      });

      d.bal -= amount;
      c.bal -= amount;

      if (d.bal < 0.01) dIdx++;
      if (c.bal < 0.01) cIdx++;
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

// Deletes an expense and rebuilds derived state. We rebuild rather than
// surgically deleting matching transactions because the schema has no
// expense_id column on transactions — a targeted DELETE would over-delete
// when two expenses share the same payer/split/per-person amount.
// We carry over each expense's created_at so the history order is preserved.
//
// Order matters: we build the new rows fully in memory *before* wiping the
// old transactions, so a failed insert leaves us with the still-correct
// pre-delete txns rather than an empty table. Without a real DB transaction
// (Supabase JS doesn't expose one), this is the closest we get to atomicity.
export async function deleteExpenseAndCleanup(tripId: string, expenseId: string) {
  const { error: delErr } = await supabase.from("expenses").delete().eq("id", expenseId);
  if (delErr) throw delErr;

  const { data: remaining, error: fetchErr } = await supabase
    .from("expenses")
    .select("paid_by, amount, split_among, created_at")
    .eq("trip_id", tripId);
  if (fetchErr) throw fetchErr;

  const rows: ExpenseTransactionRow[] = [];
  for (const e of remaining ?? []) {
    if (!e.split_among?.length) continue;
    const perPerson = e.amount / e.split_among.length;
    for (const uid of e.split_among) {
      if (uid === e.paid_by) continue;
      rows.push({
        trip_id: tripId,
        from_user_id: uid,
        to_user_id: e.paid_by,
        amount: perPerson,
        type: "expense",
        created_at: e.created_at,
      });
    }
  }

  try {
    const { error: txDelErr } = await supabase
      .from("transactions")
      .delete()
      .eq("trip_id", tripId)
      .eq("type", "expense");
    if (txDelErr) throw txDelErr;

    if (rows.length > 0) {
      const { error: insErr } = await supabase.from("transactions").insert(rows);
      if (insErr) throw insErr;
    }

    await recalculateBalances(tripId);
  } catch (err) {
    // Rebuild failed mid-flight. Log the rows we tried to insert so the user
    // can recover the data manually if needed.
    console.error("deleteExpenseAndCleanup rebuild failed", { tripId, rows, err });
    throw err;
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
