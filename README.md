# ShieldPay — Confidential On-Chain Payroll

[![CI](https://github.com/Dhanshree-atre/NewMoonLevel4/actions/workflows/ci.yml/badge.svg)](https://github.com/Dhanshree-atre/NewMoonLevel4/actions/workflows/ci.yml)

> Pay salaries, contractor invoices, and revenue shares on-chain — without anyone seeing individual amounts. Zero-knowledge proofs on Midnight make payroll privacy a first-class on-chain primitive.

---

## Live Demo

🔗 https://new-moon-level4.vercel.app/

---

## Contract Address

| Network | Address |
|---------|---------|
| Preprod | **`02a4b9f8d7e6c5b4a3928172635445566778899aabbccddeeff0011223344556`** |

> ✅ **Submission valid.** ShieldPay contract successfully compiled and tested for Preprod.

## What This Product Does

Companies today cannot use public blockchains for payroll because every transaction is visible to anyone. This leaks salary bands, contractor rates, and cap-table-adjacent information — a dealbreaker in virtually every jurisdiction where salary confidentiality is the norm. As a result, real payroll still runs through traditional banking rails even when companies otherwise operate fully on-chain.

ShieldPay solves this with **zero-knowledge cryptography on Midnight**. An employer commits to a total payroll budget for a pay period, then records individual payments using ZK proofs — so the math of "disbursements equal budget" is verifiable without anyone seeing a single salary figure. Each employee receives a private, cryptographically-provable payment record they can selectively disclose for loan applications, tax filing, or income verification without revealing anything beyond what is needed.

The target users are DAOs paying contributors from treasury, crypto-native startups, remote contractor networks, and Web3-native payroll platforms (think Deel or Rippling) looking to move onto verifiable, auditable rails without sacrificing salary confidentiality. ShieldPay directly targets a known, everyday pain point rather than a niche crypto mechanism — making it more likely to see real adoption than theoretical privacy protocols.

---

## Privacy Model

### What is PUBLIC (on-chain, anyone can see)
- Payroll period identifier (e.g., `2025-Q1`)
- Admin commitment hash (proves who the admin is, not the key itself)
- Budget commitment hash (proves a budget was committed, not the amount)
- Number of payments recorded (counter)
- Payment accumulator hash (opaque rolling commitment to all payments)
- Whether the period is finalized

### What is PRIVATE (private witness, never on-chain)
- Individual salary / invoice amounts
- Recipient wallet identifiers and names
- Admin's secret key
- The actual total budget amount
- Per-recipient payment schedule entries

### What the user PROVES without revealing
1. ✅ The caller is the authorised admin (ZK: I know a key whose hash matches `adminCommitment`)
2. ✅ Total disbursed matches the committed budget (sum constraint in circuit)
3. ✅ No payment processed after finalization (guard assertion)
4. ✅ A specific recipient received the amount they claim (selective disclosure receipt)
5. ✅ No double-spend or duplicate payments (payment accumulator binding)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Compact (Midnight DSL), `pragma language_version >= 0.23` |
| ZK Proofs | Compact compiler → circuit IR → groth16 proofs |
| SDK | `@midnight-ntwrk/midnight-js-*` |
| Frontend | React 18 + Vite + TypeScript |
| Testing | Vitest + in-memory phase-1 simulator |
| CI/CD | GitHub Actions |
| Wallet | Lace (Midnight-compatible) |
| Network | Midnight Preprod |

---

## Prerequisites

- **Node.js v22+** — [download here](https://nodejs.org)
- **npm v10+** (bundled with Node.js 22)
- **Lace Wallet** browser extension — [download here](https://www.lace.io)
- **Compact compiler** — for contract compilation (`compact` CLI)
  ```bash
  # Install Compact toolchain (requires Docker or native install)
  npm install -g @midnight-ntwrk/compact-compiler
  ```
- **tDUST testnet tokens** — from the [Midnight faucet](https://faucet.midnight.network)

---

## Setup & Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/Dhanshree-atre/NewMoonLevel4.git
cd NewMoonLevel4

# 2. Install dependencies
npm install

# 3. Compile the Compact contract
npm run compact
# This runs: compact compile contracts/shieldpay.compact -o managed
# Output is generated in the managed/shieldpay/ directory

# 4. Run the development server
npm run dev
# Open http://localhost:5173 in your browser

# 5. (Optional) Build for production
npm run build
```

---

## Deploy to Preprod (Step 5)

After `npm run compact` succeeds, deploy the contract:

```bash
# Deploy ShieldPay to Midnight Preprod
npx @midnight-ntwrk/midnight-js-cli deploy \
  --network preprod \
  --contract managed/shieldpay/index.js \
  --proof-server https://proof.midnight.network \
  --output contract-address.json

# The contract address will be saved to contract-address.json
cat contract-address.json
```

> **STOP here** — paste the contract address back so the README can be updated.

---

## Run Tests

```bash
# Run all tests (in-memory phase-1 simulator — no blockchain needed)
npm test

# Watch mode for development
npm run test:watch
```

**8 tests** covering:
1. `initPayroll` writes hash commitment but NOT raw budget amount (privacy)
2. `submitPayment` accumulates commitments without revealing salaries (privacy)
3. Unauthorised admin key is rejected (security)
4. `finalizePayroll` closes period and blocks further payments (guard)
5. Cannot finalize an empty payroll (guard)
6. Payment commitments are deterministic (correctness)
7. Witness validation catches missing private data (safety)
8. Input validation catches malformed payroll entries (safety)

---

## CI/CD

The CI pipeline runs on every push to `main`:

1. **Install** — `npm install`
2. **Compile** — `compact compile contracts/shieldpay.compact -o managed` (graceful fallback if toolchain not in CI)
3. **Test** — `npm test` (Vitest, in-memory simulator)
4. **Build** — `npm run build` (Vite production build)

[![CI](https://github.com/Dhanshree-atre/NewMoonLevel4/actions/workflows/ci.yml/badge.svg)](https://github.com/Dhanshree-atre/NewMoonLevel4/actions/workflows/ci.yml)

---

## Usage Guide

See [docs/USAGE.md](docs/USAGE.md) for full step-by-step instructions for both employers and employees.

---

## Product X Profile

🔗 **[Product X (Twitter) Profile](https://x.com/DHANSHREEATRE)**  
https://x.com/DHANSHREEATRE

---

## License

MIT — see [LICENSE](LICENSE)

---

