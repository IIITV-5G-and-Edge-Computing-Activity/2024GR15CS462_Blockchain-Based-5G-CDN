# ⚡ Blockchain-based CDN using React, IPFS, Smart Contracts & Dockerized Edge Nodes

This project is a decentralized content delivery network (CDN) built on the Ethereum blockchain. It allows users to upload and purchase videos via smart contracts, store video files on IPFS, and distribute them through Dockerized edge nodes that simulate caching and content delivery.

---

## 🧰 Tech Stack

### 🎨 Frontend
- React.js (Vite)
- Plyr (Video Player)
- ethers.js
- MetaMask

### 💡 Backend
- Node.js + Express.js
- IPFS (via Pinata)
- Docker (for edge node simulation)

### 🛠️ Blockchain
- Solidity (Smart Contracts)
- Hardhat (for development and local blockchain)
- ethers.js (Frontend interaction)

---

## ✨ Features

- ✅ Upload videos to IPFS
- ✅ Store video metadata on the blockchain
- ✅ Buy videos with crypto (ETH)
- ✅ Play purchased videos
- ✅ Register as an edge node
- ✅ Claim earnings as edge node
- ✅ Dockerized edge node server (caching simulation)
- ❌ No WebSockets (planned)
- 📶 5G integration is **planned** for later stages

---

## 📁 Project Structure

```
├── artifacts/                      # Auto-generated artifacts after compiling contracts (by Hardhat)
├── backend/                        # Backend services
│   ├── cache/                      # Local cache for video caching
│   ├── src/                        # Contract ABI and other sources
│   ├── .env                        # Environment variables for backend config (e.g., ports, IPFS keys)
│   ├── compose.yaml                # Docker Compose file for edge nodes
│   ├── Dockerfile                  # Dockerfile to containerize the edge node
│   ├── edgeNode.js                 # Edge node server that caches and serves video content
│   └── server.js                   # WebSocket server (Express)
├── cache/                          # Hardhat's compilation cache
├── contracts/
│   └── VideoCDN.sol                # Smart contract for video purchases, edge node registration, etc.
├── frontend/                       # Frontend client (React + Vite)
│   ├── src/
│   │   ├── assets/                 # Static assets like edgenodeMapping, etc                
│   │   ├── config.js               # IPFS, blockchain, or API configuration constants
│   │   ├── main.jsx                # React entry point
│   │   └── VideoPlayer.jsx         # Video player component with playback and routing logic
│   └── .env                        # Environment variables for Vite frontend (e.g., Contract Address, API, Secrets, etc)
├── scripts/
│   ├── deploy.js                   # Script to deploy smart contracts to Hardhat local blockchain
│   └── uploadVideo.js              # Script to upload videos to blockchain
├── test/                           # Smart contract test cases to verify functions of smart contract
├── hardhat.config.js               # Hardhat configuration file
└── README.md                       
```






---


## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Devrikh/Blockchain-Based-5G-CDN.git
cd blockchain-cdn
```

### 2. Install Dependencies
- Root-level (if needed):

```bash
npm install
```

- Frontend:

```bash
cd frontend
npm install
```

- Backend:

```bash
cd ..
cd backend
npm install
cd ..
```

---

## ⚙️ Setup Instructions

### 🧪 Start Hardhat Local Blockchain

```bash
npx hardhat node
```

### 🧾 Deploy the Smart Contract

```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 🖥️ Start Backend Server

```bash
node backend/server.js
```

### 🌐 Start Edge Node Server

```bash
node backend/edgeNode.js
```

### 🎨 Start Frontend

```bash
cd frontend
npm run dev
```

---


## 📦 IPFS via Pinata

#### Get API Keys from Pinata

### Create `.env` in `frontend/`

```env
VITE_CONTRACT_ADDRESS=your_contract_address
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_API_KEY=your_pinata_secret_key
```

- Restart Vite react server after saving.


---


## 🐳 Dockerizing Edge Nodes

### Get API Keys from Pinata

### Create `.env` in `frontend/`

```env
VITE_CONTRACT_ADDRESS=your_contract_address
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_API_KEY=your_pinata_secret_key
```



---









