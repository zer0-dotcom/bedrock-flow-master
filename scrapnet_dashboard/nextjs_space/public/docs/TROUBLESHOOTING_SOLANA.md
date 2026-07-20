# Bedrock ESG Troubleshooting Guide
## Resolving Wallet & Blockchain Verification Errors

---

## The Foundation Rule of Troubleshooting

**Your configuration is sound—adjustments are straightforward.**

Blockchain verification errors almost always appear more complex than they actually are. In practice, 95% of issues encountered are simple **configuration alignments**—your wallet is connected to a different network, or your browser session needs renewal. The verification infrastructure remains stable; it requires only correct input parameters.

Consider it similar to industrial equipment calibration. The machinery functions correctly—it simply needs proper settings to operate as designed. That's exactly what we'll address here.

---

## Common Issues & Resolutions

Use the table below to locate your error condition and follow the resolution protocol. If your exact error isn't listed, identify the most similar condition.

| Common Issue | Technical Context | Resolution Protocol |
|--------------|-------------------|--------------------|
| **"Account does not exist"** | Your wallet address hasn't been initialized on the Solana network. Wallet addresses require minimal SOL balance to become active network participants. | ✅ **Acquire initialization SOL.** See the "Acquiring Test SOL" section below. Once you have 0.001+ SOL, this condition resolves automatically. |
| **"Network mismatch" or missing transactions** | You're viewing one network (e.g., Mainnet) while your wallet is connected to a different network (e.g., Devnet). This is equivalent to searching records in the wrong database. | ✅ **Align network configurations.** Access your wallet settings and verify network selection. Ensure Bedrock ESG and your wallet both reference the **same network** (Devnet for testing, Mainnet for production attestations). |
| **"Insufficient SOL for transaction"** | Solana transactions require minimal processing fees (typically less than $0.01). Your wallet balance doesn't cover the required amount. | ✅ **Fund your wallet.** For testing, use a faucet (see below). For production, acquire SOL from a licensed exchange and transfer to your wallet. |
| **Faucet returns "Rate limit exceeded"** | Free SOL faucets implement rate limiting. Too many requests have been processed recently. | ✅ **Observe cooldown period.** Wait 15-30 minutes, then retry. Alternatively, utilize a different faucet (options listed below). |
| **"Wallet not connected" or connection timeout** | Your browser lost the secure connection to your wallet extension, or the session expired. | ✅ **Reestablish connection.** Click **Connect Wallet** in Bedrock ESG. If unsuccessful, refresh the page, unlock your wallet extension, and retry. |
| **"User rejected the request"** | You (or your wallet security) declined the transaction before execution. This is a security feature, not an error condition. | ✅ **Retry with approval.** Repeat the action and select **Approve** or **Confirm** in the wallet confirmation dialog. |
| **Transaction status "Pending" extended** | Network congestion or transaction queue delays may occur during high-volume periods. | ✅ **Allow processing time.** Most transactions confirm within seconds, but network load can extend this. If exceeding 5 minutes, retry the action—Solana prevents duplicate charges. |
| **"Blockhash expired" or "Transaction expired"** | Solana transactions have a validation window (~60 seconds). Extended approval time caused timeout. | ✅ **Retry promptly.** Initiate the action again and approve the wallet confirmation within 30 seconds. |
| **Wallet confirmation dialog not appearing** | Browser popup controls or wallet extension status may be blocking the dialog. | ✅ **Verify popup permissions.** Click your wallet extension icon to check for pending requests. If none exist, refresh the page and retry. Ensure your wallet extension is unlocked. |
| **"Simulation failed" prior to transaction** | Solana validates transactions before execution. Something in the current state would cause execution failure. | ✅ **Verify input parameters.** Confirm sufficient SOL balance, correct network selection, and valid submission data. Retry after corrections. |

---

## Acquiring Test SOL (Devnet Environment)

⚠️ **Important:** Test SOL (Devnet/Testnet) has **no monetary value**. It exists solely for development and testing purposes. Never exchange real currency for test tokens.

### Protocol: Acquire Free Devnet SOL

1. **Copy your wallet address**  
   Open your wallet application (Phantom, Solflare, etc.) and copy your public address. Format: `7xKX...n9Dp`

2. **Access a Solana Faucet**  
   Visit one of these verified faucets:
   - [Official Solana Faucet](https://faucet.solana.com/) — Primary source
   - [SolFaucet](https://solfaucet.com/) — Alternative source

3. **Submit your address and request SOL**  
   Enter your wallet address and select **Request Airdrop** or **Get SOL**.

4. **Allow 10-30 seconds for processing**  
   Check your wallet balance. You should see 1-2 SOL credited.

✅ **Initialization complete.** Your wallet is now activated and funded for testing operations.

---

## The Verification Protocol

**When uncertain, verify on the authoritative source.**

If you're unclear whether an attestation was successfully recorded, don't assume—verify using the official Solana Explorer. This is the sole authoritative source showing the **actual** blockchain state.

### How to Verify Your Attestation

1. **Locate your transaction signature (hash)**  
   After generating an attestation or submitting data, Bedrock ESG displays a transaction signature. Format: `4sGj...Lp9x`. Copy this identifier.

2. **Access Solana Explorer**  
   Open [https://explorer.solana.com/](https://explorer.solana.com/)

3. ⚠️ **Select the correct network (CRITICAL)**  
   - Locate the **network selector** in the top-right corner
   - Click the dropdown menu
   - Select **the identical network your wallet is configured to**:
     - `Devnet` for testing environment
     - `Mainnet Beta` for production attestations
   - **Network mismatch will result in "not found" responses.**

4. **Enter your transaction signature**  
   Input the signature in the search field and press Enter.

5. **Interpret the result**  
   - ✅ **"Success"** — Your attestation is confirmed and permanently recorded.
   - ❌ **"Failed"** — An error occurred. Review the error details for specifics.
   - 🔍 **"Not found"** — Either incorrect network is selected, or the transaction was never submitted.

### Professional Tip: Bookmark Your Wallet Address

You can also search for your **wallet address** on the Explorer to view all historical transactions. This provides a comprehensive audit trail of your Bedrock ESG verification activity.

---

## Standard Resolution Protocol

Before contacting support, execute these standard resolution steps:

1. **🔄 Refresh the page** — Resolves approximately 50% of issues.
2. **🔐 Unlock your wallet** — Locked wallets cannot authorize transactions.
3. **🌐 Verify network alignment** — Ensure wallet and Bedrock ESG reference the same network.
4. **💰 Verify SOL balance** — Minimal balance required for transaction processing.
5. **🧹 Clear browser cache** — Cached data occasionally causes conflicts.
6. **🔌 Disconnect and reconnect wallet** — Fresh connections often resolve state issues.

---

## Understanding Solana Networks

| Network | Purpose | SOL Value | Use Case |
|---------|---------|-----------|----------|
| **Mainnet Beta** | Production attestations | Real value | Live verification, institutional carbon attestations |
| **Devnet** | Testing & development | No value | System testing, feature validation |
| **Testnet** | Validator testing | No value | Infrastructure testing (not typically used by standard users) |

**Bedrock ESG defaults to Devnet** for testing and onboarding. When your organization is ready for production attestations, configuration switches to Mainnet.

---

## Glossary: Verification Terms Defined

| Term | Definition |
|------|------------|
| **Wallet** | Your digital identity and transaction authorization mechanism. Equivalent to a secure credential + payment instrument. |
| **SOL** | Solana's native currency. Minimal amounts required for transaction processing fees. |
| **Transaction** | Any blockchain operation—generating attestations, transferring credentials, etc. |
| **Signature/Hash** | A unique identifier for every transaction. Use for verification and audit purposes. |
| **Faucet** | A distribution mechanism for test tokens. Operates only on non-production networks. |
| **Network** | The Solana environment in use (Mainnet = production, Devnet = testing). |
| **Blockhash** | A time-limited validation token. Extended approval delays require new authorization. |
| **Memo Program** | The Solana capability Bedrock ESG utilizes for recording audit attestations on-chain. |

---

## Need Additional Support?

If standard resolution protocols haven't addressed your issue, our institutional support team is available.

📧 **Email:** [support@bedrock-esg.io](mailto:support@bedrock-esg.io)  
📚 **Full Documentation:** [docs.bedrock-esg.io](https://docs.bedrock-esg.io)  
💬 **Professional Support:** Contact your designated verification agent

**When contacting support, please provide:**
- Your wallet address (public address only—never share your seed phrase)
- The exact error message displayed
- Network configuration (Devnet or Mainnet)
- The specific operation you were performing

---

*Industrial-grade verification infrastructure. Built for trust.*

---

*Last updated: February 28, 2026*
