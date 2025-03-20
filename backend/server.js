require("dotenv").config();
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { ethers } = require("ethers");

// Express + HTTP Server
const app = express();
const server = http.createServer(app);

// WebSocket Server
const wss = new WebSocket.Server({ server });
let clients = new Set();

// Blockchain Setup
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const contractABI = require("../artifacts/contracts/VideoCDN.sol/VideoCDN.json"); // Place contract ABI in backend
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545"); // Hardhat/Polygon RPC
const contract = new ethers.Contract(contractAddress, contractABI.abi, provider);

// WebSocket Connection Handling
wss.on("connection", (ws) => {
  console.log("🔗 New WebSocket connection");
  clients.add(ws);

  ws.on("close", () => {
    console.log("❌ WebSocket disconnected");
    clients.delete(ws);
  });
});

// Broadcast function
const broadcast = (data) => {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// 📡 Listen to Smart Contract Events
contract.on("VideoUploaded", (owner, ipfsHash, price) => {
  console.log("🎥 Video Uploaded:", ipfsHash);
  broadcast({ type: "VIDEO_UPLOADED", owner, ipfsHash, price: ethers.formatEther(price) });
});

contract.on("VideoPurchased", (buyer, videoId) => {
  console.log("🛒 Video Purchased:", videoId);
  broadcast({ type: "VIDEO_PURCHASED", buyer, videoId });
});

contract.on("EdgeNodeRegistered", (node) => {
  console.log("📡 New Edge Node Registered:", node);
  broadcast({ type: "EDGE_NODE_REGISTERED", node });
});

// Start Express Server
const PORT = 5000;
server.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
