# How to Use ShieldPay

## What You Need

Before you start, make sure you have:

- **Lace Wallet** — the official Midnight-compatible browser wallet ([download here](https://www.lace.io))
- **A web browser** (Chrome or Firefox recommended)
- **Some tDUST** — the Midnight testnet token for gas fees (available from the [Midnight faucet](https://faucet.midnight.network))
- **A Midnight Preprod account** in your Lace wallet

> **Note:** You do NOT need to be technical. ShieldPay handles all the cryptography for you behind the scenes.

---

## Step-by-Step Guide

### As an Employer / Admin

**Step 1 — Open the app and connect your wallet**
1. Go to the ShieldPay web app
2. Click **"Connect Lace Wallet"**
3. Your Lace browser extension will open — click **Authorize**
4. You will see your wallet address appear in the top bar. You are now connected.

**Step 2 — Initialise a new pay period**
1. Make sure you are on the **"Admin / Employer"** tab
2. In the **"Initialise Pay Period"** card:
   - Enter a **Payroll Period ID** — this is a label you choose (e.g., `2025-AUGUST` or `DAO-ROUND-12`)
   - Enter your **Total Budget** in USD — this is the total amount you plan to pay across all employees
3. Click **"Initialise Payroll (Generate ZK Proof)"**
4. Wait a few seconds while ShieldPay generates a zero-knowledge proof on your device
5. Your Lace wallet will prompt you to approve the transaction — click **Confirm**
6. Done! The payroll period is now open on-chain. Only a *hash* of your budget is visible — not the number itself.

**Step 3 — Add each employee payment (one at a time)**
1. In the **"Add Shielded Payment"** card:
   - Enter the **Recipient Identifier** — this is the employee's wallet address or a private ID code you share with them
   - Enter the **Payment Amount** in USD
2. Click **"Submit Shielded Payment"**
3. ShieldPay generates a ZK proof locally — the salary amount never touches the blockchain
4. Approve the transaction in Lace
5. Repeat for every employee you need to pay

> **Privacy guarantee:** Each employee's salary is processed as a *zero-knowledge witness* — it is mathematically proven but never recorded on-chain. Your colleagues cannot see each other's salaries by reading the blockchain.

**Step 4 — Finalize the pay period**
1. Once all payments are submitted, click **"Finalize Payroll Period"**
2. This closes the period — no further payments can be added
3. Employees can now generate their individual payment proofs

---

### As an Employee / Recipient

**Step 1 — Connect your Lace wallet** (same as admin step 1)

**Step 2 — Switch to the Recipient tab**
1. Click **"Recipient / Employee"** in the tab bar

**Step 3 — Claim your payment proof**
1. In the **"Claim Your Payment Proof"** card:
   - Enter your **Recipient Key** — your employer gives this to you privately (it is like a private password for your payment)
   - Enter your **Salary / Payment Amount** — the exact amount you were told you would receive
2. Click **"Generate My Payment Proof (ZK)"**
3. ShieldPay generates a cryptographic proof on your device
4. You receive a **Proof Hash** — a short code that proves your payment without revealing the amount

**Step 4 — Use your proof**
- **For a bank loan:** Share the proof hash. The bank can verify you received a salary without seeing the number.
- **For tax filing:** Use the proof hash as a digital income record.
- **For a background check:** Share selectively — only what the verifier needs to see.

> Your salary amount is **never** in the proof hash. Only you know the amount.

---

## What Gets Proved (and What Stays Private)

| Information | Visible? | To Whom? |
|---|---|---|
| Payroll period ID (e.g., "2025-Q1") | ✅ Public | Everyone |
| Total budget commitment (hash only) | ✅ Public | Everyone |
| Number of payments made | ✅ Public | Everyone |
| Payment accumulator (opaque hash) | ✅ Public | Everyone |
| **Individual salary amounts** | 🔒 **PRIVATE** | **Nobody** (not even the blockchain) |
| **Who paid whom** | 🔒 **PRIVATE** | **Nobody** |
| **Admin's secret key** | 🔒 **PRIVATE** | Admin only |
| **Employee's recipient key** | 🔒 **PRIVATE** | Employee only |

### The ZK Proof Guarantees (without revealing anything)
1. ✅ The admin is authorised (knows the secret key)
2. ✅ The total disbursed matches the committed budget
3. ✅ No payment was added after finalization
4. ✅ The employee received the amount they claim (for the proof receipt)

---

## Troubleshooting

**"Connect Lace Wallet" button does nothing**
→ Make sure the Lace browser extension is installed. If using Chrome, check that the extension is enabled. Refresh the page and try again.

**"Midnight network not available" error**
→ Open Lace → Settings → Network → Switch to **Preprod**. ShieldPay runs on the Midnight Pre-Production network.

**"Transaction failed — insufficient funds"**
→ You need tDUST for gas fees. Go to the [Midnight faucet](https://faucet.midnight.network), enter your wallet address, and request tokens.

**"Unauthorised: admin key mismatch"**
→ You are not connected with the admin wallet. Switch to the wallet that was used to initialise the payroll period.

**"Payroll not finalized — cannot claim proof yet"**
→ The admin has not yet finalized the pay period. Ask your employer to click "Finalize Payroll Period" first.

**"No payments recorded — cannot finalize empty payroll"**
→ You must add at least one payment before finalizing. Go back to Step 3.

**Proof generation seems stuck**
→ Generating ZK proofs takes 5–30 seconds on most computers (it is running complex cryptography locally). Please wait. If it takes more than 2 minutes, refresh and try again.

**Need more help?**
→ Open an issue on [GitHub](https://github.com/Dhanshree-atre/NewMoonLevel4) or reach out via the Midnight Discord community.
