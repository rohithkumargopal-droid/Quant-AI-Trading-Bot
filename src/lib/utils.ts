import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generates simulated historical OHLC data
export function generateHistoricalData(days: number, startPrice: number) {
  const data = [];
  let currentPrice = startPrice;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    
    // Random walk with slight upward drift
    const volatility = currentPrice * 0.02;
    const change = (Math.random() - 0.45) * volatility;
    
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    currentPrice = close;

    data.push({
      date: date.toISOString().split('T')[0],
      timestamp: date.getTime(),
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 100000) + 10000,
    });
  }

  // Calculate SMA
  for (let i = 0; i < data.length; i++) {
    if (i >= 49) { // 50 SMA
      const slice50 = data.slice(i - 49, i + 1);
      data[i].sma50 = slice50.reduce((acc, val) => acc + val.close, 0) / 50;
    }
    if (i >= 199) { // 200 SMA
      const slice200 = data.slice(i - 199, i + 1);
      data[i].sma200 = slice200.reduce((acc, val) => acc + val.close, 0) / 200;
    }
  }

  // Calculate RSI (14)
  for (let i = 14; i < data.length; i++) {
    let gains = 0;
    let losses = 0;
    for (let j = i - 13; j <= i; j++) {
      const diff = data[j].close - data[j - 1].close;
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    
    if (avgLoss === 0) {
      data[i].rsi = 100;
    } else {
      const rs = avgGain / Math.max(avgLoss, 0.0001); // avoid dist by 0
      data[i].rsi = 100 - (100 / (1 + rs));
    }
  }

  return data;
}

export function runBacktest(data: any[], riskRiskLimit: number, stopLoss: number, takeProfit: number) {
  let inPosition = false;
  let entryPrice = 0;
  let wins = 0;
  let losses = 0;
  let trades = [];
  let equity = 100000;
  let maxEquity = equity;
  let maxDrawdown = 0;

  for (let i = 200; i < data.length; i++) {
    const today = data[i];
    const prev = data[i - 1];

    if (!today.sma50 || !today.sma200 || !today.rsi) continue;

    // Check open position logic (simulated day trading / swing)
    if (inPosition) {
      const currentPnL = (today.close - entryPrice) / entryPrice;
      if (currentPnL >= (takeProfit / 100)) { // Take profit hits
        inPosition = false;
        wins++;
        const profit = today.close - entryPrice;
        trades.push({ type: 'SELL', reason: 'TP', date: today.date, price: today.close, profit });
        equity += (equity * (riskRiskLimit/100)) * (takeProfit/100) * 10; // rough simulation
      } else if (currentPnL <= -(stopLoss / 100)) { // Stop loss hits
        inPosition = false;
        losses++;
        const profit = today.close - entryPrice;
        trades.push({ type: 'SELL', reason: 'SL', date: today.date, price: today.close, profit });
        equity -= (equity * (riskRiskLimit/100)); // lost the risk amount
      }
    } else {
      // SMA 50 crosses above SMA 200 AND RSI > 30 (user wanted RSI for momentum and SMA cross)
      // Actually user specified: RSI for momentum (often < 30 means oversold and ready to bounce)
      const smaCrossUp = (prev.sma50 <= prev.sma200) && (today.sma50 > today.sma200);
      const isOversold = today.rsi < 40; 
      
      if (smaCrossUp && isOversold) {
        inPosition = true;
        entryPrice = today.close;
        trades.push({ type: 'BUY', reason: 'ENTRY', date: today.date, price: today.close, profit: 0 });
      }
    }

    if (equity > maxEquity) maxEquity = equity;
    const currentDrawdown = (maxEquity - equity) / maxEquity;
    if (currentDrawdown > maxDrawdown) maxDrawdown = currentDrawdown;
  }

  const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

  return {
    winRate,
    drawdown: maxDrawdown * 100,
    totalTrades: wins + losses,
    finalEquity: equity,
    trades: trades.reverse(),
  };
}
