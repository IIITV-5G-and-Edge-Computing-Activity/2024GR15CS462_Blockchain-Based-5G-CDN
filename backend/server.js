require("dotenv").config();
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();

// 🔓 Enable CORS for your frontend (Vite dev server)
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
let clients = new Set();

// Blockchain Setup
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const contractABI = require("../artifacts/contracts/VideoCDN.sol/VideoCDN.json");
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const contract = new ethers.Contract(contractAddress, contractABI.abi, provider);

// Track Edge Nodes
const EDGE_NODES = new Set();

// WebSocket Handling
wss.on("connection", (ws) => {
  console.log("🔗 New WebSocket connection");
  clients.add(ws);

  ws.on("close", () => {
    console.log("❌ WebSocket disconnected");
    clients.delete(ws);
  });
});

const broadcast = (data) => {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// Contract Events
contract.on("VideoUploaded", (owner, ipfsHash, price) => {
  console.log("🎥 Video Uploaded:", ipfsHash);
  broadcast({ type: "VIDEO_UPLOADED", owner, ipfsHash, price: ethers.formatEther(price) });
});

contract.on("VideoPurchased", (buyer, videoId) => {
  console.log("🛒 Video Purchased:", videoId);
  broadcast({ type: "VIDEO_PURCHASED", buyer, videoId });
});

contract.on("EdgeNodeRegistered", (node) => {
  console.log("📡 New Edge Node Registered on-chain:", node);
  broadcast({ type: "EDGE_NODE_REGISTERED", node });
});

// Edge Node IP Registration (manual)
app.post("/register-edge", (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: "IP required" });
  EDGE_NODES.add(ip);
  console.log("🌐 Edge node IP added:", ip);
  res.json({ status: "ok" });
});

// Return Edge Node for CID
app.get("/edge-node/:cid", (req, res) => {
  const { cid } = req.params;

  if (EDGE_NODES.size === 0) {
    return res.status(503).json({ error: "No edge nodes available" });
  }

  const nodes = Array.from(EDGE_NODES);
  const selectedNode = nodes[Math.floor(Math.random() * nodes.length)];
  res.json({ edgeNodeUrl: `http://${selectedNode}:5000/video/${cid}` });
});

// Start Server
const PORT = 3000;
server.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
