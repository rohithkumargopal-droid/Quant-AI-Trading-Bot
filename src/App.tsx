import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, LineChart, Line } from 'recharts';
import { generateHistoricalData, runBacktest } from './lib/utils';
import { generatePythonCode } from './lib/pythonBotCode';
import { Activity, Play, Terminal, Settings, RefreshCcw, Download, ArrowUpRight, ArrowDownRight, Server, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [asset, setAsset] = useState('AAPL');
  const [platform, setPlatform] = useState('Alpaca API');
  const [capitalPercent, setCapitalPercent] = useState(2.0);
  const [stopLoss, setStopLoss] = useState(1.5);
  const [takeProfit, setTakeProfit] = useState(3.0);
  const [killSwitch, setKillSwitch] = useState(5.0);

  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'BACKTEST' | 'PYTHON'>('BACKTEST');
  const [data, setData] = useState<any[]>([]);
  const [results, setResults] = useState<any>(null);

  // Initialize and run backtest
  const runAnalysis = () => {
    setIsRunning(true);
    // Simulate API fetch delay
    setTimeout(() => {
      const startPrice = asset === 'BTC/USDT' ? 60000 : 150.0;
      const hData = generateHistoricalData(730, startPrice); // 2 years
      setData(hData.slice(200)); // Remove initial burn-in period for 200 SMA

      const backtestResult = runBacktest(hData, capitalPercent, stopLoss, takeProfit);
      setResults(backtestResult);
      setIsRunning(false);
    }, 1500);
  };

  useEffect(() => {
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset]);

  const pCode = generatePythonCode(asset, platform, capitalPercent, stopLoss, takeProfit, killSwitch);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e4e4e7] font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      {/* HEADER */}
      <header className="h-16 border-b border-[#27272a] bg-[#0a0a0b] px-6 lg:px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">QuantBot AI</h1>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
          <div className="p-2 border border-[#27272a] bg-[#141416] rounded flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
            <span className="text-zinc-300">ENGINE ONLINE</span>
          </div>
          <span className="opacity-50">LATENCY: 12ms</span>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          
          {/* HARDWARE WIDGET STYLE SIDEBAR */}
          <aside className="glass-card rounded-xl p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-4">Trading Parameters</h2>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Target Asset</label>
                  <select 
                    value={asset}
                    onChange={(e) => setAsset(e.target.value)}
                    className="bg-[#0a0a0b] border border-[#27272a] rounded-lg p-2.5 text-sm font-mono focus:border-blue-500 outline-none text-[#e4e4e7]"
                  >
                    <option value="AAPL">AAPL (Apple Inc.)</option>
                    <option value="MSFT">MSFT (Microsoft)</option>
                    <option value="BTC/USDT">BTC/USDT (Bitcoin)</option>
                    <option value="ETH/USDT">ETH/USDT (Ethereum)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Execution Platform</label>
                  <select 
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="bg-[#0a0a0b] border border-[#27272a] rounded-lg p-2.5 text-sm font-mono focus:border-blue-500 outline-none text-[#e4e4e7]"
                  >
                    <option value="Alpaca API">Alpaca API (Equities)</option>
                    <option value="Binance API">Binance API (Crypto)</option>
                    <option value="MetaTrader 5">MetaTrader 5 (Forex)</option>
                  </select>
                </div>

                <hr className="border-[#27272a]" />

                <h2 className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mt-2">Risk Management</h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-1"><Server size={10}/> Pos Size (%)</label>
                    <span className="font-mono text-sm text-blue-400">{capitalPercent.toFixed(1)}%</span>
                  </div>
                  <input type="range" min="0.5" max="10" step="0.5" value={capitalPercent} onChange={(e) => setCapitalPercent(parseFloat(e.target.value))} className="w-full accent-blue-600 h-1.5 bg-[#27272a] rounded-lg appearance-none cursor-pointer" />

                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-1"><ArrowDownRight size={10} className="text-red-400"/> Stop Loss (%)</label>
                    <span className="font-mono text-sm text-red-400">{stopLoss.toFixed(1)}%</span>
                  </div>
                  <input type="range" min="0.5" max="10" step="0.5" value={stopLoss} onChange={(e) => setStopLoss(parseFloat(e.target.value))} className="w-full h-1.5 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-red-500" />

                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-1"><ArrowUpRight size={10} className="text-emerald-400"/> Take Profit (%)</label>
                    <span className="font-mono text-sm text-emerald-400">{takeProfit.toFixed(1)}%</span>
                  </div>
                  <input type="range" min="1.0" max="15" step="0.5" value={takeProfit} onChange={(e) => setTakeProfit(parseFloat(e.target.value))} className="w-full h-1.5 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-emerald-500" />

                  <div className="flex justify-between items-center pt-4 border-t border-[#27272a]">
                    <label className="text-[10px] uppercase tracking-wider text-red-500 font-bold flex items-center gap-1"><ShieldAlert size={10}/> Daily Kill Switch</label>
                    <span className="font-mono text-sm text-red-500">{'>'}{killSwitch.toFixed(1)}%</span>
                  </div>
                  <input type="range" min="1.0" max="25" step="0.5" value={killSwitch} onChange={(e) => setKillSwitch(parseFloat(e.target.value))} className="w-full accent-red-600 h-1.5 bg-[#27272a] rounded-lg appearance-none cursor-pointer" />
                </div>
              </div>
            </div>

            <button 
              onClick={runAnalysis}
              disabled={isRunning}
              className="mt-auto w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold tracking-wide text-sm py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
            >
              {isRunning ? <RefreshCcw size={16} className="animate-spin" /> : <Play size={16} />}
              {isRunning ? "Simulating Market..." : "Run Historical Backtest"}
            </button>
          </aside>

          {/* MAIN PANELS */}
          <div className="flex flex-col gap-6 h-[80vh] min-h-[600px]">
             
             {/* STATS STRIP */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 rounded-xl flex flex-col justify-center">
                  <span className="text-[10px] bg-transparent uppercase font-bold tracking-wider text-zinc-500">Win Rate (2Yr)</span>
                  <div className="font-mono text-2xl font-bold mt-1 text-blue-400">
                    {results ? results.winRate.toFixed(1) + '%' : '--%'}
                  </div>
                </div>
                <div className="glass-card p-4 rounded-xl flex flex-col justify-center">
                  <span className="text-[10px] bg-transparent uppercase font-bold tracking-wider text-zinc-500">Max Drawdown</span>
                  <div className="font-mono text-2xl font-bold mt-1 text-red-500">
                    {results ? results.drawdown.toFixed(1) + '%' : '--%'}
                  </div>
                </div>
                <div className="glass-card p-4 rounded-xl flex flex-col justify-center">
                  <span className="text-[10px] bg-transparent uppercase font-bold tracking-wider text-zinc-500">Total Trades</span>
                  <div className="font-mono text-2xl font-bold mt-1 text-white">
                    {results ? results.totalTrades : '--'}
                  </div>
                </div>
                <div className="glass-card p-4 rounded-xl flex flex-col justify-center">
                  <span className="text-[10px] bg-transparent uppercase font-bold tracking-wider text-zinc-500">Sim. Final Equity</span>
                  <div className="font-mono text-2xl font-bold mt-1 text-emerald-400">
                    {results ? '$' + results.finalEquity.toLocaleString(undefined, {maximumFractionDigits:0}) : '--'}
                  </div>
                </div>
             </div>

             {/* TABS & CONTENT PANELS */}
             <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden shadow-2xl">
                
                {/* TAB BAR */}
                <div className="flex border-b border-[#27272a] bg-[#0a0a0b]">
                  <button 
                    onClick={() => setActiveTab('BACKTEST')}
                    className={`flex-1 py-4 text-xs font-semibold uppercase tracking-wide ${activeTab === 'BACKTEST' ? 'bg-[#141416] text-blue-400 border-t-2 border-t-blue-500' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Strategy Sim Chart
                  </button>
                  <button 
                    onClick={() => setActiveTab('PYTHON')}
                    className={`flex-1 py-4 text-xs font-semibold uppercase tracking-wide flex items-center justify-center gap-2 ${activeTab === 'PYTHON' ? 'bg-[#141416] text-blue-400 border-t-2 border-t-blue-500' : 'text-zinc-400 hover:text- white'}`}
                  >
                    <Terminal size={14}/> Bot Script Gen
                  </button>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-hidden relative">
                  <AnimatePresence mode="wait">
                    {activeTab === 'BACKTEST' ? (
                      <motion.div 
                        key="backtest"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full p-4 flex flex-col"
                      >
                        <h3 className="text-xs uppercase font-bold text-zinc-500 mb-4">{asset} Historical Model (Last ~500 Days)</h3>
                        <div className="flex-1 min-h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                              <defs>
                                <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                              <XAxis dataKey="date" stroke="#71717a" fontSize={10} minTickGap={50} tickLine={false} axisLine={false} />
                              <YAxis domain={['auto', 'auto']} stroke="#71717a" fontSize={10} tickFormatter={(val) => `$${val.toFixed(0)}`} tickLine={false} axisLine={false} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#141416', borderColor: '#27272a', borderRadius: '8px' }}
                                itemStyle={{ color: '#e4e4e7' }}
                                labelStyle={{ color: '#71717a', fontWeight: 'bold' }}
                              />
                              <Area type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorClose)" />
                              <Line type="monotone" dataKey="sma50" stroke="#10b981" dot={false} strokeWidth={1} opacity={0.6}/>
                              <Line type="monotone" dataKey="sma200" stroke="#ef4444" dot={false} strokeWidth={1} opacity={0.6}/>
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="h-[120px] mt-4 border-t border-[#27272a] pt-4 overflow-y-auto font-mono text-xs">
                           <h4 className="text-zinc-500 font-bold uppercase mb-2">TRADE LOG</h4>
                           {results?.trades.slice(0, 50).map((t: any, i: number) => (
                             <div key={i} className="flex justify-between items-center py-1.5 border-b border-[#27272a] opacity-80 hover:opacity-100 transition-opacity">
                               <span className="w-24 text-zinc-500">{t.date}</span>
                               <span className={t.type === 'BUY' ? 'text-emerald-400' : 'text-blue-400'}>{t.type}</span>
                               <span className="text-zinc-300">{t.reason}</span>
                               <span className="text-zinc-400">@ ${t.price.toFixed(2)}</span>
                               {t.profit !== 0 ? (
                                  <span className={t.profit > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                    {t.profit > 0 ? '+' : ''}{t.profit.toFixed(2)}
                                  </span>
                               ) : <span className="text-zinc-600">---</span>}
                             </div>
                           ))}
                           {(!results || results.trades.length === 0) && <div className="text-zinc-500 italic">Awaiting simulation...</div>}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="python"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex flex-col bg-[#0a0a0b]"
                      >
                         <div className="p-4 border-b border-[#27272a] flex justify-between items-center">
                            <h3 className="text-xs uppercase font-bold text-zinc-500 flex items-center gap-2">
                               <Settings size={14} className="text-blue-500"/> {platform} Integration Code
                            </h3>
                            <button 
                              onClick={() => {
                                const blob = new Blob([pCode], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `quant_bot_${asset.replace('/','_')}.py`;
                                a.click();
                              }}
                              className="text-blue-500 hover:text-blue-400 flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest transition-colors"
                            >
                              <Download size={12}/> Download .py File
                            </button>
                         </div>
                         <div className="flex-1 overflow-auto p-4 bg-[#0a0a0b]">
                            <pre className="font-mono text-xs text-emerald-400/90 bg-black p-5 rounded-xl border border-[#27272a] shadow-inner">
                              <code>{pCode}</code>
                            </pre>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

