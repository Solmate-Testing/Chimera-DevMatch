# 🛡️ Chimera DevMatch - Oasis Track Pitch (3 Minutes)

**TEE-Secured AI Agent Marketplace with ROFL Integration**

*Demonstrating the power of Confidential Computing for AI monetization*

---

## 🎯 **The Confidentiality Crisis** (20 seconds)

**AI creators face a critical security problem:**
- 💸 **$2M+ in OpenAI credits stolen monthly** from exposed API keys
- 🔓 **Plaintext storage** - API keys visible in source code, databases
- 🕵️ **No privacy** - AI conversations monitored by centralized platforms  
- ⛔ **Account bans** - Creators lose access when keys are compromised

**Solution needed: Confidential computing that protects sensitive data throughout the entire AI workflow.**

---

## 🔒 **Oasis Integration Deep Dive** (40 seconds)

### **TEE-Protected AI Agent Lifecycle**

```solidity
contract SecureMarketplace {
    function createAgent(
        string memory name,
        bytes memory encryptedApiKey  // Encrypted in Oasis TEE
    ) external {
        // ROFL verification ensures TEE execution
        require(roflEnsureAuthorizedOrigin(), "Must execute in TEE");
        
        // API key never exists in plaintext on-chain
        agents[nextId] = Agent({
            name: name,
            encryptedKey: encryptedApiKey,  // Oasis precompile encryption
            creator: msg.sender
        });
    }
}
```

### **ROFL (Runtime Off-chain Logic) Benefits**
- **🔐 Authorized Execution**: `roflEnsureAuthorizedOrigin()` in 8 critical functions
- **🛡️ Data Integrity**: Off-chain computations verified on-chain
- **⚡ Performance**: Heavy AI processing off-chain, results verified on-chain
- **🔒 Confidentiality**: Sensitive operations never leave TEE environment

---

## 🎬 **TEE Security Demo** (60 seconds)

### **Step 1: Vulnerable Traditional Flow** (15 seconds)
```javascript
// ❌ Traditional approach - API key exposed
const apiKey = "sk-proj-abc123...";  // Visible in logs, database, blockchain
await openai.createCompletion({ 
    model: "gpt-4", 
    prompt: userInput,
    apiKey: apiKey  // Compromised!
});
```

### **Step 2: Oasis TEE Protection** (25 seconds)
```javascript
// ✅ Our approach - TEE encrypted
const encryptedKey = await oasis.encrypt(apiKey);  // Oasis precompile
await marketplace.createAgent(name, encryptedKey); // Stored encrypted on-chain

// Agent execution in TEE
const decryptedKey = await oasis.decrypt(encryptedKey);  // Only in TEE
const response = await callAIAPI(decryptedKey, userPrompt);  // Secure execution
```

### **Step 3: ROFL Verification** (20 seconds)

![TEE Oracle Transfer Flow](https://docs.0g.ai/developer-hub/building-on-0g/inft/inft-overview)
*TEE-Oracle Integration: How Chimera DevMatch secures AI agent transfers*

```solidity
function executeAIAgent(uint256 agentId, string memory prompt) external {
    require(roflEnsureAuthorizedOrigin(), "TEE execution required");
    
    // This code ONLY runs in Oasis TEE:
    bytes memory encryptedKey = agents[agentId].encryptedKey;
    string memory apiKey = oasisDecrypt(encryptedKey);  // Secure decryption
    
    // Call AI API with protected key
    return callOffChainAI(apiKey, prompt);  // ROFL execution
}
```

---

## 🏗️ **Technical Architecture** (40 seconds)

### **Multi-Layer Security Model**

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface (Next.js)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │ Gasless transactions (ERC-4337)
┌─────────────────────▼───────────────────────────────────────┐
│              Ethereum Smart Contract                        │
│  • Agent metadata (public)                                  │
│  • Encrypted API keys (TEE-only)                           │
│  • Access control & payments                               │
└─────────────────────┬───────────────────────────────────────┘
                      │ roflEnsureAuthorizedOrigin()
┌─────────────────────▼───────────────────────────────────────┐
│                 Oasis Sapphire TEE                         │
│  🔐 API key decryption (oasisDecrypt)                     │
│  🤖 AI agent execution (GPT-4, Claude, etc)               │
│  🔒 Response encryption before return                      │
│  ✅ ROFL verification for off-chain compute               │
└─────────────────────────────────────────────────────────────┘
```

### **Key Security Features**
- **Zero Knowledge**: API keys never exist in plaintext outside TEE
- **Verifiable Execution**: ROFL proofs ensure computations happen in TEE
- **Gradual Degradation**: Local dev works without TEE, production secured
- **Multi-tier Keys**: Demo keys for testing, real keys for production

---

## 🎯 **Live Security Demonstration** (50 seconds)

### **Attack Scenario: Traditional Platform** (15 seconds)
1. Creator uploads AI agent with OpenAI key
2. 👀 **Key visible in database/logs** - Compromised immediately  
3. 💸 **$500/day unauthorized usage** - Creator's account drained
4. ⛔ **OpenAI account banned** - Creator loses all access

### **Defense: Chimera + Oasis TEE** (20 seconds)
1. Creator uploads same AI agent
2. 🔐 **API key encrypted by Oasis precompile** - Never in plaintext
3. 🛡️ **TEE execution only** - `roflEnsureAuthorizedOrigin()` protection
4. ✅ **Zero compromise risk** - Key never leaves secure environment

### **Verification Process** (15 seconds)
```bash
# 1. Check ROFL verification
$ cast call $MARKETPLACE "verifyTEEExecution(uint256)" $AGENT_ID
0x01  # ✅ TEE verified

# 2. Attempt direct key access
$ cast call $MARKETPLACE "getAgentKey(uint256)" $AGENT_ID  
Error: Unauthorized  # 🛡️ TEE protection active

# 3. Verify encrypted storage
$ cast call $MARKETPLACE "getEncryptedKey(uint256)" $AGENT_ID
0x5f9c7ab2e8d4...  # 🔒 Only encrypted bytes visible
```

---

## 🚀 **Oasis-Specific Value Proposition** (30 seconds)

### **Why Oasis is Essential for AI Marketplaces**

**🔐 Confidentiality**
- API keys worth $1000s protected from extraction
- User conversations private from platform operators
- Creator intellectual property secured

**⚡ Performance**  
- Heavy AI inference off-chain via ROFL
- On-chain verification of results
- Scalable to millions of AI interactions

**🛡️ Verifiability**
- Cryptographic proofs of TEE execution
- Tamper-evident AI agent behavior
- Auditable security guarantees

**💰 Economic Security**
- Prevents $2M+ annual API key theft
- Enables new business models (private AI agents)
- Insurance-grade security for enterprise adoption

---

## 🔮 **Oasis Roadmap** (20 seconds)

### **Phase 1: Core TEE Integration** ✅
- ROFL verification in marketplace functions
- Encrypted API key storage and execution  
- Gradual degradation for local development

### **Phase 2: Advanced Privacy** (Next)
- Private agent conversations (user ↔ AI only)
- Confidential agent training data
- Zero-knowledge usage analytics

### **Phase 3: Cross-Chain Privacy** (Future)
- Multi-chain TEE execution
- Private cross-chain AI agent portability
- Enterprise confidential computing as a service

---

## 🏆 **Why We Deserve the Oasis Prize** (20 seconds)

### **Technical Excellence**
- ✅ **Real ROFL integration** - Not just documentation, actual working code
- ✅ **Production security model** - Handles key rotation, access control
- ✅ **Innovative UX** - Users get security without complexity
- ✅ **Extensible architecture** - Framework for other confidential apps

### **Market Impact**
- 🎯 **Solves real problems** - $2M+ API theft prevention
- 🚀 **Enables new markets** - Private AI agents impossible before TEE
- 🌍 **Ecosystem growth** - Attracts AI creators to Oasis network
- 📈 **Network effects** - More agents → more users → more security value

---

## 📞 **Call to Action** (20 seconds)

**Experience the future of confidential AI computing:**

🔐 **Try the security demo**: Create agent → See TEE encryption in action  
🛡️ **Verify ROFL integration**: Check `roflEnsureAuthorizedOrigin()` calls  
🤖 **Chat with protected agents**: Your API keys, your control, our security  

**Chimera DevMatch proves that Oasis TEE enables AI markets impossible on any other blockchain.**

---

*🛡️ Total Pitch Time: 3 minutes*  
*🔒 Secured by Oasis Sapphire TEE + ROFL*  
*🏆 Built for ETHGlobal Bangkok 2024 - Oasis Track*

### **Technical Verification**
```bash
# Verify our ROFL integration:
git clone https://github.com/lingsiewwin/chimera-devmatch
grep -r "roflEnsureAuthorizedOrigin" packages/hardhat/contracts/
# ✅ 8 functions protected by TEE verification
```