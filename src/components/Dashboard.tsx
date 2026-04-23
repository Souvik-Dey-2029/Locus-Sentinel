'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, ShieldCheck, ShieldAlert, Activity, Globe, RotateCcw, CheckCircle, XCircle, Wallet, AlertOctagon, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [intent, setIntent] = useState('');
  const [githubUrl, setGithubUrl] = useState('https://github.com/user/nextjs-postgres-template');
  const [logs, setLogs] = useState<string[]>(['System initialized. Ready for command.']);
  const [status, setStatus] = useState<'IDLE' | 'Deploying...' | 'Auditing...' | 'Rollback Initiated' | 'Audit Passed' | 'Rolled Back' | 'Error'>('IDLE');
  
  // Sentinel State
  const [sslStatus, setSslStatus] = useState<'pending' | 'checking' | 'passed' | 'failed'>('pending');
  const [uptimeStatus, setUptimeStatus] = useState<'pending' | 'checking' | 'passed' | 'failed'>('pending');
  const [outcomeStatus, setOutcomeStatus] = useState<'pending' | 'checking' | 'passed' | 'failed'>('pending');
  const [txResult, setTxResult] = useState<any>(null);

  // Wallet State
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isSafetyLocked, setIsSafetyLocked] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchWalletStatus = async () => {
    try {
      const res = await fetch('/api/wallet/status');
      const data = await res.json();
      setBalance(data.balance);
      setTransactions(data.transactions || []);
      setIsSafetyLocked(data.isSafetyLocked);
      setIsDemoMode(data.isDemoMode);
    } catch (err) {
      console.error('Failed to fetch wallet status');
    }
  };

  useEffect(() => {
    fetchWalletStatus();
    const interval = setInterval(fetchWalletStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intent || !githubUrl || isSafetyLocked) return;

    setStatus('Deploying...');
    setLogs(['[System] Initializing Natural Language Infrastructure Manager...']);
    setSslStatus('pending');
    setUptimeStatus('pending');
    setOutcomeStatus('pending');
    setTxResult(null);

    const encodedUrl = encodeURIComponent(githubUrl);
    const encodedIntent = encodeURIComponent(intent);
    const eventSource = new EventSource(`/api/sentinel-flow?repoUrl=${encodedUrl}&intent=${encodedIntent}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.log) {
        setLogs(prev => [...prev, data.log]);
      }
      
      if (data.txResult) {
        setTxResult(data.txResult);
      }
      
      if (data.status) {
        setStatus(data.status);
        
        if (data.status === 'Auditing...') {
          setSslStatus('checking');
          setUptimeStatus('checking');
          setOutcomeStatus('checking');
        } else if (data.status === 'Audit Passed') {
          setSslStatus('passed');
          setUptimeStatus('passed');
          setOutcomeStatus('passed');
          eventSource.close();
          fetchWalletStatus();
        } else if (data.status === 'Rollback Initiated' || data.status === 'Rolled Back') {
          setSslStatus('passed'); 
          setUptimeStatus('passed');
          setOutcomeStatus('failed');
          if (data.status === 'Rolled Back') {
            eventSource.close();
            fetchWalletStatus();
          }
        } else if (data.status === 'Error') {
          eventSource.close();
          fetchWalletStatus();
        }
      }
    };

    eventSource.onerror = () => {
      setLogs(prev => [...prev, '[Error] SSE connection lost.']);
      setStatus('Error');
      eventSource.close();
      fetchWalletStatus();
    };
  };

  const getIndicatorColor = (state: string) => {
    switch (state) {
      case 'passed': return 'text-[#00f2ff] shadow-[#00f2ff]';
      case 'failed': return 'text-red-500 shadow-red-500';
      case 'checking': return 'text-yellow-400 shadow-yellow-400 animate-pulse';
      default: return 'text-gray-600 shadow-none';
    }
  };

  const getIndicatorBg = (state: string) => {
    switch (state) {
      case 'passed': return 'bg-[#00f2ff]/20 border-[#00f2ff]';
      case 'failed': return 'bg-red-500/20 border-red-500';
      case 'checking': return 'bg-yellow-400/20 border-yellow-400';
      default: return 'bg-[#111] border-[#333]';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] p-6 font-sans">
      <header className="mb-8 border-b border-[#333] pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.8)]" />
          <h1 className="text-3xl font-bold tracking-wider">LOCUS <span className="text-[#00f2ff]">SENTINEL</span></h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-[#111] border border-[#333] px-4 py-2 rounded-lg relative overflow-hidden group">
              <Wallet className="w-4 h-4 text-[#00f2ff]" />
              <span className="font-mono text-sm text-gray-300">Base USDC:</span>
              <span className={`font-mono font-bold text-lg ${balance !== null && balance < 5 ? 'text-red-500 animate-pulse' : 'text-[#00ff41]'}`}>
                {balance !== null ? `$${balance.toFixed(2)}` : '...'}
              </span>
              {isDemoMode && (
                <span className="ml-2 text-[10px] bg-[#00f2ff]/20 text-[#00f2ff] px-2 py-0.5 rounded-full border border-[#00f2ff]/50 font-mono tracking-widest uppercase">
                  Demo Mode
                </span>
              )}
            </div>
          </div>
          <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase flex items-center gap-2">
            <span>Powered by Locus Paygentic</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-pulse drop-shadow-[0_0_5px_rgba(0,242,255,1)]"></span>
          </div>
        </div>
      </header>

      {/* Action Bar */}
      <div className={`max-w-7xl mx-auto mb-8 bg-[#111] border ${isSafetyLocked ? 'border-red-500/30' : 'border-[#00f2ff]/30'} p-6 rounded-xl shadow-[0_0_15px_rgba(0,242,255,0.1)] transition-colors duration-300 relative`}>
        <form onSubmit={handleCommand} className="flex flex-col md:flex-row gap-4 items-end relative z-10">
          <div className="w-full md:w-1/3">
            <label className="text-xs text-[#00f2ff] uppercase tracking-widest mb-1 block font-mono">Target Repository</label>
            <input 
              type="text" 
              value={githubUrl}
              onChange={e => setGithubUrl(e.target.value)}
              disabled={isSafetyLocked}
              className="w-full bg-[#050505] border border-[#333] focus:border-[#00f2ff] rounded-lg px-4 py-3 text-sm font-mono text-gray-300 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="w-full md:w-2/3 relative group">
            <label className="text-xs text-[#00f2ff] uppercase tracking-widest mb-1 block font-mono">Infrastructure Intent</label>
            <div className="relative">
              <input
                type="text"
                value={intent}
                onChange={e => setIntent(e.target.value)}
                disabled={isSafetyLocked || (status !== 'IDLE' && status !== 'Audit Passed' && status !== 'Rolled Back' && status !== 'Error')}
                placeholder="e.g., Deploy a Next.js app with a Postgres DB. Simulate fail if needed..."
                className={`w-full bg-[#050505] border-2 ${isSafetyLocked ? 'border-red-500/50' : 'border-[#00f2ff]/50 focus:border-[#00f2ff]'} rounded-lg pl-4 pr-32 py-3 text-base outline-none transition-colors shadow-[0_0_10px_rgba(0,242,255,0.1)_inset] disabled:opacity-50`}
              />
              <div className="absolute right-1 top-1 bottom-1 group-hover:tooltip">
                <button 
                  type="submit"
                  disabled={isSafetyLocked || (status !== 'IDLE' && status !== 'Audit Passed' && status !== 'Rolled Back' && status !== 'Error')}
                  className={`h-full px-6 rounded-md font-bold transition-all flex items-center gap-2 ${isSafetyLocked ? 'bg-red-500/20 text-red-500 border border-red-500 cursor-not-allowed' : 'bg-[#00f2ff] text-black hover:bg-[#00c2cc] disabled:opacity-50 disabled:cursor-not-allowed'}`}
                >
                  COMMAND <Send className="w-4 h-4" />
                </button>
                {isSafetyLocked && (
                  <div className="absolute top-full mt-2 right-0 bg-red-900 border border-red-500 text-white text-xs p-2 rounded w-64 shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <AlertOctagon className="w-4 h-4 inline mr-1 mb-0.5" />
                    <strong>Protocol Halted:</strong> Minimum Liquidity for Sentinel Audit not met.
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto h-[550px]">
        {/* Left Side: Terminal Stream */}
        <div className="lg:col-span-2 bg-[#050505] border border-[#222] rounded-xl flex flex-col overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f2ff]/50 to-transparent"></div>
          <div className="bg-[#111] border-b border-[#222] p-3 flex justify-between items-center">
            <h2 className="text-sm font-mono font-bold flex items-center gap-2 text-[#00f2ff]">
              <Terminal className="w-4 h-4" /> LIVE_SSE_STREAM
            </h2>
            <span className="text-xs font-mono text-gray-500 uppercase">{status}</span>
          </div>
          <div className="p-5 font-mono text-sm overflow-y-auto flex-grow flex flex-col gap-1 text-[#00ff41]">
            {logs.map((log, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={i} 
                className={`leading-relaxed ${log.includes('CRITICAL') || log.includes('Error') || log.includes('failed') || log.includes('FATAL') || log.includes('Aborted') ? 'text-red-500 font-bold' : ''} ${log.includes('passed') || log.includes('LIVE') || log.includes('Financial') || log.includes('FinTech') ? 'text-[#00f2ff]' : ''}`}
              >
                <span className="opacity-50 mr-2">{'>'}</span>{log}
              </motion.div>
            ))}
            {(status === 'Deploying...' || status === 'Auditing...' || status === 'Rollback Initiated') && (
              <motion.div 
                animate={{ opacity: [1, 0, 1] }} 
                transition={{ repeat: Infinity, duration: 1 }} 
                className="mt-2 text-[#00f2ff]"
              >
                _
              </motion.div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Right Side: Sentinel Status Panel */}
        <div className="bg-[#111] border border-[#222] rounded-xl flex flex-col relative overflow-hidden shadow-2xl">
          {/* Scanning Animation overlay */}
          {status === 'Auditing...' && (
            <motion.div 
              className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#00f2ff]/20 to-transparent z-10 pointer-events-none"
              animate={{ top: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
            />
          )}

          <div className="bg-[#1a1a1a] border-b border-[#333] p-6 text-center relative z-20">
            <ShieldCheck className={`w-12 h-12 mx-auto mb-3 ${status === 'Audit Passed' ? 'text-[#00f2ff] drop-shadow-[0_0_15px_rgba(0,242,255,0.8)]' : 'text-gray-600'}`} />
            <h2 className="text-xl font-bold tracking-widest text-white">SENTINEL STATUS</h2>
            <div className="mt-2 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-black border border-[#333]">
              <div className={`w-2 h-2 rounded-full ${status === 'Auditing...' ? 'bg-yellow-400 animate-pulse' : status === 'Audit Passed' ? 'bg-[#00f2ff]' : status === 'Rolled Back' ? 'bg-red-500' : 'bg-gray-600'}`}></div>
              <span className="font-mono text-xs uppercase tracking-wider">{status}</span>
            </div>
          </div>
          
          <div className="p-6 flex-grow flex flex-col gap-4 relative z-20 overflow-y-auto">
            
            {/* Indicators */}
            <div className={`p-3 rounded-lg border flex items-center justify-between transition-all duration-500 ${getIndicatorBg(sslStatus)}`}>
              <div className="flex items-center gap-3">
                <Globe className={`w-5 h-5 ${getIndicatorColor(sslStatus)}`} />
                <span className="font-bold text-sm">SSL Certificate</span>
              </div>
              <div>
                {sslStatus === 'passed' ? <CheckCircle className="w-4 h-4 text-[#00f2ff]" /> : sslStatus === 'failed' ? <XCircle className="w-4 h-4 text-red-500" /> : <div className="text-[10px] font-mono uppercase text-gray-500">Wait</div>}
              </div>
            </div>

            <div className={`p-3 rounded-lg border flex items-center justify-between transition-all duration-500 ${getIndicatorBg(uptimeStatus)}`}>
              <div className="flex items-center gap-3">
                <Activity className={`w-5 h-5 ${getIndicatorColor(uptimeStatus)}`} />
                <span className="font-bold text-sm">Uptime & Health</span>
              </div>
              <div>
                {uptimeStatus === 'passed' ? <CheckCircle className="w-4 h-4 text-[#00f2ff]" /> : uptimeStatus === 'failed' ? <XCircle className="w-4 h-4 text-red-500" /> : <div className="text-[10px] font-mono uppercase text-gray-500">Wait</div>}
              </div>
            </div>

            <div className={`p-3 rounded-lg border flex items-center justify-between transition-all duration-500 ${getIndicatorBg(outcomeStatus)}`}>
              <div className="flex items-center gap-3">
                {outcomeStatus === 'failed' ? <ShieldAlert className={`w-5 h-5 ${getIndicatorColor(outcomeStatus)}`} /> : <ShieldCheck className={`w-5 h-5 ${getIndicatorColor(outcomeStatus)}`} />}
                <span className="font-bold text-sm">Outcome Match</span>
              </div>
              <div>
                {outcomeStatus === 'passed' ? <CheckCircle className="w-4 h-4 text-[#00f2ff]" /> : outcomeStatus === 'failed' ? <XCircle className="w-4 h-4 text-red-500" /> : <div className="text-[10px] font-mono uppercase text-gray-500">Wait</div>}
              </div>
            </div>

            {/* Rollback Alert & Transaction Manifest */}
            {status === 'Rolled Back' && txResult && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-auto bg-red-500/10 border border-red-500 rounded-lg p-4 flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <RotateCcw className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-red-500 font-bold uppercase tracking-wider mb-1 text-xs">Rollback Executed</h4>
                    <p className="text-[10px] text-red-200 leading-tight">Critical failure detected. Application halted.</p>
                  </div>
                </div>
                {/* Transaction Manifest */}
                <div className="bg-black/40 border border-red-500/30 rounded p-2 mt-2">
                  <h5 className="text-[9px] uppercase tracking-widest text-gray-400 mb-2 border-b border-[#333] pb-1">Transaction Manifest</h5>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-gray-400">Gas Saved:</span>
                    <span className="text-green-400 font-bold">${txResult.escrowedAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono mt-1">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-green-400 font-bold animate-pulse">Funds Secure</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Success Alert & Transaction Manifest */}
            {status === 'Audit Passed' && txResult && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-auto bg-[#00f2ff]/10 border border-[#00f2ff] rounded-lg p-4 flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#00f2ff] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[#00f2ff] font-bold uppercase tracking-wider mb-1 text-xs">Deployment Verified</h4>
                    <p className="text-[10px] text-[#00f2ff]/70 leading-tight">Sentinel confirms intent match. Escrow released.</p>
                  </div>
                </div>
                {/* Transaction Manifest */}
                <div className="bg-black/40 border border-[#00f2ff]/30 rounded p-2 mt-2">
                  <h5 className="text-[9px] uppercase tracking-widest text-gray-400 mb-2 border-b border-[#333] pb-1">Transaction Manifest</h5>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-gray-400">Payment:</span>
                    <span className="text-[#00f2ff] font-bold">${txResult.escrowedAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono mt-1">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-[#00f2ff] font-bold animate-pulse">Settled</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Core: Recent Transactions */}
      <div className="max-w-7xl mx-auto mt-8 bg-[#111] border border-[#222] rounded-xl shadow-xl overflow-hidden">
        <div className="bg-[#1a1a1a] border-b border-[#333] p-4 flex justify-between items-center">
          <h2 className="font-mono font-bold text-gray-300 flex items-center gap-2 text-sm tracking-wider">
            <Wallet className="w-4 h-4" /> RECENT_TRANSACTIONS
          </h2>
        </div>
        <div className="p-4 overflow-x-auto">
          {transactions.length === 0 ? (
            <p className="text-gray-600 text-sm italic font-mono p-4 text-center">No recent transactions recorded.</p>
          ) : (
            <table className="w-full text-left text-sm font-mono border-collapse">
              <thead>
                <tr className="border-b border-[#333] text-gray-500 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 font-normal">TxID</th>
                  <th className="py-3 px-4 font-normal">Amount</th>
                  <th className="py-3 px-4 font-normal">Status</th>
                  <th className="py-3 px-4 font-normal">Sentinel Reason</th>
                  <th className="py-3 px-4 font-normal text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-[#222] hover:bg-[#1a1a1a]/50 transition-colors">
                    <td className="py-3 px-4 text-gray-400">{tx.id.substring(0, 10)}...</td>
                    <td className="py-3 px-4 font-bold text-white">${tx.amount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-widest ${tx.status === 'PAID' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className={`py-3 px-4 ${tx.status === 'REFUNDED' ? 'text-red-400' : 'text-[#00f2ff]'}`}>
                      {tx.reason}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-500 text-xs">
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* System Info Footer */}
      <footer className="max-w-7xl mx-auto mt-12 border-t border-[#333] pt-6 pb-8 flex flex-wrap justify-between gap-6 font-mono text-[10px] text-gray-500 uppercase tracking-widest">
        <div className="flex flex-col gap-1">
          <span className="text-[#00f2ff]/60">Orchestrator</span>
          <span className="text-gray-300">Locus Sentinel v1.0</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[#00f2ff]/60">Infrastructure</span>
          <span className="text-gray-300">BuildWithLocus (Agent-Native PaaS)</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[#00f2ff]/60">Payment Layer</span>
          <span className="text-gray-300">Locus Paygentic (Base Mainnet)</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[#00f2ff]/60">Status</span>
          <span className="flex items-center gap-2 text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            Operational
          </span>
        </div>
      </footer>
    </div>
  );
}
