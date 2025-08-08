// Complete Marketplace ABI - Generated from Marketplace.sol

export const marketplaceABI = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "listProduct",
    "inputs": [
      {"name": "_name", "type": "string"},
      {"name": "_description", "type": "string"},
      {"name": "_price", "type": "uint256"},
      {"name": "_category", "type": "string"},
      {"name": "_encryptedApiKey", "type": "bytes"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "stakeOnProduct",
    "inputs": [
      {"name": "_productId", "type": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "loveProduct",
    "inputs": [
      {"name": "_productId", "type": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "purchaseProduct",
    "inputs": [
      {"name": "_id", "type": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "runModel",
    "inputs": [
      {"name": "_productId", "type": "uint256"},
      {"name": "_prompt", "type": "string"}
    ],
    "outputs": [
      {"name": "", "type": "string"}
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getProduct",
    "inputs": [
      {"name": "_id", "type": "uint256"}
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          {"name": "id", "type": "uint256"},
          {"name": "creator", "type": "address"},
          {"name": "name", "type": "string"},
          {"name": "description", "type": "string"},
          {"name": "price", "type": "uint256"},
          {"name": "category", "type": "string"},
          {"name": "active", "type": "bool"},
          {"name": "createdAt", "type": "uint256"},
          {"name": "apiKeyHash", "type": "bytes32"},
          {"name": "totalStaked", "type": "uint256"},
          {"name": "loves", "type": "uint256"}
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "productCount",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "uint256"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "address"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "ProductListed",
    "inputs": [
      {"name": "productId", "type": "uint256", "indexed": true},
      {"name": "creator", "type": "address", "indexed": true},
      {"name": "name", "type": "string", "indexed": false},
      {"name": "price", "type": "uint256", "indexed": false},
      {"name": "category", "type": "string", "indexed": false}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "StakeAdded",
    "inputs": [
      {"name": "productId", "type": "uint256", "indexed": true},
      {"name": "user", "type": "address", "indexed": true},
      {"name": "amount", "type": "uint256", "indexed": false}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProductLoved",
    "inputs": [
      {"name": "productId", "type": "uint256", "indexed": true},
      {"name": "user", "type": "address", "indexed": true}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProductPurchased",
    "inputs": [
      {"name": "productId", "type": "uint256", "indexed": true},
      {"name": "buyer", "type": "address", "indexed": true},
      {"name": "creator", "type": "address", "indexed": true},
      {"name": "price", "type": "uint256", "indexed": false}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ModelExecutionRequested",
    "inputs": [
      {"name": "productId", "type": "uint256", "indexed": true},
      {"name": "user", "type": "address", "indexed": true},
      {"name": "requestId", "type": "bytes32", "indexed": true},
      {"name": "input", "type": "string", "indexed": false}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ModelResultReceived",
    "inputs": [
      {"name": "productId", "type": "uint256", "indexed": true},
      {"name": "user", "type": "address", "indexed": true},
      {"name": "requestId", "type": "bytes32", "indexed": true},
      {"name": "result", "type": "string", "indexed": false}
    ],
    "anonymous": false
  }
] as const;

// Contract ABIs Export
export const contractsData = {
  Marketplace: {
    abi: marketplaceABI,
  },
} as const;