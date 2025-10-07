import { useState, useMemo, useEffect } from "react";
import { useQueries } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// tabs removed from ETF card; kept View Details button only
// Checkbox moved to bottom action button; removed top-right checkbox import
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, TrendingUp, TrendingDown, DollarSign, BarChart3, Filter, X, 
  ArrowUpDown, SlidersHorizontal, Heart, ChevronDown, ChevronUp, Eye,
  ChevronLeft, ChevronRight 
} from "lucide-react";
import { DetailedETFView } from "@/components/DetailedETFView";
import { ETFComparison } from "@/components/ETFComparison";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ETF {
  ticker: string;
  name: string;
  description: string;
  assetType: string;
  category: string;
  riskLevel: 'Low' | 'Moderate' | 'High';
  color: string;
}

interface ETFLiveData {
  regularMarketPrice?: number;
  trailingAnnualDividendYield?: number;
  fiftyTwoWeekChange?: number;
  expenseRatio?: number;
}

// Top 100 ETF data - live data fetched separately
const ETF_DATA: ETF[] = [
  // Large Cap US Equity
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', description: 'Tracks the S&P 500 index, providing exposure to 500 large-cap U.S. companies.', assetType: 'US Equity', category: 'Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'IVV', name: 'iShares Core S&P 500 ETF', description: 'Seeks to track the S&P 500 index representing large-cap U.S. equities.', assetType: 'US Equity', category: 'Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', description: 'The original ETF tracking the S&P 500 index with high liquidity.', assetType: 'US Equity', category: 'Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', description: 'Provides broad exposure to the entire U.S. equity market, including small-, mid-, and large-cap stocks.', assetType: 'US Equity', category: 'Total Market', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  
  // Growth & Tech
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', description: 'Tracks the Nasdaq-100 Index, providing exposure to the largest non-financial companies listed on the Nasdaq.', assetType: 'US Growth', category: 'Large Growth', riskLevel: 'High', color: 'hsl(var(--chart-5))' },
  { ticker: 'VUG', name: 'Vanguard Growth ETF', description: 'Seeks to track large-cap U.S. growth stocks with strong growth characteristics.', assetType: 'US Growth', category: 'Large Growth', riskLevel: 'High', color: 'hsl(var(--chart-5))' },
  { ticker: 'IWF', name: 'iShares Russell 1000 Growth ETF', description: 'Tracks the Russell 1000 Growth Index, focusing on large-cap growth stocks.', assetType: 'US Growth', category: 'Large Growth', riskLevel: 'High', color: 'hsl(var(--chart-5))' },
  { ticker: 'VGT', name: 'Vanguard Information Technology ETF', description: 'Provides exposure to technology sector stocks.', assetType: 'Technology', category: 'Technology', riskLevel: 'High', color: 'hsl(var(--chart-5))' },
  { ticker: 'XLK', name: 'Technology Select Sector SPDR Fund', description: 'Tracks the technology sector within the S&P 500.', assetType: 'Technology', category: 'Technology', riskLevel: 'High', color: 'hsl(var(--chart-5))' },
  { ticker: 'QQQM', name: 'Invesco NASDAQ 100 ETF', description: 'Lower-cost version tracking the Nasdaq-100 Index.', assetType: 'US Growth', category: 'Large Growth', riskLevel: 'High', color: 'hsl(var(--chart-5))' },
  { ticker: 'SMH', name: 'VanEck Semiconductor ETF', description: 'Provides exposure to semiconductor companies worldwide.', assetType: 'Technology', category: 'Technology', riskLevel: 'High', color: 'hsl(var(--chart-5))' },
  { ticker: 'VONG', name: 'Vanguard Russell 1000 Growth ETF', description: 'Tracks the Russell 1000 Growth Index for large-cap growth exposure.', assetType: 'US Growth', category: 'Large Growth', riskLevel: 'High', color: 'hsl(var(--chart-5))' },
  { ticker: 'MGK', name: 'Vanguard Mega Cap Growth ETF', description: 'Focuses on mega-cap U.S. growth stocks.', assetType: 'US Growth', category: 'Large Growth', riskLevel: 'High', color: 'hsl(var(--chart-5))' },
  { ticker: 'SPYG', name: 'SPDR Portfolio S&P 500 Growth ETF', description: 'Tracks the S&P 500 Growth Index.', assetType: 'US Growth', category: 'Large Growth', riskLevel: 'High', color: 'hsl(var(--chart-5))' },
  { ticker: 'TQQQ', name: 'ProShares UltraPro QQQ', description: '3x leveraged ETF tracking the Nasdaq-100 Index.', assetType: 'Leveraged', category: 'Leveraged', riskLevel: 'High', color: 'hsl(var(--chart-5))' },
  
  // International Equity
  { ticker: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', description: 'Provides exposure to developed market stocks outside the U.S. and Canada.', assetType: 'International Equity', category: 'Foreign Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-2))' },
  { ticker: 'IEFA', name: 'iShares Core MSCI EAFE ETF', description: 'Tracks the MSCI EAFE Index, providing broad exposure to developed markets outside North America.', assetType: 'International Equity', category: 'Foreign Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-2))' },
  { ticker: 'VXUS', name: 'Vanguard Total International Stock ETF', description: 'Provides broad exposure to developed and emerging non-U.S. equity markets around the globe.', assetType: 'International Equity', category: 'Foreign Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-2))' },
  { ticker: 'IEMG', name: 'iShares Core MSCI Emerging Markets ETF', description: 'Tracks the MSCI Emerging Markets Index, providing broad exposure to emerging market stocks.', assetType: 'Emerging Markets', category: 'Emerging Markets', riskLevel: 'High', color: 'hsl(var(--chart-2))' },
  { ticker: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', description: 'Provides broad exposure to emerging market equities, focusing on large- and mid-cap companies.', assetType: 'Emerging Markets', category: 'Emerging Markets', riskLevel: 'High', color: 'hsl(var(--chart-2))' },
  { ticker: 'EFA', name: 'iShares MSCI EAFE ETF', description: 'Tracks the MSCI EAFE Index for developed market exposure.', assetType: 'International Equity', category: 'Foreign Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-2))' },
  { ticker: 'SCHF', name: 'Schwab International Equity ETF', description: 'Provides exposure to developed markets outside the U.S.', assetType: 'International Equity', category: 'Foreign Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-2))' },
  { ticker: 'VEU', name: 'Vanguard FTSE All-World ex-US ETF', description: 'Tracks all international markets excluding the U.S.', assetType: 'International Equity', category: 'Foreign Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-2))' },
  { ticker: 'IXUS', name: 'iShares Core MSCI Total Intl Stock ETF', description: 'Provides broad international equity exposure.', assetType: 'International Equity', category: 'Foreign Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-2))' },
  { ticker: 'SPDW', name: 'SPDR Portfolio Developed World ex-US ETF', description: 'Tracks developed markets excluding the U.S.', assetType: 'International Equity', category: 'Foreign Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-2))' },
  { ticker: 'VGK', name: 'Vanguard FTSE Europe ETF', description: 'Provides exposure to European equity markets.', assetType: 'International Equity', category: 'Europe Stock', riskLevel: 'Moderate', color: 'hsl(var(--chart-2))' },
  { ticker: 'EFV', name: 'iShares MSCI EAFE Value ETF', description: 'Focuses on value stocks in developed markets outside North America.', assetType: 'International Equity', category: 'Foreign Large Value', riskLevel: 'Moderate', color: 'hsl(var(--chart-2))' },
  { ticker: 'IDEV', name: 'iShares Core MSCI Intl Developed Markets ETF', description: 'Tracks developed markets outside North America.', assetType: 'International Equity', category: 'Foreign Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-2))' },
  { ticker: 'ACWI', name: 'iShares MSCI ACWI ETF', description: 'Provides exposure to global equity markets including the U.S.', assetType: 'Global Equity', category: 'World Stock', riskLevel: 'Moderate', color: 'hsl(var(--chart-2))' },
  { ticker: 'VT', name: 'Vanguard Total World Stock ETF', description: 'Provides exposure to the entire global equity market.', assetType: 'Global Equity', category: 'World Stock', riskLevel: 'Moderate', color: 'hsl(var(--chart-2))' },

  // Value
  { ticker: 'VTV', name: 'Vanguard Value ETF', description: 'Provides exposure to large-cap U.S. companies with value characteristics, focusing on undervalued stocks.', assetType: 'US Equity', category: 'Large Value', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'IVE', name: 'iShares S&P 500 Value ETF', description: 'Tracks the value segment of the S&P 500.', assetType: 'US Equity', category: 'Large Value', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'IWD', name: 'iShares Russell 1000 Value ETF', description: 'Tracks the Russell 1000 Value Index.', assetType: 'US Equity', category: 'Large Value', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'SPYV', name: 'SPDR Portfolio S&P 500 Value ETF', description: 'Tracks the S&P 500 Value Index, providing exposure to large-cap U.S. value stocks.', assetType: 'US Equity', category: 'Large Value', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'VBR', name: 'Vanguard Small-Cap Value ETF', description: 'Provides exposure to small-cap U.S. companies with value characteristics.', assetType: 'US Equity', category: 'Small Value', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },

  // Dividend
  { ticker: 'VIG', name: 'Vanguard Dividend Appreciation ETF', description: 'Provides exposure to companies with a history of increasing dividends, focusing on quality dividend growth stocks.', assetType: 'US Dividend', category: 'Large Blend', riskLevel: 'Low', color: 'hsl(var(--chart-1))' },
  { ticker: 'SCHD', name: 'Schwab U.S. Dividend Equity ETF', description: 'Focuses on high dividend-yielding U.S. stocks with strong fundamentals.', assetType: 'US Dividend', category: 'Large Value', riskLevel: 'Low', color: 'hsl(var(--chart-1))' },
  { ticker: 'VYM', name: 'Vanguard High Dividend Yield ETF', description: 'Provides exposure to high dividend-yielding U.S. stocks.', assetType: 'US Dividend', category: 'Large Value', riskLevel: 'Low', color: 'hsl(var(--chart-1))' },
  { ticker: 'DGRO', name: 'iShares Core Dividend Growth ETF', description: 'Focuses on dividend growth stocks with strong fundamentals.', assetType: 'US Dividend', category: 'Large Blend', riskLevel: 'Low', color: 'hsl(var(--chart-1))' },
  { ticker: 'JEPI', name: 'JPMorgan Equity Premium Income ETF', description: 'Seeks to deliver monthly income through equity investing and options strategies.', assetType: 'US Dividend', category: 'Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'JEPQ', name: 'JPMorgan Nasdaq Equity Premium Income ETF', description: 'Seeks monthly income through Nasdaq investing and options strategies.', assetType: 'US Dividend', category: 'Large Growth', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },

  // Bonds
  { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', description: 'Provides broad exposure to U.S. investment-grade bonds with maturities of more than one year.', assetType: 'Bonds', category: 'Intermediate Bond', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },
  { ticker: 'AGG', name: 'iShares Core U.S. Aggregate Bond ETF', description: 'Tracks the Bloomberg U.S. Aggregate Bond Index, providing broad bond market exposure.', assetType: 'Bonds', category: 'Intermediate Bond', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },
  { ticker: 'BNDX', name: 'Vanguard Total International Bond ETF', description: 'Provides exposure to investment-grade bonds from developed and emerging markets outside the U.S.', assetType: 'Bonds', category: 'International Bond', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },
  { ticker: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', description: 'Tracks long-term U.S. Treasury bonds with maturities greater than 20 years.', assetType: 'Bonds', category: 'Long Government', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },
  { ticker: 'VCIT', name: 'Vanguard Intermediate-Term Corp Bond ETF', description: 'Provides exposure to intermediate-term U.S. corporate bonds.', assetType: 'Bonds', category: 'Corporate Bond', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },
  { ticker: 'MUB', name: 'iShares National Muni Bond ETF', description: 'Provides exposure to investment-grade municipal bonds from across the United States.', assetType: 'Bonds', category: 'Muni National', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },
  { ticker: 'VCSH', name: 'Vanguard Short-Term Corporate Bond ETF', description: 'Provides exposure to short-term U.S. corporate bonds.', assetType: 'Bonds', category: 'Short-Term Bond', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },
  { ticker: 'BSV', name: 'Vanguard Short-Term Bond ETF', description: 'Tracks short-term U.S. government and corporate bonds.', assetType: 'Bonds', category: 'Short-Term Bond', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },
  { ticker: 'IEF', name: 'iShares 7-10 Year Treasury Bond ETF', description: 'Tracks intermediate-term U.S. Treasury bonds.', assetType: 'Bonds', category: 'Intermediate Government', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },
  { ticker: 'VTEB', name: 'Vanguard Tax-Exempt Bond ETF', description: 'Provides exposure to tax-exempt municipal bonds.', assetType: 'Bonds', category: 'Muni National', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },
  { ticker: 'MBB', name: 'iShares MBS ETF', description: 'Tracks U.S. agency mortgage-backed securities.', assetType: 'Bonds', category: 'Mortgage-Backed', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },
  { ticker: 'BIL', name: 'SPDR Bloomberg 1-3 Month T-Bill ETF', description: 'Provides exposure to short-term U.S. Treasury bills.', assetType: 'Bonds', category: 'Ultrashort Bond', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },
  { ticker: 'SGOV', name: 'iShares 0-3 Month Treasury Bond ETF', description: 'Tracks ultra-short-term U.S. Treasury securities.', assetType: 'Bonds', category: 'Ultrashort Bond', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },
  { ticker: 'JPST', name: 'JPMorgan Ultra-Short Income ETF', description: 'Provides exposure to ultra-short-term investment-grade debt securities.', assetType: 'Bonds', category: 'Ultrashort Bond', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },
  { ticker: 'VGIT', name: 'Vanguard Intermediate-Term Treasury ETF', description: 'Tracks intermediate-term U.S. Treasury bonds.', assetType: 'Bonds', category: 'Intermediate Government', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },
  { ticker: 'IUSB', name: 'iShares Core Total USD Bond Market ETF', description: 'Provides broad exposure to U.S. dollar-denominated bonds.', assetType: 'Bonds', category: 'Intermediate Bond', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },
  { ticker: 'LQD', name: 'iShares iBoxx Investment Grade Corp Bond ETF', description: 'Tracks investment-grade U.S. corporate bonds.', assetType: 'Bonds', category: 'Corporate Bond', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },
  { ticker: 'GOVT', name: 'iShares U.S. Treasury Bond ETF', description: 'Provides exposure to U.S. Treasury bonds across all maturities.', assetType: 'Bonds', category: 'Intermediate Government', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },
  { ticker: 'JAAA', name: 'Janus Henderson AAA CLO ETF', description: 'Invests in AAA-rated collateralized loan obligations.', assetType: 'Bonds', category: 'Corporate Bond', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },
  { ticker: 'USHY', name: 'iShares Broad USD High Yield Corp Bond ETF', description: 'Provides exposure to U.S. high-yield corporate bonds.', assetType: 'Bonds', category: 'High Yield Bond', riskLevel: 'Moderate', color: 'hsl(var(--chart-3))' },
  { ticker: 'BIV', name: 'Vanguard Intermediate-Term Bond ETF', description: 'Tracks intermediate-term U.S. government and corporate bonds.', assetType: 'Bonds', category: 'Intermediate Bond', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },
  { ticker: 'SHY', name: 'iShares 1-3 Year Treasury Bond ETF', description: 'Tracks short-term U.S. Treasury bonds.', assetType: 'Bonds', category: 'Short Government', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },
  { ticker: 'VGSH', name: 'Vanguard Short-Term Treasury ETF', description: 'Provides exposure to short-term U.S. Treasury securities.', assetType: 'Bonds', category: 'Short Government', riskLevel: 'Low', color: 'hsl(var(--chart-3))' },

  // Mid/Small Cap
  { ticker: 'IJH', name: 'iShares Core S&P Mid-Cap ETF', description: 'Tracks the S&P MidCap 400 Index for mid-cap exposure.', assetType: 'US Equity', category: 'Mid-Cap Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'VO', name: 'Vanguard Mid-Cap ETF', description: 'Provides exposure to mid-cap U.S. stocks.', assetType: 'US Equity', category: 'Mid-Cap Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'IJR', name: 'iShares Core S&P Small-Cap ETF', description: 'Tracks the S&P SmallCap 600 Index.', assetType: 'US Equity', category: 'Small-Cap Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'IWM', name: 'iShares Russell 2000 ETF', description: 'Tracks the Russell 2000 Index for small-cap exposure.', assetType: 'US Equity', category: 'Small-Cap Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'VB', name: 'Vanguard Small-Cap ETF', description: 'Provides broad exposure to small-cap U.S. stocks.', assetType: 'US Equity', category: 'Small-Cap Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'IWR', name: 'iShares Russell Mid-Cap ETF', description: 'Tracks the Russell Midcap Index.', assetType: 'US Equity', category: 'Mid-Cap Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'VXF', name: 'Vanguard Extended Market ETF', description: 'Tracks the S&P Completion Index for small and mid-cap exposure.', assetType: 'US Equity', category: 'Small-Cap Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'MDY', name: 'SPDR S&P MidCap 400 ETF Trust', description: 'Tracks the S&P MidCap 400 Index.', assetType: 'US Equity', category: 'Mid-Cap Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },

  // Other Large Cap
  { ticker: 'SPLG', name: 'SPDR Portfolio S&P 500 ETF', description: 'Low-cost ETF tracking the S&P 500.', assetType: 'US Equity', category: 'Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'ITOT', name: 'iShares Core S&P Total U.S. Stock Market ETF', description: 'Provides broad exposure to the entire U.S. stock market.', assetType: 'US Equity', category: 'Total Market', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'RSP', name: 'Invesco S&P 500 Equal Weight ETF', description: 'Equal-weight version of the S&P 500.', assetType: 'US Equity', category: 'Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'SCHX', name: 'Schwab U.S. Large-Cap ETF', description: 'Tracks the Dow Jones U.S. Large-Cap Total Stock Market Index.', assetType: 'US Equity', category: 'Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'VV', name: 'Vanguard Large-Cap ETF', description: 'Provides exposure to large-cap U.S. stocks.', assetType: 'US Equity', category: 'Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'IWB', name: 'iShares Russell 1000 ETF', description: 'Tracks the Russell 1000 Index for large-cap exposure.', assetType: 'US Equity', category: 'Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'SCHB', name: 'Schwab U.S. Broad Market ETF', description: 'Provides exposure to the total U.S. stock market.', assetType: 'US Equity', category: 'Total Market', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'IVW', name: 'iShares S&P 500 Growth ETF', description: 'Tracks the growth segment of the S&P 500.', assetType: 'US Growth', category: 'Large Growth', riskLevel: 'High', color: 'hsl(var(--chart-5))' },
  { ticker: 'OEF', name: 'iShares S&P 100 ETF', description: 'Tracks the S&P 100 Index of mega-cap U.S. stocks.', assetType: 'US Equity', category: 'Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'DIA', name: 'SPDR Dow Jones Industrial Average ETF', description: 'Tracks the Dow Jones Industrial Average.', assetType: 'US Equity', category: 'Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'QUAL', name: 'iShares MSCI USA Quality Factor ETF', description: 'Focuses on U.S. stocks with strong quality characteristics.', assetType: 'US Equity', category: 'Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'DFAC', name: 'Dimensional U.S. Core Equity 2 ETF', description: 'Provides diversified U.S. equity exposure with factor tilts.', assetType: 'US Equity', category: 'Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },
  { ticker: 'IUSG', name: 'iShares Core S&P U.S. Growth ETF', description: 'Tracks the S&P 900 Growth Index.', assetType: 'US Growth', category: 'Large Growth', riskLevel: 'High', color: 'hsl(var(--chart-5))' },
  { ticker: 'USMV', name: 'iShares MSCI USA Min Vol Factor ETF', description: 'Focuses on U.S. stocks with lower volatility.', assetType: 'US Equity', category: 'Large Blend', riskLevel: 'Low', color: 'hsl(var(--chart-1))' },
  { ticker: 'SCHG', name: 'Schwab U.S. Large-Cap Growth ETF', description: 'Tracks large-cap U.S. growth stocks.', assetType: 'US Growth', category: 'Large Growth', riskLevel: 'High', color: 'hsl(var(--chart-5))' },
  { ticker: 'DYNF', name: 'BlackRock U.S. Equity Factor Rotation ETF', description: 'Provides factor-based U.S. equity exposure with dynamic rotation.', assetType: 'US Equity', category: 'Large Blend', riskLevel: 'Moderate', color: 'hsl(var(--chart-1))' },

  // Sector ETFs
  { ticker: 'XLF', name: 'Financial Select Sector SPDR Fund', description: 'Tracks the financial sector within the S&P 500.', assetType: 'Financials', category: 'Financials', riskLevel: 'Moderate', color: 'hsl(var(--chart-4))' },
  { ticker: 'XLV', name: 'Health Care Select Sector SPDR Fund', description: 'Tracks the health care sector within the S&P 500.', assetType: 'Healthcare', category: 'Healthcare', riskLevel: 'Moderate', color: 'hsl(var(--chart-4))' },
  { ticker: 'XLE', name: 'Energy Select Sector SPDR Fund', description: 'Tracks the energy sector within the S&P 500.', assetType: 'Energy', category: 'Energy', riskLevel: 'High', color: 'hsl(var(--chart-4))' },
  { ticker: 'XLC', name: 'Communication Services Select Sector SPDR Fund', description: 'Tracks the communication services sector within the S&P 500.', assetType: 'Communication', category: 'Communication', riskLevel: 'Moderate', color: 'hsl(var(--chart-4))' },
  { ticker: 'XLY', name: 'Consumer Discretionary Select Sector SPDR Fund', description: 'Tracks the consumer discretionary sector within the S&P 500.', assetType: 'Consumer Discretionary', category: 'Consumer Cyclical', riskLevel: 'Moderate', color: 'hsl(var(--chart-4))' },
  { ticker: 'XLI', name: 'Industrial Select Sector SPDR Fund', description: 'Tracks the industrial sector within the S&P 500.', assetType: 'Industrials', category: 'Industrials', riskLevel: 'Moderate', color: 'hsl(var(--chart-4))' },

  // Real Estate
  { ticker: 'VNQ', name: 'Vanguard Real Estate ETF', description: 'Provides broad exposure to U.S. real estate investment trusts (REITs) and real estate companies.', assetType: 'REIT', category: 'Real Estate', riskLevel: 'Moderate', color: 'hsl(var(--chart-4))' },

  // Commodities & Crypto
  { ticker: 'GLD', name: 'SPDR Gold Trust', description: 'Provides exposure to physical gold bullion.', assetType: 'Commodities', category: 'Commodities', riskLevel: 'Moderate', color: 'hsl(var(--chart-6))' },
  { ticker: 'IAU', name: 'iShares Gold Trust', description: 'Tracks the price of physical gold.', assetType: 'Commodities', category: 'Commodities', riskLevel: 'Moderate', color: 'hsl(var(--chart-6))' },
  { ticker: 'SLV', name: 'iShares Silver Trust', description: 'Provides exposure to physical silver bullion.', assetType: 'Commodities', category: 'Commodities', riskLevel: 'High', color: 'hsl(var(--chart-6))' },
  { ticker: 'IBIT', name: 'iShares Bitcoin Trust', description: 'Provides exposure to Bitcoin through an ETF structure.', assetType: 'Crypto', category: 'Cryptocurrency', riskLevel: 'High', color: 'hsl(var(--chart-6))' },
  { ticker: 'FBTC', name: 'Fidelity Wise Origin Bitcoin Fund', description: 'Provides exposure to Bitcoin.', assetType: 'Crypto', category: 'Cryptocurrency', riskLevel: 'High', color: 'hsl(var(--chart-6))' },
];

export default function ETFCatalog() {
  const { toast } = useToast();
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  
  // UI state - with localStorage persistence
  const [filtersCollapsed, setFiltersCollapsed] = useState(() => {
    const saved = localStorage.getItem('etf-catalog-filters-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  
  // Favorites state - with localStorage persistence
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('etf-catalog-favorites');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Comparison state
  const [selectedForComparison, setSelectedForComparison] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);
  
  // Detailed view state
  const [detailedViewETF, setDetailedViewETF] = useState<ETF | null>(null);
  
  // Mobile filter sheet state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // 12 ETFs per page
  
  // Persist filters collapsed state
  useEffect(() => {
    localStorage.setItem('etf-catalog-filters-collapsed', JSON.stringify(filtersCollapsed));
  }, [filtersCollapsed]);
  
  // Persist favorites
  useEffect(() => {
    localStorage.setItem('etf-catalog-favorites', JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, assetTypeFilter, riskFilter, sortBy, showFavoritesOnly]);

  const filteredETFs = useMemo(() => {
    let filtered = ETF_DATA.filter(etf => {
      const matchesSearch = etf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           etf.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           etf.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAssetType = assetTypeFilter === 'all' || etf.assetType === assetTypeFilter;
      const matchesRisk = riskFilter === 'all' || etf.riskLevel === riskFilter;
      const matchesFavorites = !showFavoritesOnly || favorites.has(etf.ticker);

      return matchesSearch && matchesAssetType && matchesRisk && matchesFavorites;
    });

    // Sort ETFs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'ticker':
          return a.ticker.localeCompare(b.ticker);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, assetTypeFilter, riskFilter, sortBy, showFavoritesOnly, favorites]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredETFs.length / itemsPerPage);
  const paginatedETFs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredETFs.slice(startIndex, endIndex);
  }, [filteredETFs, currentPage, itemsPerPage]);

  // Fetch live data for paginated ETFs
  const liveDataQueries = useQueries({
    queries: paginatedETFs.map(etf => ({
      queryKey: ['etf-live-data', etf.ticker, 'v2'], // Added version to bust old cache
      queryFn: async () => {
        try {
          const res = await apiRequest('GET', `/api/etf/${etf.ticker}/info`);
          return await res.json();
        } catch (error) {
          console.error(`Error fetching data for ${etf.ticker}:`, error);
          return null;
        }
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    })),
  });

  // Fetch live data for ETFs selected for comparison (that might not be on current page)
  const comparisonTickers = Array.from(selectedForComparison);
  const comparisonDataQueries = useQueries({
    queries: comparisonTickers.map(ticker => ({
      queryKey: ['etf-live-data', ticker, 'v2'], // Added version to bust old cache
      queryFn: async () => {
        try {
          const res = await apiRequest('GET', `/api/etf/${ticker}/info`);
          return await res.json();
        } catch (error) {
          console.error(`Error fetching data for ${ticker}:`, error);
          return null;
        }
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    })),
  });

  // Create a map of ticker to live data
  const liveDataMap = useMemo(() => {
    const map = new Map<string, ETFLiveData>();
    
    // Helper function to extract live data with fallbacks
    const extractLiveData = (data: any): ETFLiveData => {
      // For 52-week change, try multiple fields
      let fiftyTwoWeekChange = undefined;
      if (data.fiftyTwoWeekChange !== undefined && data.fiftyTwoWeekChange !== null) {
        fiftyTwoWeekChange = data.fiftyTwoWeekChange * 100;
      } else if (data.fiftyTwoWeekChangePercent !== undefined && data.fiftyTwoWeekChangePercent !== null) {
        fiftyTwoWeekChange = data.fiftyTwoWeekChangePercent * 100;
      } else if (data.ytdReturn !== undefined && data.ytdReturn !== null) {
        // YTD return as fallback
        fiftyTwoWeekChange = data.ytdReturn * 100;
      }
      
      return {
        regularMarketPrice: data.regularMarketPrice,
        trailingAnnualDividendYield: (data.trailingAnnualDividendYield !== undefined && data.trailingAnnualDividendYield !== null)
          ? data.trailingAnnualDividendYield * 100 
          : undefined,
        fiftyTwoWeekChange,
        expenseRatio: (data.expenseRatio !== undefined && data.expenseRatio !== null)
          ? data.expenseRatio * 100 
          : undefined,
      };
    };
    
    // Add data from paginated ETFs
    paginatedETFs.forEach((etf, index) => {
      const queryResult = liveDataQueries[index];
      if (queryResult?.data) {
        map.set(etf.ticker, extractLiveData(queryResult.data));
      }
    });
    
    // Add data from comparison ETFs
    comparisonTickers.forEach((ticker, index) => {
      const queryResult = comparisonDataQueries[index];
      if (queryResult?.data && !map.has(ticker)) {
        map.set(ticker, extractLiveData(queryResult.data));
      }
    });
    
    return map;
  }, [paginatedETFs, liveDataQueries, comparisonTickers, comparisonDataQueries]);

  const assetTypes = Array.from(new Set(ETF_DATA.map(etf => etf.assetType)));
  const riskLevels = Array.from(new Set(ETF_DATA.map(etf => etf.riskLevel)));

  const clearFilters = () => {
    setSearchTerm('');
    setAssetTypeFilter('all');
    setRiskFilter('all');
    setSortBy('name');
    setShowFavoritesOnly(false);
  };
  
  const toggleFavorite = (ticker: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(ticker)) {
        newFavorites.delete(ticker);
        toast({
          title: "Removed from favorites",
          description: `${ticker} has been removed from your watchlist.`,
        });
      } else {
        newFavorites.add(ticker);
        toast({
          title: "Added to favorites",
          description: `${ticker} has been added to your watchlist.`,
        });
      }
      return newFavorites;
    });
  };
  
  const toggleComparison = (ticker: string) => {
    setSelectedForComparison(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(ticker)) {
        newSelection.delete(ticker);
      } else {
        if (newSelection.size >= 4) {
          toast({
            title: "Maximum reached",
            description: "You can compare up to 4 ETFs at a time.",
            variant: "destructive",
          });
          return prev;
        }
        newSelection.add(ticker);
      }
      return newSelection;
    });
  };
  
  const activeFiltersCount = [
    searchTerm !== '',
    assetTypeFilter !== 'all',
    riskFilter !== 'all',
    sortBy !== 'name',
    showFavoritesOnly
  ].filter(Boolean).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl pb-24">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-2">ETF Catalog</h1>
            <p className="text-muted-foreground">
              Explore our comprehensive collection of ETFs with detailed information and filtering options
            </p>
          </div>
          {favorites.size > 0 && (
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="flex items-center gap-2"
            >
              <Heart className={showFavoritesOnly ? "fill-current" : ""} />
              Favorites
              <Badge variant="secondary" className="ml-1">{favorites.size}</Badge>
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Filters */}
      <Card className="mb-6 hidden md:block transition-all duration-300">
        <CardHeader 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setFiltersCollapsed(!filtersCollapsed)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount} active
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm">
              {filtersCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </Button>
          </div>
        </CardHeader>
        
        <div 
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: filtersCollapsed ? '0px' : '1000px',
            opacity: filtersCollapsed ? 0 : 1,
          }}
        >
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Search Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Search className="h-4 w-4" />
                  Search
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search ETFs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-muted/30"
                  />
                </div>
              </div>

              {/* Filter Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filter by
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Asset Type Filter */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Asset Type</label>
                    <Select value={assetTypeFilter} onValueChange={setAssetTypeFilter}>
                      <SelectTrigger className="bg-muted/30">
                        <SelectValue placeholder="All Asset Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Asset Types</SelectItem>
                        {assetTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Risk Level Filter */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Risk Level</label>
                    <Select value={riskFilter} onValueChange={setRiskFilter}>
                      <SelectTrigger className="bg-muted/30">
                        <SelectValue placeholder="All Risk Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Risk Levels</SelectItem>
                        {riskLevels.map(level => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Sort Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <ArrowUpDown className="h-4 w-4" />
                  Sort by
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">Order</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-muted/30">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="ticker">Ticker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Clear Filters Button */}
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Mobile Filters Button */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetTrigger asChild>
          <Button className="md:hidden mb-6 w-full flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Search
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 overflow-y-auto max-h-[calc(85vh-100px)]">
            <div className="space-y-6">
              {/* Search Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Search className="h-4 w-4" />
                  Search
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search ETFs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-muted/30"
                  />
                </div>
              </div>

              {/* Filter Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filter by
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Asset Type Filter */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Asset Type</label>
                    <Select value={assetTypeFilter} onValueChange={setAssetTypeFilter}>
                      <SelectTrigger className="bg-muted/30">
                        <SelectValue placeholder="All Asset Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Asset Types</SelectItem>
                        {assetTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Risk Level Filter */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">Risk Level</label>
                    <Select value={riskFilter} onValueChange={setRiskFilter}>
                      <SelectTrigger className="bg-muted/30">
                        <SelectValue placeholder="All Risk Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Risk Levels</SelectItem>
                        {riskLevels.map(level => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Sort Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <ArrowUpDown className="h-4 w-4" />
                  Sort by
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">Order</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-muted/30">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="ticker">Ticker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Clear Filters Button */}
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Results Summary */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredETFs.length} of {ETF_DATA.length} ETFs
          {showFavoritesOnly && " (Favorites)"}
        </p>
        {filtersCollapsed && activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setFiltersCollapsed(false)}
            className="text-xs"
          >
            View Filters
          </Button>
        )}
      </div>

      {/* ETF Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedETFs.map((etf) => (
          <Card 
            key={etf.ticker} 
            className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] relative group/card flex flex-col"
          >
            {/* Comparison moved to bottom action buttons */}
            
            <div onClick={() => setDetailedViewETF(etf)} className="cursor-pointer flex-1">
              <CardHeader className="pb-3 pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: etf.color }}
                    />
                    <div>
                      <CardTitle className="text-lg">{etf.ticker}</CardTitle>
                      <CardDescription className="text-sm font-medium">
                        {etf.name}
                      </CardDescription>
                    </div>
                  </div>
                </div>
                <Badge 
                  variant={
                    etf.riskLevel === 'Low' ? 'secondary' :
                    etf.riskLevel === 'Moderate' ? 'default' : 'destructive'
                  }
                  className="mt-2 w-fit"
                >
                  {etf.riskLevel}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {etf.description}
                </p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Asset Type:</span>
                    <p className="text-muted-foreground">{etf.assetType}</p>
                  </div>
                  <div>
                    <span className="font-medium">Category:</span>
                    <p className="text-muted-foreground">{etf.category}</p>
                  </div>
                </div>
              </CardContent>
            </div>
            
            {/* Bottom Action Buttons */}
            <CardContent className="pt-0 pb-4">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={favorites.has(etf.ticker) ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(etf.ticker);
                  }}
                >
                  <Heart 
                    className={`h-4 w-4 ${favorites.has(etf.ticker) ? 'fill-current' : ''}`}
                  />
                  <span className="hidden sm:inline">
                    {favorites.has(etf.ticker) ? 'Favorited' : 'Favorite'}
                  </span>
                </Button>
                <Button
                  variant={selectedForComparison.has(etf.ticker) ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleComparison(etf.ticker);
                  }}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">{selectedForComparison.has(etf.ticker) ? 'Selected' : 'Compare'}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setDetailedViewETF(etf)}
                >
                  <Eye className="h-4 w-4" />
                  <span className="sm:hidden">Details</span>
                  <span className="hidden sm:inline">View Details</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      {filteredETFs.length > 0 && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              const showPage = page === 1 || 
                              page === totalPages || 
                              Math.abs(page - currentPage) <= 1;
              
              const showEllipsis = (page === 2 && currentPage > 3) || 
                                  (page === totalPages - 1 && currentPage < totalPages - 2);
              
              if (!showPage && !showEllipsis) return null;
              
              if (showEllipsis) {
                return <span key={page} className="px-2 text-muted-foreground">...</span>;
              }
              
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-10"
                >
                  {page}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {filteredETFs.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No ETFs Found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search terms or filters to find ETFs that match your criteria.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear All Filters
          </Button>
        </div>
      )}
      
      {/* Comparison Floating Bar */}
      {selectedForComparison.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg p-4 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="container mx-auto max-w-7xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium">
                {selectedForComparison.size} ETF{selectedForComparison.size > 1 ? 's' : ''} selected for comparison
              </p>
              <div className="flex gap-2 flex-wrap">
                {Array.from(selectedForComparison).map(ticker => (
                  <Badge key={ticker} variant="secondary" className="flex items-center gap-1">
                    {ticker}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => toggleComparison(ticker)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedForComparison(new Set())}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setShowComparison(true)}
                disabled={selectedForComparison.size < 2}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Compare
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Detailed ETF View Modal */}
      <DetailedETFView
        etf={detailedViewETF}
        isOpen={!!detailedViewETF}
        onClose={() => setDetailedViewETF(null)}
        isFavorite={detailedViewETF ? favorites.has(detailedViewETF.ticker) : false}
        onToggleFavorite={toggleFavorite}
        onAddToComparison={toggleComparison}
        isInComparison={detailedViewETF ? selectedForComparison.has(detailedViewETF.ticker) : false}
      />
      
      {/* Comparison Modal */}
      <ETFComparison
        etfs={ETF_DATA.filter(etf => selectedForComparison.has(etf.ticker)).map(etf => {
          const liveData = liveDataMap.get(etf.ticker);
          return {
            ...etf,
            expenseRatio: liveData?.expenseRatio,
            dividendYield: liveData?.trailingAnnualDividendYield,
            yearlyGain: liveData?.fiftyTwoWeekChange,
            lastPrice: liveData?.regularMarketPrice,
          };
        })}
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        onRemoveETF={toggleComparison}
      />
    </div>
  );
}
