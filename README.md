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
- Root-level:

```bash
npm install
```

- Frontend:

```bash
cd frontend
npm install
cd ..
```

- Backend:

```bash
cd backend
npm install
cd ..
```

---

## ⚙️ Setup Instructions

### 🧪 Start Hardhat Local Blockchain

```bash
npx hardhat node --hostname 0.0.0.0
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
> ⚠️ Note: This will start a single edge node server locally for testing purposes.
If you want to simulate multiple edge nodes, skip this step and follow the instructions in the [🐳 Dockerizing Edge Nodes](https://github.com/Devrikh/Blockchain-Based-5G-CDN/edit/dev/README.md#-dockerizing-edge-nodes) section.

### 🎨 Start Frontend

```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

---


## 📦 IPFS via Pinata

- Get API Keys from [Pinata](https://pinata.cloud/).

### Create `.env` in in both `frontend/` and `backend/` directories.

```env

VITE_CONTRACT_ADDRESS=your_contract_address
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_API_KEY=your_pinata_secret_key
```

```env
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
DOCKER_WALLET_ONE=your_private_key_for_edge_node_1
DOCKER_WALLET_TWO=your_private_key_for_edge_node_2
DOCKER_WALLET_THREE=your_private_key_for_edge_node_3

```

- Restart `React` and `edgeNode.js` server after saving.


---


## 🐳 Dockerizing Edge Nodes

### 📁 Set Up `.env` File for Wallets
- Inside the `backend/` directory, make sure a file named `.env` exists:

### 🛠️ Build Docker Containers
- From inside the `backend/` directory:
```bash
docker-compose build
```
- This will use the `Dockerfile` to build images for each edge node.

### 🚀 Start Edge Nodes

- To start all edge node containers and see their output:

```bash
docker-compose up 
```

- To run in detached/background mode:

```bash
docker-compose upm -d
```

### 🔍 Monitor Logs

- To see logs for all services:

```bash
docker-compose logs -f
```

- To see logs for a specific edge node (e.g. edge_node_2):

```
docker-compose logs -f edge_node_2
```


### 🛑 Shut Down Edge Nodes 

- If you are done with simulation, run:
```bash
docker-compose down
```
- This stops and removes containers (but not images or volumes).








---









