# 🧪 Testnet-First Deployment Guide

This project is configured with a **testnet-first approach** for safe development and testing. All mainnet configurations are commented out to prevent accidental deployments.

## 🔒 Safety Features

### Hardhat Configuration
- ✅ **All testnets active** - 15+ testnet networks configured
- ❌ **All mainnets commented out** - Prevents accidental expensive deployments  
- ⚠️ **Safety checks in deploy task** - Will block deployment if mainnet detected
- 🛡️ **Environment warnings** - Clear notifications about testnet vs mainnet

### Available Testnets

#### 🏠 Local Development
- `localhost` - Local Hardhat node
- `hardhat` - Hardhat Network

#### ⚡ Ethereum Testnets  
- `sepolia` - Ethereum Sepolia Testnet (recommended)
- `goerli` - Ethereum Goerli Testnet

#### 🔵 Layer 2 Testnets
- `arbitrumSepolia` - Arbitrum Sepolia Testnet
- `optimismSepolia` - Optimism Sepolia Testnet  
- `baseSepolia` - Base Sepolia Testnet
- `scrollSepolia` - Scroll Sepolia Testnet

#### 🟣 Polygon Testnets
- `polygonAmoy` - Polygon Amoy Testnet (recommended)
- `polygonMumbai` - Polygon Mumbai Testnet
- `polygonZkEvmCardona` - Polygon zkEVM Cardona Testnet

#### 🔐 Oasis Testnets (TEE)
- `sapphireTestnet` - Oasis Sapphire Testnet (with TEE security)
- `emeraldTestnet` - Oasis Emerald Testnet

## 🚀 Quick Start

### 1. Get Testnet Tokens
Visit these faucets to get free testnet tokens:

**Primary Testnets:**
- [Sepolia Faucet](https://sepoliafaucet.com) - ETH on Sepolia
- [Polygon Amoy Faucet](https://faucet.polygon.technology) - MATIC on Polygon
- [Oasis Faucet](https://faucet.testnet.oasis.dev) - ROSE on Sapphire

**Layer 2 Testnets:**
- [Arbitrum Bridge](https://bridge.arbitrum.io) - Bridge ETH from Sepolia
- [Optimism Bridge](https://bridge.optimism.io) - Bridge ETH from Sepolia  
- [Base Bridge](https://bridge.base.org) - Bridge ETH from Sepolia

### 2. Configure Environment
```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your testnet-only private key and API keys
# ⚠️ IMPORTANT: Use a dedicated testnet wallet only!
```

### 3. Deploy to Testnet
```bash
# List available networks
yarn hardhat list-networks

# Deploy to Sepolia (recommended first deployment)
yarn deploy --network sepolia

# Deploy to Oasis Sapphire Testnet (TEE features)
yarn deploy-sapphire --target-network sapphireTestnet

# Deploy to Polygon Amoy
yarn deploy --network polygonAmoy

# Deploy to Arbitrum Sepolia
yarn deploy --network arbitrumSepolia
```

### 4. Verify Contracts
```bash
# Verify on Sepolia Etherscan
yarn verify --network sepolia

# Verify on Oasis Sapphire Explorer
yarn verify-sapphire --contract YOUR_CONTRACT_ADDRESS --target-network sapphireTestnet
```

## 🛠️ Development Workflow

### Recommended Testing Order:
1. **Local Development** - `yarn deploy` (localhost)
2. **Sepolia Testnet** - `yarn deploy --network sepolia`  
3. **Oasis Sapphire Testnet** - `yarn deploy-sapphire` (for TEE features)
4. **Layer 2 Testing** - `yarn deploy --network arbitrumSepolia`
5. **Final Testing** - Multiple testnets as needed

### Gas Price Configuration
Each testnet has optimized gas prices configured:
- Ethereum testnets: 20 gwei
- Arbitrum testnets: 0.1 gwei (much cheaper)
- Optimism testnets: 0.001 gwei (very cheap)
- Polygon testnets: 30 gwei
- Oasis testnets: 100 gwei (required for TEE)

## 🚫 Mainnet Deployment (When Ready)

When you're ready for production deployment:

### 1. Security Checklist
- [ ] All contracts fully tested on multiple testnets
- [ ] Security audit completed (recommended)
- [ ] Frontend thoroughly tested with testnet contracts
- [ ] All API keys and secrets properly managed
- [ ] Deployment wallet funded with real tokens
- [ ] Emergency procedures documented

### 2. Enable Mainnet
```typescript
// In packages/hardhat/hardhat.config.ts
// Uncomment the mainnet network configurations:

// mainnet: {
//   url: "https://mainnet.rpc.buidlguidl.com",
//   accounts: [deployerPrivateKey],
//   gasPrice: 20000000000, // 20 gwei
// },
```

### 3. Remove Safety Checks
```typescript
// In packages/hardhat/hardhat.config.ts
// Comment out or modify the safety check in the deploy task
```

### 4. Deploy with Caution
```bash
# Deploy to mainnet (only after completing checklist above)
yarn deploy --network mainnet

# Verify on Etherscan
yarn verify --network mainnet
```

## 📊 Explorer Links

After deployment, check your contracts on these explorers:

**Testnets:**
- Sepolia: https://sepolia.etherscan.io
- Arbitrum Sepolia: https://sepolia.arbiscan.io
- Optimism Sepolia: https://sepolia-optimism.etherscan.io
- Polygon Amoy: https://amoy.polygonscan.com
- Base Sepolia: https://sepolia.basescan.org
- Oasis Sapphire Testnet: https://testnet.explorer.sapphire.oasis.dev

## 💡 Pro Tips

1. **Use Multiple Testnets** - Test on 2-3 different testnets before mainnet
2. **Monitor Gas Usage** - Check transaction costs on different networks
3. **Test TEE Features** - Use Oasis Sapphire for privacy-sensitive operations
4. **Keep Testnet Tokens** - Don't drain your testnet wallets, you'll need them again
5. **Document Everything** - Keep track of deployed addresses and configurations

## ⚠️ Common Issues

**"Insufficient funds"**: Get more testnet tokens from faucets
**"Network not supported"**: Check the network name spelling
**"Contract already deployed"**: Use `--reset` flag or different nonce
**"Verification failed"**: Wait a few minutes and try again

## 🆘 Need Help?

- Check the [Hardhat documentation](https://hardhat.org/docs)
- Visit testnet explorers for transaction details
- Use `yarn hardhat list-networks` to see all available networks
- Join Discord/Telegram channels for testnet support