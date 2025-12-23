# Binance Testnet Trading Limits

## Common Order Rejection Errors

### 1. **NOTIONAL Error**
**Error**: `Filter failure: NOTIONAL`

**Cause**: Order value (quantity × price) is below minimum

**Minimum Notional Value**: $10 USD

**Solutions**:
| Symbol | Price (approx) | Min Quantity |
|--------|----------------|--------------|
| BTCUSDT | $90,000 | 0.00012 BTC |
| ETHUSDT | $3,000 | 0.0034 ETH |
| BNBUSDT | $700 | 0.015 BNB |
| SOLUSDT | $130 | 0.08 SOL |
| ADAUSDT | $0.90 | 12 ADA |

### 2. **LOT_SIZE Error**
**Error**: `Filter failure: LOT_SIZE`

**Cause**: Quantity doesn't meet min/max/step requirements

**Common Lot Sizes**:
| Symbol | Min Qty | Max Qty | Step Size |
|--------|---------|---------|-----------|
| BTCUSDT | 0.00001 | 9000 | 0.00001 |
| ETHUSDT | 0.0001 | 90000 | 0.0001 |
| BNBUSDT | 0.001 | 90000 | 0.001 |
| SOLUSDT | 0.1 | 90000 | 0.1 |
| ADAUSDT | 1 | 9000000 | 1 |

### 3. **PRICE_FILTER Error**
**Error**: `Filter failure: PRICE_FILTER`

**Cause**: Price doesn't meet min/max/tick size requirements

**Tick Sizes** (price must be multiple of):
| Symbol | Tick Size |
|--------|-----------|
| BTCUSDT | 0.01 |
| ETHUSDT | 0.01 |
| BNBUSDT | 0.01 |
| SOLUSDT | 0.01 |
| ADAUSDT | 0.0001 |

## Recommended Order Sizes (Safe Values)

### For Testing:
```
BTCUSDT:
  - Quantity: 0.0002 BTC (≈ $18)
  - Price: Market or current price

ETHUSDT:
  - Quantity: 0.005 ETH (≈ $15)
  - Price: Market or current price

BNBUSDT:
  - Quantity: 0.02 BNB (≈ $14)
  - Price: Market or current price

SOLUSDT:
  - Quantity: 0.1 SOL (≈ $13)
  - Price: Market or current price

ADAUSDT:
  - Quantity: 15 ADA (≈ $13.50)
  - Price: Market or current price
```

## How to Calculate Valid Orders

### Step 1: Check Minimum Notional
```
Order Value = Quantity × Price
Order Value must be ≥ $10
```

### Step 2: Check Lot Size
```
Quantity must be:
  - ≥ minQty
  - ≤ maxQty
  - Multiple of stepSize
```

### Step 3: Check Price Filter (for LIMIT orders)
```
Price must be:
  - ≥ minPrice
  - ≤ maxPrice
  - Multiple of tickSize
```

## Examples

### ✅ Valid Orders:

```javascript
// BTCUSDT
{
  symbol: 'BTCUSDT',
  side: 'BUY',
  type: 'LIMIT',
  quantity: 0.0002,  // ✓ Above min (0.00001)
  price: 90000.00,   // ✓ Multiple of 0.01
  // Value: $18 ✓ Above $10
}

// SOLUSDT
{
  symbol: 'SOLUSDT',
  side: 'BUY',
  type: 'LIMIT',
  quantity: 0.1,     // ✓ Minimum is 0.1
  price: 126.00,     // ✓ Multiple of 0.01
  // Value: $12.60 ✓ Above $10
}
```

### ❌ Invalid Orders:

```javascript
// SOLUSDT - LOT_SIZE Error
{
  symbol: 'SOLUSDT',
  quantity: 0.0001,  // ❌ Below min (0.1)
  price: 126.00,
}

// ETHUSDT - NOTIONAL Error
{
  symbol: 'ETHUSDT',
  quantity: 0.0001,  // ❌ Value = $0.30 (below $10)
  price: 3000.00,
}

// BTCUSDT - PRICE_FILTER Error
{
  symbol: 'BTCUSDT',
  quantity: 0.0002,
  price: 90000.123,  // ❌ Not multiple of 0.01
}
```

## Quick Reference

**Always ensure**:
1. ✅ Order value ≥ $10
2. ✅ Quantity ≥ minimum for that symbol
3. ✅ Quantity is multiple of step size
4. ✅ Price is multiple of tick size (for LIMIT orders)

## Need Help?

If you're unsure about limits for a specific symbol, you can check:
```
GET https://testnet.binance.vision/api/v3/exchangeInfo?symbol=SOLUSDT
```

This returns all filters including LOT_SIZE, PRICE_FILTER, and MIN_NOTIONAL.
