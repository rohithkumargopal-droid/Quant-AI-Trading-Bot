export function generatePythonCode(
  asset: string,
  platform: string,
  capitalPercent: number,
  stopLoss: number,
  takeProfit: number,
  killSwitch: number
) {
  if (platform === 'Alpaca API') {
    return `import alpaca_trade_api as tradeapi
import pandas as pd
import time
import logging

# Configuration (Generated from Dashboard)
API_KEY = "YOUR_ALPACA_API_KEY"
API_SECRET = "YOUR_ALPACA_SECRET_KEY"
BASE_URL = "https://paper-api.alpaca.markets"

SYMBOL = "${asset}"
CAPITAL_PERCENT_PER_TRADE = ${capitalPercent / 100} # ${capitalPercent}%
STOP_LOSS_PCT = ${stopLoss / 100} # ${stopLoss}%
TAKE_PROFIT_PCT = ${takeProfit / 100} # ${takeProfit}%
DAILY_KILL_SWITCH_PCT = ${killSwitch / 100} # Disable trading if equity drops ${killSwitch}% in a day

# Logging setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('AI_Quant_Bot')

# Initialize API
api = tradeapi.REST(API_KEY, API_SECRET, BASE_URL, api_version='v2')

def get_historical_data(symbol, days=200):
    """Fetches past market data needed for RSI and SMA."""
    bars = api.get_bars(symbol, tradeapi.TimeFrame.Day, limit=days).df
    if bars.empty:
        return pd.DataFrame()
    return bars

def compute_indicators(df):
    """Calculates SMA and RSI."""
    # Simple Moving Averages
    df['SMA_50'] = df['close'].rolling(window=50).mean()
    df['SMA_200'] = df['close'].rolling(window=200).mean()
    
    # Relative Strength Index (14)
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI_14'] = 100 - (100 / (1 + rs))
    return df

def analyze_and_trade():
    """Main AI strategy logic."""
    account = api.get_account()
    equity = float(account.equity)
    cash = float(account.cash)
    start_of_day_equity = float(account.last_equity)

    # 1. Kill Switch Check
    daily_pnl_pct = (equity - start_of_day_equity) / start_of_day_equity
    if daily_pnl_pct <= -DAILY_KILL_SWITCH_PCT:
        logger.critical(f"KILL SWITCH ACTIVATED! Daily loss exceeded {DAILY_KILL_SWITCH_PCT*100}%. System halting.")
        api.cancel_all_orders()
        return

    # 2. Extract Indicator Data
    df = get_historical_data(SYMBOL, days=250)
    if df.empty or len(df) < 200:
        logger.warning("Not enough data to compute 200 SMA.")
        return
        
    df = compute_indicators(df)
    today = df.iloc[-1]
    yesterday = df.iloc[-2]

    # 3. Strategy Conditions
    sma_crossover = (yesterday['SMA_50'] <= yesterday['SMA_200']) and (today['SMA_50'] > today['SMA_200'])
    rsi_momentum = today['RSI_14'] < 40 # Oversold bounce momentum 

    open_positions = [p.symbol for p in api.list_positions()]

    if SYMBOL not in open_positions and sma_crossover and rsi_momentum:
        logger.info(f"Signal detected for {SYMBOL}. Initiating Trade.")
        
        # Risk Management: Sizing
        trade_amount = equity * CAPITAL_PERCENT_PER_TRADE
        qty = max(1, int(trade_amount / today['close']))
        
        # Stop-Loss & Take-Profit Calculation
        sl_price = today['close'] * (1 - STOP_LOSS_PCT)
        tp_price = today['close'] * (1 + TAKE_PROFIT_PCT)

        # 4. Execute Trade (Bracket Order)
        try:
            api.submit_order(
                symbol=SYMBOL,
                qty=qty,
                side='buy',
                type='market',
                time_in_force='gtc',
                order_class='bracket',
                take_profit=dict(
                    limit_price=round(tp_price, 2),
                ),
                stop_loss=dict(
                    stop_price=round(sl_price, 2),
                    limit_price=round(sl_price * 0.99, 2),
                )
            )
            logger.info(f"Bracket order placed. Qty: {qty}, TP: {tp_price:.2f}, SL: {sl_price:.2f}")
        except Exception as e:
            logger.error(f"Failed to place order: {e}")
    else:
        logger.info("No signal. Monitoring market...")

if __name__ == "__main__":
    logger.info("Quant AI Trading Bot Initialized.")
    # For day trading, run periodically. For daily timeframe, run once a day.
    while True:
        # Assuming script is running during market hours
        clock = api.get_clock()
        if clock.is_open:
            analyze_and_trade()
            time.sleep(3600) # Re-evaluate every hour
        else:
            logger.info("Market Closed. Sleeping...")
            time.sleep(3600)
`;
  } else if (platform === 'Binance API') {
    return `# Setup for Binance API via ccxt
import ccxt
import pandas as pd
import time
import logging

# Configuration (Generated from Dashboard)
API_KEY = "YOUR_BINANCE_API_KEY"
API_SECRET = "YOUR_BINANCE_SECRET"

SYMBOL = "${asset}"
CAPITAL_PERCENT_PER_TRADE = ${capitalPercent / 100}
STOP_LOSS_PCT = ${stopLoss / 100}
TAKE_PROFIT_PCT = ${takeProfit / 100}
DAILY_KILL_SWITCH_PCT = ${killSwitch / 100}

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('AI_Quant_Bot')

exchange = ccxt.binance({
    'apiKey': API_KEY,
    'secret': API_SECRET,
    'enableRateLimit': True,
})

def get_historical_data(symbol, limit=250):
    ohlcv = exchange.fetch_ohlcv(symbol, timeframe='1d', limit=limit)
    df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
    return df

def analyze_and_trade():
    try:
        balance = exchange.fetch_balance()
        # Simplified: assuming USDT as quote currency
        usdt_balance = balance['total'].get('USDT', 0)
        
        # Kill switch track (implement tracking in DB/file for production)
        
        df = get_historical_data(SYMBOL)
        df['SMA_50'] = df['close'].rolling(window=50).mean()
        df['SMA_200'] = df['close'].rolling(window=200).mean()
        
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        df['RSI_14'] = 100 - (100 / (1 + (gain / loss)))
        
        today = df.iloc[-1]
        yesterday = df.iloc[-2]
        
        sma_crossover = (yesterday['SMA_50'] <= yesterday['SMA_200']) and (today['SMA_50'] > today['SMA_200'])
        if sma_crossover and today['RSI_14'] < 40:
            logger.info("Signal detected. Code to execute order on Binance goes here.")
            # exchange.create_order(SYMBOL, 'market', 'buy', amount, params=...)
            # Important: Binance requires precise volume/price formatting.
            
    except Exception as e:
        logger.error(f"Error: {e}")

if __name__ == "__main__":
    while True:
        analyze_and_trade()
        time.sleep(3600)
`;
  }
  return `# Setup for ${platform} is currently unsupported in this demo generator.`;
}
