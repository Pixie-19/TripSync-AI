# 🌌 TripSync AI — The Cinematic Group Travel Command Center
### Plan together. Spend smarter. Settle instantly.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Mistral AI](https://img.shields.io/badge/AI-Mistral-orange?style=for-the-badge)](https://mistral.ai/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-emerald?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Firebase](https://img.shields.io/badge/Auth-Firebase-yellow?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

---

## 🚀 1. The Vision

**TripSync AI** is a premium, cinematic travel management platform designed to eliminate the chaos of group trips. We've combined **high-performance AI** with a **state-of-the-art Fintech interface** to turn group planning from a chore into a premium experience.

### 🌑 Cinematic Fintech Aesthetic
Unlike traditional travel apps, TripSync AI features a **"Fintech Command Center"** design:
*   **Deep Space Theme**: Ultra-dark charcoal backgrounds with vibrant cyan and violet neon accents.
*   **Glassmorphism**: High-intensity backdrop blurs and translucent layers for a modern, airy feel.
*   **Micro-Animations**: Buttery smooth transitions powered by Framer Motion.
*   **Zero-Emoji Professionalism**: Swapped generic emojis for premium Lucide-react iconography.

---

## ✨ 2. Intelligence & Features

### 🤖 AI Core (Powered by Mistral Large)
*   **Instant Itinerary Generator**: Mistral AI drafts a realistic, day-wise plan based on your group's budget, destination, and unique preferences.
*   **Smart Budget Auditor**: Real-time financial analysis. The AI detects overspending in specific categories and provides actionable advice (e.g., "You're 20% over on food; try these 3 local budget markets instead").
*   **AI Travel Assistant**: A dedicated companion that lives in your trip, ready to answer questions about your plan or suggest changes on the fly.

### 💸 Financial Command Center
*   **Zero-Friction Splitting**: Track expenses in real-time. Whether it's a shared dinner or a flight, the app handles the math instantly.
*   **Optimal Settlement Algorithm**: Minimize group friction. Our algorithm calculates the mathematically fewest number of transactions needed to clear all group debts.
*   **Live Balance Board**: Real-time visualization of who's "in the green" and who needs to pay up.

### 👥 Collaboration & Social
*   **Real-Time Group Chat**: Seamless coordination integrated directly into the trip dashboard.
*   **Live Voting/Polls**: Can't decide on the next activity? Create a poll and let the group decide in real-time.
*   **One-Click Invites**: Share a unique 8-character code to bring your squad into the command center.

---

## 📱 3. Mobile-First Experience

TripSync AI is engineered for use on the go.
*   **Adaptive Layouts**: Seamless transitions from 4K desktops to compact mobile screens.
*   **Native-Feel Interactions**: Chat windows transform into elegant **Bottom Sheets** on mobile for a native app experience.
*   **Touch-Optimized Tabs**: Horizontal scrolling with scroll-snapping for easy navigation through Itineraries, Expenses, and Insights.

---

## 🛠️ 4. Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router), TypeScript |
| **Styling** | Tailwind CSS, ShadCN UI |
| **Animations** | Framer Motion |
| **Authentication** | Firebase Auth (Google OAuth) |
| **Database** | Supabase (PostgreSQL) |
| **Realtime** | Supabase Realtime (WebSockets) |
| **AI Engine** | Mistral AI (Mistral Large Latest) |

---

## 🏗️ 5. System Architecture

```mermaid
graph TD
    User((User))
    NextJS[Next.js App Router]
    Firebase[Firebase Auth]
    SupabaseDB[(Supabase PostgreSQL)]
    SupabaseRT[Supabase Realtime]
    Mistral[Mistral AI API]

    User -- Auth --> Firebase
    User -- Interaction --> NextJS
    NextJS -- Identity Sync --> SupabaseDB
    NextJS -- JSON-Structured Prompts --> Mistral
    SupabaseDB -- Broadcast --> SupabaseRT
    SupabaseRT -- Live UI Updates --> NextJS
```

---

## ⚙️ 6. Setup & Installation

1.  **Clone & Install**
    ```bash
    git clone https://github.com/Pixie-19/TripSync-AI.git
    npm install
    ```

2.  **Environment Setup** (`.env.local`)
    ```env
    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    MISTRAL_API_KEY=...
    ```

3.  **Database Configuration**
    Run the `database/schema.sql` and `database/add_chat_table.sql` in your Supabase SQL Editor.

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

---

## 📈 7. Future Vision
*   **UPI Deep-Linking**: Settle debts directly via phone-pay/G-pay from the settlement card.
*   **OCR Receipts**: Snap a photo of a bill, and the AI automatically parses the amount and split members.
*   **Offline Mode**: Queue expenses while traveling in low-network areas.

---
**© 2026 TripSync AI. Engineered for adventure.**
**Made with ❤️ by Rishita Seal**
