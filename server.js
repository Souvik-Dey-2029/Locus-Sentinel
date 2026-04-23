require('dotenv').config();
const express = require('express');
const next = require('next');
const { deployApp, getDeploymentStatus, triggerRollback } = require('./locusService');
const { analyzeSiteContent } = require('./sentinelAuditor');
const { walletManager } = require('./walletManager');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = express();
  server.use(express.json());

  const activeStreams = new Map();

  function sendSseUpdate(deployId, update) {
    const res = activeStreams.get(deployId);
    if (res) {
      res.write(`data: ${JSON.stringify(update)}\n\n`);
    }
  }

  // Wallet Status endpoint
  server.get('/api/wallet/status', async (req, res) => {
    const details = await walletManager.getBalanceDetails();
    const transactions = walletManager.getRecentTransactions();
    res.json({
      balance: details.balance,
      isDemoMode: details.isDemo,
      transactions,
      isSafetyLocked: details.balance < 1.00
    });
  });

  // /api/sentinel-flow
  server.get('/api/sentinel-flow', async (req, res) => {
    const { repoUrl, intent } = req.query;

    if (!repoUrl || !intent) {
      return res.status(400).json({ error: 'repoUrl and intent are required.' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let deployId = null;
    const estimatedCost = 0.50; // Settlement simulation requires 0.50 as per prompt

    try {
      res.write(`data: ${JSON.stringify({ status: 'Deploying...', log: '[System] Initiating Financial Core checks...' })}\n\n`);
      const guardianCheck = await walletManager.checkGuardian(estimatedCost);
      
      if (!guardianCheck.allowed) {
        if (guardianCheck.reason === 'SAFETY_PROTOCOL_TRIGGERED') {
          res.write(`data: ${JSON.stringify({ status: 'Error', log: '[Financial Core] FATAL: Balance below $1.00. Safety Protocol Triggered. Deployments halted.' })}\n\n`);
        } else {
          res.write(`data: ${JSON.stringify({ status: 'Error', log: '[Financial Core] Allowance Guardian blocked deployment: ' + guardianCheck.reason })}\n\n`);
        }
        return res.end();
      }

      const tempId = 'temp_' + Date.now();
      await walletManager.escrowLock(tempId, estimatedCost);
      res.write(`data: ${JSON.stringify({ status: 'Deploying...', log: '[Financial Core] Escrow locked $' + estimatedCost.toFixed(2) + '. Allowance Guardian Passed.' })}\n\n`);

      res.write(`data: ${JSON.stringify({ status: 'Deploying...', log: '[System] Initiating deployment via Locus API...' })}\n\n`);
      const deployResponse = await deployApp(repoUrl, { INTENT: intent });
      deployId = deployResponse.deploymentId;
      
      walletManager.escrows.set(deployId, estimatedCost);
      walletManager.escrows.delete(tempId);

      activeStreams.set(deployId, res);
      res.write(`data: ${JSON.stringify({ status: 'Deploying...', log: '[Locus PaaS] Container provisioned successfully. Deployment started. ID: ' + deployId })}\n\n`);

      let isLive = false;
      let liveUrl = null;
      
      const pollInterval = setInterval(async () => {
        try {
          sendSseUpdate(deployId, { status: 'Deploying...', log: '[Locus API] Polling deployment status...' });
          const statusRes = await getDeploymentStatus(deployId);
          
          if (statusRes.status === 'LIVE') {
            clearInterval(pollInterval);
            isLive = true;
            liveUrl = statusRes.url;
            sendSseUpdate(deployId, { status: 'Auditing...', log: '[Locus API] App is LIVE at ' + liveUrl });
            
            sendSseUpdate(deployId, { status: 'Auditing...', log: '[Sentinel] Waking up AI Auditor...' });
            sendSseUpdate(deployId, { status: 'Auditing...', log: '[Sentinel] Fetching HTML from ' + liveUrl });
            
            const auditResult = await analyzeSiteContent(liveUrl, intent);
            
            if (auditResult.isSuccess === false) {
              // Rollback Phase
              sendSseUpdate(deployId, { 
                status: 'Rollback Initiated', 
                log: '[Sentinel] CRITICAL: Audit failed. Errors: ' + auditResult.criticalErrors.join(', ') 
              });
              sendSseUpdate(deployId, { status: 'Rollback Initiated', log: '[Sentinel] Triggering Locus Rollback API...' });
              
              await triggerRollback(deployId);
              
              const txResult = await walletManager.finalizeTransaction(deployId, false, 'Payment Blocked: ' + (auditResult.criticalErrors[0] || 'Audit Failed'));

              // Smart Settlement Simulation - Rollback
              sendSseUpdate(deployId, { status: 'Rolled Back', log: '[FinTech] 🛡️ Transaction Aborted. $0.00 debited. Capital preserved via Sentinel Rollback.', auditResult, txResult });
            } else {
              // Success Phase
              const txResult = await walletManager.finalizeTransaction(deployId, true, 'Payment Released: Audit Passed');

              // Smart Settlement Simulation - Success
              if (txResult && txResult.settlementDetails && txResult.settlementDetails.simulated) {
                sendSseUpdate(deployId, { status: 'Audit Passed', log: '[FinTech] ✅ Audit Passed. Finalizing $' + estimatedCost.toFixed(2) + ' Settlement... [Demo Mode: Transaction Simulated]', auditResult, txResult });
              } else {
                sendSseUpdate(deployId, { status: 'Audit Passed', log: '[FinTech] ✅ Audit Passed. Finalizing $' + estimatedCost.toFixed(2) + ' Settlement to Locus Network.', auditResult, txResult });
              }
              sendSseUpdate(deployId, { status: 'Audit Passed', log: '[Sentinel] 🌌 INFRASTRUCTURE SEMANTICS VERIFIED. MISSION COMPLETE.' });
            }
            
            activeStreams.delete(deployId);
            res.end();
          } else if (statusRes.status === 'FAILED') {
            clearInterval(pollInterval);
            await walletManager.finalizeTransaction(deployId, false, 'Payment Blocked: Deployment Infrastructure Failed');
            sendSseUpdate(deployId, { status: 'Failed', log: '[Locus API] Deployment failed at infrastructure level. Escrow refunded.' });
            activeStreams.delete(deployId);
            res.end();
          }
        } catch (pollErr) {
          console.error('[Polling Error]', pollErr);
        }
      }, 5000);

      req.on('close', () => {
        clearInterval(pollInterval);
        if (deployId) activeStreams.delete(deployId);
      });

    } catch (err) {
      res.write(`data: ${JSON.stringify({ status: 'Error', log: '[System] Fatal Error: ' + err.message })}\n\n`);
      res.end();
    }
  });

  server.use((req, res) => {
    return handle(req, res);
  });

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
