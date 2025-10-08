# Adding New Investment Products to Stack16

This guide explains how to add new investment products (bonds, crypto, commodities, etc.) to the Stack16 platform.

## Overview

The refactored architecture makes it easy to add new investment products through:
1. Product definition in the ETF catalog
2. Portfolio generation strategy
3. Market data integration

## Step 1: Define the Product

Add the product to `shared/constants/etf-catalog.ts`:

```typescript
export const ETF_CATALOG: Record<string, ETFDefinition> = {
  // ... existing products ...
  
  // New product example: Gold commodity ETF
  GLD: {
    ticker: 'GLD',
    name: 'SPDR Gold Trust',
    assetType: 'Commodity',
    color: 'hsl(var(--chart-6))', // Add new color if needed
    category: 'commodity',
    geographicFocus: 'global',
    isESG: false,
    isDividendFocused: false,
    isGrowthFocused: false,
  },
};
```

## Step 2: Update Portfolio Generator

Modify `server/services/portfolio-generator.service.ts` to include the new product in allocation strategies:

```typescript
private readonly ETF_SETS: Record<string, ETFAllocation[]> = {
  conservative: [
    // ... existing allocations ...
    { ticker: 'GLD', name: 'SPDR Gold Trust', percentage: 5, color: 'hsl(var(--chart-6))', assetType: 'Commodity' },
  ],
  // ... other risk levels ...
};
```

Or create a new strategy method:

```typescript
/**
 * Apply commodity preferences
 */
private applyCommodityPreferences(
  allocations: ETFAllocation[],
  commodityPreference: string
): ETFAllocation[] {
  if (commodityPreference === 'include-gold') {
    // Add gold allocation
    const goldAllocation: ETFAllocation = {
      ticker: 'GLD',
      name: 'SPDR Gold Trust',
      percentage: 5,
      color: 'hsl(var(--chart-6))',
      assetType: 'Commodity',
    };
    
    // Reduce other allocations proportionally
    const totalOther = allocations.reduce((sum, a) => sum + a.percentage, 0);
    allocations = allocations.map(a => ({
      ...a,
      percentage: (a.percentage / totalOther) * 95, // Leave 5% for gold
    }));
    
    allocations.push(goldAllocation);
  }
  
  return allocations;
}
```

Then integrate it into the main `generatePortfolio` method:

```typescript
generatePortfolio(assessment: any): ETFAllocation[] {
  // ... existing logic ...
  
  // Apply commodity preferences
  if (assessment.commodityPreference) {
    allocations = this.applyCommodityPreferences(allocations, assessment.commodityPreference);
  }
  
  // ... rest of logic ...
}
```

## Step 3: Add Questionnaire Options (Optional)

If the new product requires user preferences, update the risk assessment:

1. Update `client/src/components/RiskAssessment.tsx`:
```typescript
const [commodityPreference, setCommodityPreference] = useState('none');

// Add to form
<RadioGroup value={commodityPreference} onValueChange={setCommodityPreference}>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="none" id="commodity-none" />
    <Label htmlFor="commodity-none">No Commodities</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="include-gold" id="commodity-gold" />
    <Label htmlFor="commodity-gold">Include Gold (5%)</Label>
  </div>
</RadioGroup>
```

2. Include in submission:
```typescript
const submissionData = {
  // ... other fields ...
  commodityPreference,
};
```

## Step 4: Market Data Integration

If using Yahoo Finance (or similar), no changes needed - the existing `YahooFinanceService` will handle the new ticker automatically.

For other data sources:

1. Create a new service in `server/services/`:
```typescript
// server/services/crypto-data.service.ts
export class CryptoDataService {
  async getQuote(ticker: string): Promise<any> {
    // Fetch from crypto API
  }
  
  async getHistoricalData(ticker: string, period: string): Promise<any> {
    // Fetch historical data
  }
}
```

2. Update `market-data.routes.ts` to use the appropriate service based on product type:
```typescript
router.get('/:ticker/info', isAuthenticated, async (req, res) => {
  const { ticker } = req.params;
  
  // Determine product type
  const product = getETF(ticker);
  
  if (product?.category === 'crypto') {
    // Use crypto service
    const data = await cryptoDataService.getQuote(ticker);
    return res.json(data);
  }
  
  // Default to Yahoo Finance
  const data = await yahooFinanceService.getQuote(ticker);
  res.json(data);
});
```

## Step 5: Update Frontend Display

Add product-specific display logic in `client/src/components/` if needed:

```typescript
// client/src/components/portfolio/AllocationCard.tsx
const getAssetIcon = (assetType: string) => {
  switch(assetType) {
    case 'Commodity':
      return <GoldIcon className="h-5 w-5" />;
    case 'Crypto':
      return <BitcoinIcon className="h-5 w-5" />;
    default:
      return <TrendingUpIcon className="h-5 w-5" />;
  }
};
```

## Step 6: Testing

1. Test portfolio generation with new product:
```bash
# Generate portfolio and verify allocation
curl -X POST http://localhost:5000/api/portfolio/generate \
  -H "Cookie: connect.sid=..." \
  -H "Content-Type: application/json"
```

2. Test market data retrieval:
```bash
curl http://localhost:5000/api/etf/GLD/info \
  -H "Cookie: connect.sid=..."
```

3. Verify performance calculations include the new product.

## Example: Adding Cryptocurrency Support

Here's a complete example for adding Bitcoin ETF (GBTC):

### 1. Add to catalog
```typescript
// shared/constants/etf-catalog.ts
GBTC: {
  ticker: 'GBTC',
  name: 'Grayscale Bitcoin Trust',
  assetType: 'Crypto',
  color: 'hsl(30, 95%, 50%)', // Orange for crypto
  category: 'commodity', // Or create new 'crypto' category
  geographicFocus: 'global',
  isESG: false,
  isDividendFocused: false,
  isGrowthFocused: true,
},
```

### 2. Add to aggressive portfolio
```typescript
// server/services/portfolio-generator.service.ts
aggressive: [
  { ticker: 'VTI', ..., percentage: 65 },
  { ticker: 'VXUS', ..., percentage: 20 },
  { ticker: 'QQQ', ..., percentage: 10 },
  { ticker: 'GBTC', name: 'Grayscale Bitcoin Trust', percentage: 5, color: 'hsl(30, 95%, 50%)', assetType: 'Crypto' },
],
```

### 3. Test
Portfolio will now automatically include GBTC for aggressive risk profiles, and market data will be fetched via Yahoo Finance.

## Best Practices

1. **Start Small**: Add new products to existing portfolios incrementally (1-5% allocation)
2. **Test Thoroughly**: Verify market data availability before adding products
3. **Document**: Update this guide with any new product categories
4. **Monitor**: Check market data API rate limits when adding many new products
5. **User Education**: Update help text to explain new product categories

## Advanced: Custom Product Types

For non-ETF products requiring custom logic:

1. Implement the `InvestmentProduct` interface:
```typescript
// server/types/investment-product.ts
class BondProduct implements InvestmentProduct {
  type = 'bond' as const;
  ticker: string;
  name: string;
  category: string;
  
  async getMarketData(): Promise<ProductMarketData> {
    // Custom bond data fetching
  }
  
  async getPerformance(period: PerformancePeriod): Promise<PerformanceData> {
    // Custom performance calculation
  }
  
  matchesCriteria(criteria: InvestmentCriteria): boolean {
    // Custom filtering logic
  }
}
```

2. Register with the product registry:
```typescript
import { productRegistry } from './types/investment-product';

const bondProduct = new BondProduct('AGG', 'iShares Core U.S. Aggregate Bond ETF', 'Bonds');
productRegistry.registerProduct(bondProduct);
```

## Need Help?

- Check `server/services/portfolio-generator.service.ts` for allocation logic examples
- Review `shared/constants/etf-catalog.ts` for product definition patterns
- See `server/services/yahoo-finance.service.ts` for market data integration patterns

