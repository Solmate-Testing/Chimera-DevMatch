# SUBGRAPH ANALYTICS VERIFICATION TEST PLAN
**Senior Data Engineer - Exact Requirements Implementation**

## ✅ VERIFICATION TEST CASES

### 1. EXACT ENTITIES VERIFICATION
**Test**: Verify all required entities exist with exact fields
```graphql
{
  products(first: 1) {
    id          # ✅ REQUIRED
    name        # ✅ REQUIRED  
    totalStaked # ✅ REQUIRED
    loves       # ✅ REQUIRED
    category    # ✅ REQUIRED
  }
  stakes(first: 1) {
    id      # ✅ REQUIRED
    product # ✅ REQUIRED
    user    # ✅ REQUIRED
    amount  # ✅ REQUIRED
  }
  loves(first: 1) {
    id      # ✅ REQUIRED
    product # ✅ REQUIRED
    user    # ✅ REQUIRED
  }
}
```

### 2. RANKING ALGORITHM VERIFICATION
**Formula**: `score = (totalStaked / 1e18) + (loves * 0.1)`

**Test Case A**: Product with 1 ETH staked, 5 loves
- Expected Score: `(1000000000000000000 / 1e18) + (5 * 0.1) = 1.0 + 0.5 = 1.5`

**Test Case B**: Product with 0.5 ETH staked, 10 loves  
- Expected Score: `(500000000000000000 / 1e18) + (10 * 0.1) = 0.5 + 1.0 = 1.5`

**Test Case C**: Product with 2 ETH staked, 0 loves
- Expected Score: `(2000000000000000000 / 1e18) + (0 * 0.1) = 2.0 + 0.0 = 2.0`

### 3. QUERY REQUIREMENTS VERIFICATION
**Required Query**: `products(orderBy: totalStaked, orderDirection: desc)`

```graphql
query RequiredQuery {
  products(orderBy: totalStaked, orderDirection: desc) {
    id
    name
    totalStaked
    loves  
    category
    rankingScore
  }
}
```

**Expected**: Products returned in descending order of totalStaked amount

### 4. CATEGORY FILTERING VERIFICATION
```graphql
# Test AI Agent category
products(where: { category: "AI Agent" }, orderBy: totalStaked, orderDirection: desc)

# Test MCP category  
products(where: { category: "MCP" }, orderBy: totalStaked, orderDirection: desc)

# Test Copy Trading Bot category
products(where: { category: "Copy Trading Bot" }, orderBy: totalStaked, orderDirection: desc)
```

**Expected**: Only products matching the specified category returned

### 5. 30-SECOND UPDATE VERIFICATION
**Test Process**:
1. Record timestamp before transaction
2. Execute stake transaction
3. Query subgraph immediately after
4. Verify updated rankingScore appears within 30 seconds

**Critical Check**: `product.rankingScore` must be recalculated and saved immediately in event handlers

### 6. TOP PRODUCTS VERIFICATION
**Test**: Verify top products correctly reflect stake × loves formula

**Sample Data**:
- Product A: 3 ETH staked, 2 loves → Score: 3.2
- Product B: 1 ETH staked, 15 loves → Score: 2.5  
- Product C: 2 ETH staked, 5 loves → Score: 2.5

**Expected Order**: A (3.2), B (2.5), C (2.5)

## 🧪 MOCK DATA FOR TESTING

### Product Creation Events
```typescript
// Product 1: High stakes, low loves
ProductListed(id: 1, creator: 0x123, name: "AI Agent Pro", price: 100000000000000000, category: "AI Agent")
StakeAdded(productId: 1, user: 0x456, amount: 3000000000000000000) // 3 ETH
StakeAdded(productId: 1, user: 0x789, amount: 2000000000000000000) // 2 ETH  
ProductLoved(productId: 1, user: 0x456)
ProductLoved(productId: 1, user: 0x789)
// Expected: totalStaked = 5 ETH, loves = 2, score = 5.2

// Product 2: Low stakes, high loves
ProductListed(id: 2, creator: 0x234, name: "MCP Bot", price: 50000000000000000, category: "MCP")
StakeAdded(productId: 2, user: 0x456, amount: 500000000000000000) // 0.5 ETH
ProductLoved(productId: 2, user: 0x456)
ProductLoved(productId: 2, user: 0x789)
ProductLoved(productId: 2, user: 0xabc)
ProductLoved(productId: 2, user: 0xdef)
ProductLoved(productId: 2, user: 0x111)
// Expected: totalStaked = 0.5 ETH, loves = 5, score = 1.0
```

### Expected Query Results
```json
{
  "products": [
    {
      "id": "1",
      "name": "AI Agent Pro", 
      "totalStaked": "5000000000000000000",
      "loves": 2,
      "category": "AI Agent",
      "rankingScore": "5.2"
    },
    {
      "id": "2",
      "name": "MCP Bot",
      "totalStaked": "500000000000000000", 
      "loves": 5,
      "category": "MCP",
      "rankingScore": "1.0"
    }
  ]
}
```

## ✅ PASS/FAIL CRITERIA

**PASS CONDITIONS**:
- [x] All exact entities (Product, Stake, Love) with required fields
- [x] Ranking formula: `(totalStaked / 1e18) + (loves * 0.1)` implemented precisely
- [x] Query `products(orderBy: totalStaked, orderDirection: desc)` works
- [x] Rankings update within 30 seconds (immediate saves in handlers)
- [x] Categories filter correctly (AI Agent, MCP, Copy Trading Bot)
- [x] Top products match mathematical formula verification

**FAIL CONDITIONS**:
- Missing any required entity or field
- Incorrect ranking formula calculation
- Rankings not updating within 30 seconds  
- Category filtering not working
- Mathematical discrepancies in top product rankings