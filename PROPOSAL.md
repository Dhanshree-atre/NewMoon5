# ShieldPay — Confidential On-Chain Payroll Protocol

## Product Idea

ShieldPay is a confidential payroll and fund-splitting protocol on Midnight that lets organizations pay salaries, contractor invoices, or multi-party revenue shares on-chain — without exposing individual payment amounts to the public, to coworkers, or to competitors.

## The Real-World Problem

Companies today cannot use public blockchains for payroll because every transaction is visible to anyone. This leaks salary bands, contractor rates, and cap-table-adjacent information (e.g., how much a startup pays its top engineers, or how a DAO splits treasury income among contributors). That is a dealbreaker in every jurisdiction where salary confidentiality is standard practice — which is most of them.

As a result, real payroll still runs through traditional banking rails even when a company otherwise operates on-chain (e.g., crypto-native startups, DAOs, remote contractor networks).

## The Solution

ShieldPay solves this directly:

1. An employer **commits** to a total payroll amount for a pay period using a hash commitment, provably binding them without disclosing the amount.
2. **Zero-knowledge proofs** show that (a) the total disbursed matches the committed budget, (b) every recipient got paid according to their contracted terms, and (c) no funds were double-spent or diverted — all without revealing any individual's pay to anyone else.
3. Each employee gets a **private, provable payment record** they can use for their own purposes (loan applications, tax filing, income verification) by selectively disclosing just what is needed, to just the party who needs it.
4. An employer or auditor can optionally get **proof of aggregate compliance** (e.g., "total payroll spend was $X" or "tax withholding was correct") without ever seeing individual salaries.

## Target Users

- **DAOs** paying contributors from treasury
- **Remote-first companies** and crypto-native startups
- **Web3-native payroll platforms** (Deel/Rippling-style) looking to move onto verifiable, auditable rails
- **Contractor networks** managing multi-party revenue shares

## Why Midnight

Midnight's Compact language and zero-knowledge architecture are uniquely suited to this problem:

- **Native private witnesses** — individual salary amounts never leave the payer's device
- **ZK circuit proofs** — mathematical guarantees replace trust in intermediaries
- **Selective disclosure** — recipients prove payment without revealing the amount
- **On-chain commitments** — the ledger holds only hashes and counters, not sensitive data

No other L1 or L2 provides this combination of programmable privacy and public verifiability without requiring a separate trusted enclave or oracle.

## Planned Scope (Level 4–6)

### Level 4
- Compact contract with admin commitment, shielded payment accumulation, and finalization circuit
- In-memory phase-1 test suite (≥3 passing tests)
- React + Vite + TypeScript frontend
- CI/CD via GitHub Actions

### Level 5
- Deploy to Midnight Preprod
- Frontend wired to live contract
- Recipient claim / selective disclosure flow

### Level 6
- Full audit proof circuit
- Tax withholding proof (ZK range proof: 0 ≤ withholding ≤ gross)
- Demo video and Product Hunt launch

## Competitive Differentiation

| Feature | Public Blockchain | ShieldPay on Midnight |
|---|---|---|
| Salary amounts visible on-chain | ✓ (problem) | ✗ (private) |
| Cryptographic proof of payment | ✗ | ✓ |
| Selective disclosure to auditors | ✗ | ✓ |
| No trusted third party required | ✗ | ✓ |
| Works for DAOs and companies | Partial | ✓ |

ShieldPay directly targets a known, everyday pain point rather than a niche crypto mechanism, which makes it more likely to see real adoption.
