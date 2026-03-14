export interface StockRow {
  symbol: string
  company: string
  price: number
  change: number
  changePct: number
  volume: number
  marketCap: number
  pe: number | null
  sector: string
  country: string
  week52High: number
  week52Low: number
}

export interface PortfolioHolding {
  symbol: string
  company: string
  shares: number
  avgCost: number
  currentPrice: number
  sector: string
}

export interface NewsItem {
  id: string
  headline: string
  source: string
  time: string
  symbol?: string
  sentiment: 'positive' | 'negative' | 'neutral'
  url: string
}

export interface CommunityIdea {
  id: string
  symbol: string
  exchange: string
  timeframe: string
  title: string
  author: string
  avatar: string
  date: string
  likes: number
  comments: number
  direction: 'long' | 'short' | 'neutral'
  tags: string[]
  chartPoints: number[]
}

export const STOCKS_US: StockRow[] = [
  { symbol: 'AAPL', company: 'Apple Inc.', price: 189.84, change: 2.15, changePct: 1.14, volume: 58_432_100, marketCap: 2_940_000_000_000, pe: 31.2, sector: 'Technology', country: 'US', week52High: 199.62, week52Low: 164.08 },
  { symbol: 'MSFT', company: 'Microsoft Corp.', price: 418.52, change: -1.23, changePct: -0.29, volume: 21_345_600, marketCap: 3_110_000_000_000, pe: 37.8, sector: 'Technology', country: 'US', week52High: 430.82, week52Low: 309.45 },
  { symbol: 'GOOGL', company: 'Alphabet Inc.', price: 175.98, change: 3.41, changePct: 1.98, volume: 24_678_900, marketCap: 2_190_000_000_000, pe: 25.1, sector: 'Technology', country: 'US', week52High: 193.31, week52Low: 130.67 },
  { symbol: 'AMZN', company: 'Amazon.com Inc.', price: 204.39, change: 1.87, changePct: 0.92, volume: 38_921_400, marketCap: 2_150_000_000_000, pe: 43.2, sector: 'Consumer Cyclical', country: 'US', week52High: 229.87, week52Low: 151.61 },
  { symbol: 'NVDA', company: 'NVIDIA Corp.', price: 875.39, change: 22.14, changePct: 2.59, volume: 52_134_700, marketCap: 2_160_000_000_000, pe: 68.4, sector: 'Technology', country: 'US', week52High: 974.00, week52Low: 435.22 },
  { symbol: 'META', company: 'Meta Platforms Inc.', price: 524.77, change: -4.32, changePct: -0.82, volume: 15_234_500, marketCap: 1_340_000_000_000, pe: 27.9, sector: 'Technology', country: 'US', week52High: 602.95, week52Low: 351.74 },
  { symbol: 'TSLA', company: 'Tesla Inc.', price: 248.61, change: -8.43, changePct: -3.28, volume: 98_432_100, marketCap: 793_000_000_000, pe: 62.1, sector: 'Consumer Cyclical', country: 'US', week52High: 414.50, week52Low: 138.80 },
  { symbol: 'BRK.B', company: 'Berkshire Hathaway', price: 411.29, change: 0.87, changePct: 0.21, volume: 3_456_700, marketCap: 897_000_000_000, pe: 22.4, sector: 'Financials', country: 'US', week52High: 439.40, week52Low: 356.00 },
  { symbol: 'LLY', company: 'Eli Lilly & Co.', price: 812.54, change: 15.32, changePct: 1.92, volume: 4_123_400, marketCap: 770_000_000_000, pe: 74.3, sector: 'Healthcare', country: 'US', week52High: 972.47, week52Low: 629.97 },
  { symbol: 'JPM', company: 'JPMorgan Chase & Co.', price: 208.47, change: 1.54, changePct: 0.74, volume: 12_345_600, marketCap: 597_000_000_000, pe: 13.1, sector: 'Financials', country: 'US', week52High: 220.82, week52Low: 149.76 },
  { symbol: 'V', company: 'Visa Inc.', price: 279.13, change: -0.65, changePct: -0.23, volume: 7_654_300, marketCap: 567_000_000_000, pe: 31.5, sector: 'Financials', country: 'US', week52High: 290.96, week52Low: 227.15 },
  { symbol: 'XOM', company: 'ExxonMobil Corp.', price: 118.74, change: -1.12, changePct: -0.93, volume: 18_432_100, marketCap: 479_000_000_000, pe: 14.8, sector: 'Energy', country: 'US', week52High: 126.34, week52Low: 95.77 },
  { symbol: 'UNH', company: 'UnitedHealth Group', price: 524.81, change: 3.21, changePct: 0.62, volume: 3_987_600, marketCap: 484_000_000_000, pe: 22.7, sector: 'Healthcare', country: 'US', week52High: 600.47, week52Low: 431.78 },
  { symbol: 'JNJ', company: 'Johnson & Johnson', price: 152.43, change: 0.32, changePct: 0.21, volume: 8_123_400, marketCap: 365_000_000_000, pe: 16.2, sector: 'Healthcare', country: 'US', week52High: 168.00, week52Low: 143.13 },
  { symbol: 'MA', company: 'Mastercard Inc.', price: 472.88, change: 2.14, changePct: 0.45, volume: 3_234_500, marketCap: 436_000_000_000, pe: 38.7, sector: 'Financials', country: 'US', week52High: 490.85, week52Low: 371.08 },
  { symbol: 'PG', company: 'Procter & Gamble', price: 163.22, change: -0.54, changePct: -0.33, volume: 6_543_200, marketCap: 384_000_000_000, pe: 26.4, sector: 'Consumer Defensive', country: 'US', week52High: 174.49, week52Low: 144.55 },
  { symbol: 'HD', company: 'Home Depot Inc.', price: 371.54, change: 4.12, changePct: 1.12, volume: 4_321_000, marketCap: 370_000_000_000, pe: 23.8, sector: 'Consumer Cyclical', country: 'US', week52High: 396.00, week52Low: 274.26 },
  { symbol: 'AVGO', company: 'Broadcom Inc.', price: 1342.87, change: 28.54, changePct: 2.17, volume: 3_987_600, marketCap: 621_000_000_000, pe: 31.4, sector: 'Technology', country: 'US', week52High: 1977.16, week52Low: 843.97 },
  { symbol: 'CVX', company: 'Chevron Corp.', price: 154.23, change: -0.87, changePct: -0.56, volume: 9_876_500, marketCap: 285_000_000_000, pe: 13.7, sector: 'Energy', country: 'US', week52High: 168.96, week52Low: 137.76 },
  { symbol: 'MRK', company: 'Merck & Co.', price: 128.47, change: 1.23, changePct: 0.97, volume: 10_234_500, marketCap: 326_000_000_000, pe: 15.4, sector: 'Healthcare', country: 'US', week52High: 134.63, week52Low: 103.46 },
  { symbol: 'ABBV', company: 'AbbVie Inc.', price: 179.84, change: 2.41, changePct: 1.36, volume: 7_654_300, marketCap: 318_000_000_000, pe: 51.2, sector: 'Healthcare', country: 'US', week52High: 199.76, week52Low: 141.00 },
  { symbol: 'KO', company: 'Coca-Cola Co.', price: 62.47, change: -0.23, changePct: -0.37, volume: 14_321_000, marketCap: 269_000_000_000, pe: 24.1, sector: 'Consumer Defensive', country: 'US', week52High: 67.19, week52Low: 56.36 },
  { symbol: 'PEP', company: 'PepsiCo Inc.', price: 167.83, change: 0.45, changePct: 0.27, volume: 5_432_100, marketCap: 230_000_000_000, pe: 23.7, sector: 'Consumer Defensive', country: 'US', week52High: 183.41, week52Low: 155.83 },
  { symbol: 'COST', company: 'Costco Wholesale', price: 798.14, change: 12.34, changePct: 1.57, volume: 2_345_600, marketCap: 354_000_000_000, pe: 51.8, sector: 'Consumer Defensive', country: 'US', week52High: 923.83, week52Low: 649.21 },
  { symbol: 'ADBE', company: 'Adobe Inc.', price: 471.23, change: -5.43, changePct: -1.14, volume: 3_456_700, marketCap: 209_000_000_000, pe: 42.3, sector: 'Technology', country: 'US', week52High: 587.75, week52Low: 433.90 },
  { symbol: 'CRM', company: 'Salesforce Inc.', price: 295.18, change: 3.87, changePct: 1.33, volume: 5_678_900, marketCap: 285_000_000_000, pe: 52.1, sector: 'Technology', country: 'US', week52High: 369.00, week52Low: 212.00 },
  { symbol: 'AMD', company: 'Advanced Micro Devices', price: 168.47, change: 4.23, changePct: 2.58, volume: 42_345_600, marketCap: 273_000_000_000, pe: 85.2, sector: 'Technology', country: 'US', week52High: 227.30, week52Low: 134.32 },
  { symbol: 'NFLX', company: 'Netflix Inc.', price: 648.92, change: 8.71, changePct: 1.36, volume: 4_567_800, marketCap: 281_000_000_000, pe: 47.8, sector: 'Communication Services', country: 'US', week52High: 700.00, week52Low: 344.73 },
  { symbol: 'WMT', company: 'Walmart Inc.', price: 68.43, change: 0.32, changePct: 0.47, volume: 15_234_500, marketCap: 549_000_000_000, pe: 37.2, sector: 'Consumer Defensive', country: 'US', week52High: 72.48, week52Low: 49.85 },
  { symbol: 'DIS', company: 'Walt Disney Co.', price: 113.47, change: -1.23, changePct: -1.07, volume: 11_234_500, marketCap: 207_000_000_000, pe: 38.4, sector: 'Communication Services', country: 'US', week52High: 123.74, week52Low: 78.73 },
  { symbol: 'BAC', company: 'Bank of America', price: 37.84, change: 0.41, changePct: 1.09, volume: 45_678_900, marketCap: 296_000_000_000, pe: 13.8, sector: 'Financials', country: 'US', week52High: 44.44, week52Low: 24.96 },
  { symbol: 'PYPL', company: 'PayPal Holdings', price: 64.23, change: -0.87, changePct: -1.34, volume: 14_567_800, marketCap: 68_000_000_000, pe: 18.4, sector: 'Financials', country: 'US', week52High: 77.78, week52Low: 50.25 },
  { symbol: 'INTC', company: 'Intel Corp.', price: 29.47, change: -0.54, changePct: -1.80, volume: 38_912_300, marketCap: 125_000_000_000, pe: null, sector: 'Technology', country: 'US', week52High: 51.28, week52Low: 18.84 },
  { symbol: 'ORCL', company: 'Oracle Corp.', price: 124.87, change: 2.14, changePct: 1.74, volume: 8_765_400, marketCap: 342_000_000_000, pe: 28.7, sector: 'Technology', country: 'US', week52High: 138.00, week52Low: 88.38 },
  { symbol: 'IBM', company: 'IBM Corp.', price: 194.23, change: 1.12, changePct: 0.58, volume: 5_432_100, marketCap: 178_000_000_000, pe: 21.4, sector: 'Technology', country: 'US', week52High: 196.91, week52Low: 128.17 },
  { symbol: 'QCOM', company: 'Qualcomm Inc.', price: 172.48, change: 3.21, changePct: 1.90, volume: 9_876_500, marketCap: 193_000_000_000, pe: 19.7, sector: 'Technology', country: 'US', week52High: 230.63, week52Low: 150.71 },
  { symbol: 'TXN', company: 'Texas Instruments', price: 189.47, change: -1.23, changePct: -0.65, volume: 6_789_000, marketCap: 173_000_000_000, pe: 34.2, sector: 'Technology', country: 'US', week52High: 220.38, week52Low: 148.97 },
  { symbol: 'NOW', company: 'ServiceNow Inc.', price: 812.34, change: 18.47, changePct: 2.33, volume: 1_234_500, marketCap: 167_000_000_000, pe: 71.4, sector: 'Technology', country: 'US', week52High: 1118.25, week52Low: 534.80 },
  { symbol: 'UBER', company: 'Uber Technologies', price: 74.23, change: 1.43, changePct: 1.97, volume: 17_654_300, marketCap: 153_000_000_000, pe: null, sector: 'Technology', country: 'US', week52High: 87.00, week52Low: 57.63 },
  { symbol: 'SHOP', company: 'Shopify Inc.', price: 78.47, change: 2.14, changePct: 2.80, volume: 8_765_400, marketCap: 101_000_000_000, pe: null, sector: 'Technology', country: 'CA', week52High: 104.08, week52Low: 50.40 },
  { symbol: 'SQ', company: 'Block Inc.', price: 68.93, change: -1.87, changePct: -2.64, volume: 10_234_500, marketCap: 42_000_000_000, pe: null, sector: 'Financials', country: 'US', week52High: 89.74, week52Low: 36.78 },
  { symbol: 'SNAP', company: 'Snap Inc.', price: 14.23, change: -0.43, changePct: -2.93, volume: 28_765_400, marketCap: 23_000_000_000, pe: null, sector: 'Communication Services', country: 'US', week52High: 17.90, week52Low: 8.28 },
  { symbol: 'TWLO', company: 'Twilio Inc.', price: 62.47, change: 0.87, changePct: 1.41, volume: 5_432_100, marketCap: 10_000_000_000, pe: null, sector: 'Technology', country: 'US', week52High: 84.00, week52Low: 39.00 },
  { symbol: 'PLTR', company: 'Palantir Technologies', price: 28.47, change: 0.54, changePct: 1.93, volume: 52_345_600, marketCap: 61_000_000_000, pe: null, sector: 'Technology', country: 'US', week52High: 35.75, week52Low: 13.34 },
  { symbol: 'COIN', company: 'Coinbase Global', price: 187.43, change: 8.43, changePct: 4.71, volume: 12_345_600, marketCap: 45_000_000_000, pe: null, sector: 'Financials', country: 'US', week52High: 284.00, week52Low: 50.00 },
  { symbol: 'RBLX', company: 'Roblox Corp.', price: 42.87, change: -0.87, changePct: -1.99, volume: 9_876_500, marketCap: 26_000_000_000, pe: null, sector: 'Communication Services', country: 'US', week52High: 48.00, week52Low: 20.50 },
  { symbol: 'RIVN', company: 'Rivian Automotive', price: 18.43, change: -0.54, changePct: -2.84, volume: 18_765_400, marketCap: 18_000_000_000, pe: null, sector: 'Consumer Cyclical', country: 'US', week52High: 28.06, week52Low: 8.26 },
  { symbol: 'LCID', company: 'Lucid Group Inc.', price: 4.23, change: -0.12, changePct: -2.76, volume: 32_456_700, marketCap: 10_000_000_000, pe: null, sector: 'Consumer Cyclical', country: 'US', week52High: 5.00, week52Low: 1.93 },
  { symbol: 'HOOD', company: 'Robinhood Markets', price: 17.84, change: 0.43, changePct: 2.47, volume: 15_678_900, marketCap: 15_000_000_000, pe: null, sector: 'Financials', country: 'US', week52High: 21.24, week52Low: 7.68 },
  { symbol: 'SOFI', company: 'SoFi Technologies', price: 9.47, change: 0.21, changePct: 2.27, volume: 23_456_700, marketCap: 9_000_000_000, pe: null, sector: 'Financials', country: 'US', week52High: 12.04, week52Low: 6.01 },
]

// Israeli stocks (TASE / NASDAQ dual-listed)
export const STOCKS_IL: StockRow[] = [
  { symbol: 'CHKP', company: 'Check Point Software', price: 155.40, change: 1.82, changePct: 1.19, volume: 1_234_500, marketCap: 17_800_000_000, pe: 18.4, sector: 'Technology', country: 'IL', week52High: 179.40, week52Low: 129.00 },
  { symbol: 'NICE', company: 'NICE Ltd', price: 196.70, change: -2.40, changePct: -1.21, volume: 432_100, marketCap: 12_100_000_000, pe: 34.2, sector: 'Technology', country: 'IL', week52High: 245.00, week52Low: 178.00 },
  { symbol: 'CYBR', company: 'CyberArk Software', price: 312.50, change: 8.70, changePct: 2.86, volume: 654_300, marketCap: 13_400_000_000, pe: null, sector: 'Technology', country: 'IL', week52High: 340.00, week52Low: 178.50 },
  { symbol: 'WIX', company: 'Wix.com Ltd', price: 172.30, change: 3.10, changePct: 1.83, volume: 567_800, marketCap: 9_200_000_000, pe: null, sector: 'Technology', country: 'IL', week52High: 195.00, week52Low: 95.00 },
  { symbol: 'MNDY', company: 'Monday.com Ltd', price: 286.90, change: 5.40, changePct: 1.92, volume: 345_600, marketCap: 14_500_000_000, pe: null, sector: 'Technology', country: 'IL', week52High: 320.00, week52Low: 155.00 },
  { symbol: 'TEVA', company: 'Teva Pharmaceutical', price: 18.24, change: -0.31, changePct: -1.67, volume: 18_432_100, marketCap: 22_800_000_000, pe: 8.7, sector: 'Healthcare', country: 'IL', week52High: 24.00, week52Low: 9.67 },
  { symbol: 'ESLT', company: 'Elbit Systems Ltd', price: 214.80, change: 2.90, changePct: 1.37, volume: 98_700, marketCap: 9_600_000_000, pe: 21.3, sector: 'Industrials', country: 'IL', week52High: 240.00, week52Low: 175.00 },
  { symbol: 'DOX', company: 'Amdocs Limited', price: 82.40, change: 0.70, changePct: 0.86, volume: 876_500, marketCap: 10_200_000_000, pe: 16.8, sector: 'Technology', country: 'IL', week52High: 96.00, week52Low: 75.00 },
  { symbol: 'TSEM', company: 'Tower Semiconductor', price: 37.80, change: -0.60, changePct: -1.56, volume: 1_234_500, marketCap: 3_600_000_000, pe: 18.2, sector: 'Technology', country: 'IL', week52High: 52.00, week52Low: 28.00 },
  { symbol: 'INMD', company: 'InMode Ltd', price: 19.60, change: 0.40, changePct: 2.08, volume: 1_876_500, marketCap: 1_100_000_000, pe: 9.4, sector: 'Healthcare', country: 'IL', week52High: 32.00, week52Low: 14.00 },
  { symbol: 'FVRR', company: 'Fiverr International', price: 27.40, change: -0.80, changePct: -2.84, volume: 2_345_600, marketCap: 900_000_000, pe: null, sector: 'Technology', country: 'IL', week52High: 38.00, week52Low: 18.00 },
  { symbol: 'NNDM', company: 'Nano Dimension Ltd', price: 2.84, change: 0.06, changePct: 2.16, volume: 5_678_900, marketCap: 580_000_000, pe: null, sector: 'Technology', country: 'IL', week52High: 4.20, week52Low: 1.80 },
  { symbol: 'GILT', company: 'Gilat Satellite Networks', price: 8.45, change: 0.15, changePct: 1.81, volume: 234_500, marketCap: 330_000_000, pe: 14.2, sector: 'Technology', country: 'IL', week52High: 10.50, week52Low: 6.50 },
  { symbol: 'CEVA', company: 'CEVA Inc', price: 24.70, change: -0.40, changePct: -1.59, volume: 198_700, marketCap: 590_000_000, pe: null, sector: 'Technology', country: 'IL', week52High: 35.00, week52Low: 18.00 },
  { symbol: 'CGNT', company: 'Cognyte Software', price: 11.30, change: 0.30, changePct: 2.73, volume: 456_700, marketCap: 590_000_000, pe: null, sector: 'Technology', country: 'IL', week52High: 14.00, week52Low: 6.00 },
]

// European stocks (USD-equivalent prices)
export const STOCKS_EU: StockRow[] = [
  { symbol: 'ASML', company: 'ASML Holding NV', price: 892.40, change: 18.30, changePct: 2.09, volume: 876_500, marketCap: 352_000_000_000, pe: 43.2, sector: 'Technology', country: 'NL', week52High: 1110.09, week52Low: 620.00 },
  { symbol: 'SAP', company: 'SAP SE', price: 211.30, change: 2.80, changePct: 1.34, volume: 2_345_600, marketCap: 242_000_000_000, pe: 48.7, sector: 'Technology', country: 'DE', week52High: 230.00, week52Low: 143.00 },
  { symbol: 'NVO', company: 'Novo Nordisk A/S', price: 104.80, change: -1.20, changePct: -1.13, volume: 6_789_000, marketCap: 473_000_000_000, pe: 31.4, sector: 'Healthcare', country: 'DK', week52High: 148.00, week52Low: 82.00 },
  { symbol: 'SPOT', company: 'Spotify Technology SA', price: 382.60, change: 9.40, changePct: 2.52, volume: 2_134_500, marketCap: 74_000_000_000, pe: null, sector: 'Communication Services', country: 'SE', week52High: 435.00, week52Low: 138.00 },
  { symbol: 'AZN', company: 'AstraZeneca PLC', price: 74.80, change: 0.90, changePct: 1.22, volume: 5_678_900, marketCap: 236_000_000_000, pe: 41.2, sector: 'Healthcare', country: 'UK', week52High: 87.00, week52Low: 59.00 },
  { symbol: 'SHEL', company: 'Shell PLC', price: 64.20, change: -0.80, changePct: -1.23, volume: 8_765_400, marketCap: 212_000_000_000, pe: 10.8, sector: 'Energy', country: 'UK', week52High: 73.00, week52Low: 55.00 },
  { symbol: 'NSRGY', company: 'Nestle SA', price: 82.10, change: 0.40, changePct: 0.49, volume: 1_234_500, marketCap: 243_000_000_000, pe: 19.8, sector: 'Consumer Defensive', country: 'CH', week52High: 104.00, week52Low: 76.00 },
  { symbol: 'RHHBY', company: 'Roche Holding AG', price: 28.40, change: 0.20, changePct: 0.71, volume: 3_456_700, marketCap: 195_000_000_000, pe: 17.3, sector: 'Healthcare', country: 'CH', week52High: 38.00, week52Low: 26.00 },
  { symbol: 'SIEGY', company: 'Siemens AG', price: 96.30, change: 1.40, changePct: 1.47, volume: 1_876_500, marketCap: 153_000_000_000, pe: 22.1, sector: 'Industrials', country: 'DE', week52High: 110.00, week52Low: 74.00 },
  { symbol: 'EADSY', company: 'Airbus SE', price: 37.80, change: 0.60, changePct: 1.61, volume: 2_345_600, marketCap: 118_000_000_000, pe: 28.4, sector: 'Industrials', country: 'FR', week52High: 47.00, week52Low: 28.00 },
  { symbol: 'TTE', company: 'TotalEnergies SE', price: 64.90, change: -0.70, changePct: -1.07, volume: 4_567_800, marketCap: 148_000_000_000, pe: 8.9, sector: 'Energy', country: 'FR', week52High: 75.00, week52Low: 55.00 },
  { symbol: 'LVMUY', company: 'LVMH Moet Hennessy', price: 141.80, change: 2.10, changePct: 1.50, volume: 876_500, marketCap: 357_000_000_000, pe: 24.3, sector: 'Consumer Cyclical', country: 'FR', week52High: 190.00, week52Low: 118.00 },
  { symbol: 'UBS', company: 'UBS Group AG', price: 29.80, change: 0.50, changePct: 1.71, volume: 5_678_900, marketCap: 96_000_000_000, pe: 14.2, sector: 'Financials', country: 'CH', week52High: 34.00, week52Low: 22.00 },
  { symbol: 'VWAGY', company: 'Volkswagen AG', price: 9.84, change: -0.16, changePct: -1.60, volume: 2_134_500, marketCap: 49_000_000_000, pe: 3.8, sector: 'Consumer Cyclical', country: 'DE', week52High: 16.00, week52Low: 7.50 },
  { symbol: 'BNPQY', company: 'BNP Paribas SA', price: 34.20, change: 0.80, changePct: 2.40, volume: 1_345_600, marketCap: 78_000_000_000, pe: 6.8, sector: 'Financials', country: 'FR', week52High: 42.00, week52Low: 26.00 },
]

// Football club stocks
export const STOCKS_FOOTBALL: StockRow[] = [
  { symbol: 'MANU', company: 'Manchester United PLC', price: 14.28, change: 0.34, changePct: 2.44, volume: 2_456_700, marketCap: 2_300_000_000, pe: null, sector: 'Sports', country: 'UK', week52High: 22.00, week52Low: 12.50 },
  { symbol: 'BVB', company: 'Borussia Dortmund GmbH', price: 3.88, change: -0.08, changePct: -2.02, volume: 876_500, marketCap: 428_000_000, pe: null, sector: 'Sports', country: 'DE', week52High: 5.20, week52Low: 2.90 },
  { symbol: 'JUVE', company: 'Juventus Football Club', price: 0.31, change: 0.01, changePct: 3.33, volume: 12_345_600, marketCap: 980_000_000, pe: null, sector: 'Sports', country: 'IT', week52High: 0.45, week52Low: 0.22 },
  { symbol: 'AJAX', company: 'Ajax NV Amsterdam', price: 13.20, change: 0.30, changePct: 2.33, volume: 345_600, marketCap: 270_000_000, pe: null, sector: 'Sports', country: 'NL', week52High: 18.00, week52Low: 8.00 },
  { symbol: 'OLG', company: 'Olympique Lyonnais Groupe', price: 3.74, change: -0.12, changePct: -3.11, volume: 456_700, marketCap: 327_000_000, pe: null, sector: 'Sports', country: 'FR', week52High: 5.50, week52Low: 2.10 },
  { symbol: 'SLBEN', company: 'Sport Lisboa e Benfica', price: 3.28, change: 0.08, changePct: 2.50, volume: 234_500, marketCap: 156_000_000, pe: null, sector: 'Sports', country: 'PT', week52High: 4.20, week52Low: 2.40 },
  { symbol: 'FCP', company: 'Futebol Clube do Porto', price: 2.58, change: 0.04, changePct: 1.57, volume: 123_400, marketCap: 42_000_000, pe: null, sector: 'Sports', country: 'PT', week52High: 3.50, week52Low: 1.80 },
  { symbol: 'ASR', company: 'AS Roma (NEXI Group)', price: 0.44, change: -0.02, changePct: -4.35, volume: 3_456_700, marketCap: 640_000_000, pe: null, sector: 'Sports', country: 'IT', week52High: 0.68, week52Low: 0.32 },
  { symbol: 'LAZI', company: 'SS Lazio SpA', price: 2.14, change: 0.06, changePct: 2.88, volume: 567_800, marketCap: 148_000_000, pe: null, sector: 'Sports', country: 'IT', week52High: 3.20, week52Low: 1.60 },
  { symbol: 'CCP', company: 'Celtic PLC', price: 2.38, change: 0.04, changePct: 1.71, volume: 234_500, marketCap: 210_000_000, pe: null, sector: 'Sports', country: 'UK', week52High: 2.90, week52Low: 1.70 },
]

export const STOCKS_50 = [...STOCKS_US, ...STOCKS_IL, ...STOCKS_EU, ...STOCKS_FOOTBALL]

export const PORTFOLIO_HOLDINGS: PortfolioHolding[] = [
  { symbol: 'AAPL', company: 'Apple Inc.', shares: 50, avgCost: 158.32, currentPrice: 189.84, sector: 'Technology' },
  { symbol: 'NVDA', company: 'NVIDIA Corp.', shares: 10, avgCost: 620.00, currentPrice: 875.39, sector: 'Technology' },
  { symbol: 'MSFT', company: 'Microsoft Corp.', shares: 25, avgCost: 378.50, currentPrice: 418.52, sector: 'Technology' },
  { symbol: 'TSLA', company: 'Tesla Inc.', shares: 30, avgCost: 212.45, currentPrice: 248.61, sector: 'Consumer Cyclical' },
  { symbol: 'AMZN', company: 'Amazon.com Inc.', shares: 20, avgCost: 178.90, currentPrice: 204.39, sector: 'Consumer Cyclical' },
  { symbol: 'META', company: 'Meta Platforms Inc.', shares: 15, avgCost: 490.20, currentPrice: 524.77, sector: 'Technology' },
  { symbol: 'JPM', company: 'JPMorgan Chase & Co.', shares: 40, avgCost: 189.75, currentPrice: 208.47, sector: 'Financials' },
]

export const MOCK_NEWS: NewsItem[] = [
  { id: '1', headline: 'Fed signals potential rate cut in Q2 as inflation cools to 2.8%', source: 'Bloomberg', time: '12m ago', sentiment: 'positive', url: '#' },
  { id: '2', headline: 'NVIDIA unveils Blackwell Ultra GPU architecture, stock surges 4%', source: 'Reuters', time: '34m ago', symbol: 'NVDA', sentiment: 'positive', url: '#' },
  { id: '3', headline: 'Tesla misses delivery estimates by 8% amid slowing EV demand', source: 'CNBC', time: '1h ago', symbol: 'TSLA', sentiment: 'negative', url: '#' },
  { id: '4', headline: 'Apple Vision Pro 2 rumored for late 2025 launch with improved battery', source: 'MacRumors', time: '2h ago', symbol: 'AAPL', sentiment: 'positive', url: '#' },
  { id: '5', headline: 'US jobs report shows 175K new positions, unemployment holds at 3.9%', source: 'WSJ', time: '3h ago', sentiment: 'neutral', url: '#' },
  { id: '6', headline: 'Meta AI assistant reaches 500M monthly active users milestone', source: 'TechCrunch', time: '4h ago', symbol: 'META', sentiment: 'positive', url: '#' },
  { id: '7', headline: 'Oil prices drop 2% on weak China manufacturing data', source: 'Reuters', time: '5h ago', sentiment: 'negative', url: '#' },
  { id: '8', headline: 'Microsoft Azure growth accelerates to 31% YoY in latest quarter', source: 'The Verge', time: '6h ago', symbol: 'MSFT', sentiment: 'positive', url: '#' },
  { id: '9', headline: 'Bitcoin ETF sees record $1.2B inflows as institutional interest surges', source: 'CoinDesk', time: '8h ago', sentiment: 'positive', url: '#' },
  { id: '10', headline: 'Amazon expands same-day delivery to 60 new metropolitan markets', source: 'CNBC', time: '10h ago', symbol: 'AMZN', sentiment: 'positive', url: '#' },
]

export function generatePortfolioHistory(days = 180): { date: string; value: number }[] {
  const history: { date: string; value: number }[] = []
  let value = 85_000
  const now = new Date()
  for (let i = days; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    // Keep the sample chart deterministic so SSR and client hydration match.
    const drift = Math.sin((days - i) / 11) * 0.004 + Math.cos((days - i) / 23) * 0.0025 + 0.0008
    value = value * (1 + drift)
    history.push({
      date: d.toISOString().split('T')[0],
      value: Math.round(value),
    })
  }
  return history
}
