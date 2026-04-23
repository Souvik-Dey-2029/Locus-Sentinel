# Locus Sentinel

**Natural Language Infrastructure Manager & AI Auditor**

Locus Sentinel is a high-tech "NOC" dashboard built for the Locus Paygentic Hackathon. it allows developers to deploy complex infrastructure (Next.js, Postgres, etc.) using simple natural language commands, while an AI "Sentinel" continuously audits the live deployment to ensure intent-alignment and financial safety.

## 💎 Why Locus Sentinel?
- **Outcome-Based Finance**: The first protocol to link LLM-based semantic verification directly to Locus Paygentic financial settlement.
- **The Circuit Breaker**: Implements a "Pre-flight Liquidity Check" to prevent orphaned deployments.
- **Zero-Waste Infrastructure**: Automatically de-provisions faulty environments to ensure 0% capital bleed on broken builds.
- **Forensic Transparency**: Provides a real-time "Transaction Manifest" for every AI-driven infrastructure change.

## 🚀 Core Mission
- **Natural Language Ops**: Deploy apps via Locus API using chat-like commands.
- **AI Sentinel Audit**: Automatically audits live URLs for performance, SSL, and content intent.
- **Capital Guardian**: Built-in financial circuit breaker using Locus Wallet to prevent wasted spend on faulty deployments.
- **Auto-Rollback**: If the Sentinel detects a failure (e.g., Database Connection Error), it triggers an immediate infrastructure rollback and refunds the escrow.

## 🛠 Tech Stack
- **Frontend**: Next.js 15, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js (Express) Orchestrator.
- **AI**: Gemini Pro (via `@google/genai`).
- **Payments**: Locus Paygentic (Base Mainnet / USDC).
- **Infrastructure**: BuildWithLocus (Agent-Native PaaS).

## 📦 Getting Started

### 1. Prerequisites
- Node.js 18+
- Locus API Key & Wallet Address
- Gemini API Key

### 2. Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd Locus

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
LOCUS_API_KEY=your_key_here
LOCUS_WALLET_ADDRESS=your_wallet_address
GEMINI_API_KEY=your_gemini_key
MAX_TRANSACTION_THRESHOLD=50.00
```

### 4. Run the Dashboard
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the NOC Dashboard.

## 🛡 Features
- **Escrow Lock**: Funds are held in virtual escrow during deployment.
- **Transaction Manifest**: Detailed forensics on gas saved and settlement status.
- **Live SSE Stream**: Real-time telemetry from the orchestrator.
- **Safety Protocol**: Automated lockdown if wallet balance falls below $1.00.

---
*Built with ❤️ for the Locus Paygentic Hackathon.*
