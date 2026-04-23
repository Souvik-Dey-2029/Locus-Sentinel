# Locus Sentinel

**The Autonomous NOC: Natural Language Infrastructure & Semantic Financial Settlement**

Locus Sentinel is an elite, AI-driven Network Operations Center (NOC) dashboard designed for the Locus Paygentic Hackathon. It bridges the gap between autonomous agent deployment and financial accountability by linking LLM-verified infrastructure outcomes directly to Locus Paygentic settlements.

---

## 💎 Why it Wins: "Agent-Powered Alpha"
Locus Sentinel directly addresses the **'Make/Save Money'** prompt by introducing the first **Zero-Waste Infrastructure** protocol for AI agents:
- **Saves You Money**: The "Capital Guardian" prevents "Capital Bleed" by automatically rolling back faulty deployments (e.g., DB connection errors) before they accrue costs. 
- **Makes You Money**: By ensuring 100% uptime and semantic intent-alignment via the AI Auditor, Sentinel ensures your infra is always ready to generate revenue, never idling in a broken state.

---

## 🏗️ System Architecture
```text
[ USER INTENT ] -> (Natural Language Command)
       |
       v
[ SENTINEL ORCHESTRATOR ] <--- (SSE Real-time Telemetry)
       |
       +------> [ WALLET MANAGER ] (Escrow $0.50 locked)
       |
       +------> [ LOCUS PAAS API ] (Container Provisioning)
       |               |
       |               v
       |        [ LIVE APPLICATION ]
       |               |
       +------> [ SENTINEL AI AUDITOR ] (Gemini Semantic Check)
                       |
        +--------------+--------------+
        |                             |
[ VERIFIED SUCCESS ]          [ CRITICAL FAILURE ]
        |                             |
  Finalize $0.50               Trigger Rollback
  Release Payment              Refund Escrow
```

---

## 💸 Financial Logic: The "Zero-Waste" Circuit Breaker
Sentinel implements a high-stakes financial guardrail system:
1. **Pre-flight Liquidity Check**: Before any build starts, the system verifies the Locus Wallet has sufficient funds.
2. **The Escrow Lock**: Upon deployment, **$0.50 USDC** is virtually earmarked.
3. **Outcome-Based Settlement**: 
   - **On Verified Success**: If the AI Auditor confirms SSL, Uptime, and Semantic Alignment, the payment is released to the network.
   - **On Sentinel Rollback**: If a failure is detected, the infrastructure is de-provisioned immediately, and the **$0.50 is refunded** to your balance. **Total capital preserved.**

---

## 🔍 Live Logic Walkthrough

### 1. The Autonomous Deployment
As soon as you enter a command like *"Deploy a Next.js app with a Postgres DB,"* the orchestrator provisions a Locus PaaS container. You will see the **Live SSE Stream** log `[Locus PaaS] Container provisioned successfully.`

### 2. The Semantic Audit
Once live, the **Sentinel Status Panel** initiates a scan. It doesn't just check if the site is "up"—it uses LLM analysis to verify the site content matches your original intent. You'll see the **Framer Motion scanning animation** activate as Gemini probes the live URL.

### 3. The Transaction Manifest
The most revolutionary part: the **Transaction Manifest** box appears in the audit results. It shows you the exact financial status of the build—either **'Settled'** (Success) or **'Funds Secure'** (Rollback).

---

## 📦 Tech Stack
- **Frontend**: Next.js 15, Tailwind CSS, Framer Motion (Scanning FX).
- **Backend**: Node.js Express (SSE Orchestrator).
- **AI**: Gemini Pro (via `@google/genai`).
- **Payments**: Locus Paygentic (Base Mainnet).
- **Automation**: Playwright (for perfectly smooth demo recording).

## 🚀 Getting Started
```bash
# 1. Install
npm install

# 2. Environment (.env)
LOCUS_API_KEY=your_key
LOCUS_WALLET_ADDRESS=your_wallet
GEMINI_API_KEY=your_gemini_key

# 3. Run
npm run dev
```

---
*Powered by Locus Paygentic. Infrastructure Semantics: Verified.*
