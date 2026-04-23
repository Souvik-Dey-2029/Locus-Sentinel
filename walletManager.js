require('dotenv').config();
const axios = require('axios');

class WalletManager {
  constructor() {
    this.apiKey = process.env.LOCUS_API_KEY;
    this.walletAddress = process.env.LOCUS_WALLET_ADDRESS;
    this.maxTransactionThreshold = parseFloat(process.env.MAX_TRANSACTION_THRESHOLD || 50);
    this.baseURL = 'https://beta-api.paywithlocus.com/v1';

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    this.recentTransactions = [];
    this.escrows = new Map();

    // Hybrid Balance Engine fallback
    this.demoBalance = 10.00; 
    this.isDemoMode = false;
  }

  async getBalanceDetails() {
    try {
      if (process.env.USE_REAL_LOCUS_API === 'true') {
        const response = await this.axiosInstance.get('/api/pay/balance');
        const bal = parseFloat(response.data.balance);
        if (bal > 0) {
          this.isDemoMode = false;
          return { balance: bal, isDemo: false };
        }
      }
      throw new Error("Zero Balance or Mock API enabled");
    } catch (err) {
      this.isDemoMode = true;
      return { balance: this.demoBalance, isDemo: true };
    }
  }

  async getBalance() {
    const details = await this.getBalanceDetails();
    return details.balance;
  }

  // Smart Settlement Simulation - POST /api/pay
  async settlePayment(amount) {
    try {
      if (!this.isDemoMode && process.env.USE_REAL_LOCUS_API === 'true') {
        await this.axiosInstance.post('/api/pay', { amount, currency: 'USDC' });
        return { success: true, simulated: false };
      }
      throw new Error("Demo Mode Override");
    } catch (err) {
      // Catch and simulate
      this.demoBalance -= amount; // Deduct from demo pool
      return { success: true, simulated: true };
    }
  }

  async checkGuardian(estimatedCost) {
    const currentBalance = await this.getBalance();
    
    if (currentBalance < 1.00) {
      return { allowed: false, reason: 'SAFETY_PROTOCOL_TRIGGERED', balance: currentBalance };
    }

    if (estimatedCost > this.maxTransactionThreshold) {
      return { allowed: false, reason: 'EXCEEDS_THRESHOLD', balance: currentBalance };
    }

    if (currentBalance < estimatedCost) {
      return { allowed: false, reason: 'INSUFFICIENT_FUNDS', balance: currentBalance };
    }

    return { allowed: true, balance: currentBalance };
  }

  async escrowLock(deploymentId, estimatedCost) {
    const guardianCheck = await this.checkGuardian(estimatedCost);
    
    if (!guardianCheck.allowed) {
      throw new Error(`Escrow Lock Failed: ${guardianCheck.reason}`);
    }

    this.escrows.set(deploymentId, estimatedCost);
    if (this.isDemoMode) {
      this.demoBalance -= estimatedCost;
    }
    return true;
  }

  async finalizeTransaction(deploymentId, isSuccess, sentinelReason) {
    const escrowedAmount = this.escrows.get(deploymentId);
    if (!escrowedAmount) return null;

    let settlementDetails = null;

    if (isSuccess) {
      // Settlement Phase
      settlementDetails = await this.settlePayment(escrowedAmount);
      
      this.recentTransactions.unshift({
        id: `tx_${Date.now()}`,
        deploymentId,
        amount: escrowedAmount,
        status: 'PAID',
        reason: sentinelReason,
        timestamp: new Date().toISOString()
      });
    } else {
      // Rollback Phase
      if (this.isDemoMode) {
        this.demoBalance += escrowedAmount; // Refund demo pool
      }
      this.recentTransactions.unshift({
        id: `tx_${Date.now()}`,
        deploymentId,
        amount: escrowedAmount,
        status: 'REFUNDED',
        reason: sentinelReason,
        timestamp: new Date().toISOString()
      });
    }

    this.escrows.delete(deploymentId);
    return { escrowedAmount, settlementDetails };
  }

  getRecentTransactions() {
    return this.recentTransactions;
  }
}

const walletManager = new WalletManager();
module.exports = { walletManager };
