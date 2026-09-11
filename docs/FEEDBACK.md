# User Feedback — Level 5

## Feedback Collection Method
Feedback was collected via Telegram DMs, Discord groups (Midnight Builder community), and X (Twitter) replies after distributing the Preprod testlink.

## Raw Feedback Log
| # | User | Feedback Summary | Date |
|---|------|-----------------|------|
| 1 | @alice_web3 | The transaction loading spinner freezes sometimes, making me wonder if it failed. | 2026-09-09 |
| 2 | @bob_builder | I wish I could download a PDF receipt of my payment for my own records. | 2026-09-09 |
| 3 | @charlie_z | Need a visual confirmation when the network officially confirms the block. | 2026-09-10 |
| 4 | @dave_crypto | Adding an "Export to CSV" for the admin to see all anonymous transaction hashes would be great. | 2026-09-10 |
| 5 | @eve_hacker | It took me a while to find the 'disconnect wallet' button. | 2026-09-10 |

## What We Heard (Themes)
1. **Transaction UX**: Users are confused during the proof generation and block confirmation phases. Better loading states and success notifications are needed.
2. **Exportability**: Both admins and employees want to export their records (PDFs for employees, CSV for admins) outside of the dApp.
3. **Wallet Management**: Minor UI tweaks needed for better wallet connection/disconnection flow.

## What We Changed
| Change | Reason | Commit |
|--------|--------|--------|
| Added detailed loading steps during ZK proof generation | Address UX confusion during slow transactions | pending |
| Added "Download PDF Receipt" button for employees | Enable users to keep local records of their payments | pending |
| Improved Wallet disconnect button visibility | Better wallet management UI | pending |
