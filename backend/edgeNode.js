const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { ethers } = require("ethers");
const os = require("os");
const fs = require("fs");
const path = require("path");
const NodeCache = require("node-cache");
require("dotenv").config();

const app = express();
app.use(cors());

const PORT = 5000;
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";
const CACHE_DIR = path.join(__dirname, "cache");

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR);
}

const provider = new ethers.JsonRpcProvider(process.env.JSONPROVIDERURI);
const contractAddress = process.env.CONTRACTADDRESS;
const contractABI = require("./src/VideoCDN.json");

// In-memory cache for video chunks (short TTL)
const videoChunkCache = new NodeCache({ stdTTL: 600 }); // Cache chunks for 10 minutes

// Register Edge Node (only on-chain)
async function registerEdgeNode(walletPrivateKey) {
  const signer = new ethers.Wallet(walletPrivateKey, provider);
  const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);

  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (let iface in interfaces) {
    for (let i = 0; i < interfaces[iface].length; i++) {
      const addr = interfaces[iface][i];
      if (addr.family === "IPv4" && !addr.internal) {
        addresses.push(addr.address);
      }
    }
  }

  const myIP = addresses[0];

  try {
    const tx = await contract.registerEdgeNode();
    await tx.wait();
    console.log("✅ Edge Node registered on-chain with wallet:", walletPrivateKey);
    console.log("🟢 Node IP:", myIP);
  } catch (error) {
    console.error("❌ Error registering edge node:", error.message || error);
  }
}

// Serve Video from Disk Cache or IPFS
app.get("/video/:cid", async (req, res) => {
  const { cid } = req.params;
  const cachedFilePath = path.join(CACHE_DIR, cid + ".mp4");

  try {
    if (!fs.existsSync(cachedFilePath)) {
      console.log(`🌐 Downloading ${cid} from IPFS via Pinata Gateway...`);

      const response = await axios.get(`${PINATA_GATEWAY}/${cid}`, {
        responseType: "stream",
      });

      const writer = fs.createWriteStream(cachedFilePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      console.log(`💾 Cached full video ${cid} to disk`);
    }

    await fetchAndServeChunks(cid, req, res);
  } catch (error) {
    console.error("❌ Error fetching video:", error.message || error);
    res.status(500).json({ error: "Failed to retrieve video" });
  }
});

// Serve video chunk from memory or disk
async function fetchAndServeChunks(cid, req, res) {
  const range = req.headers.range;
  const cachedFilePath = path.join(CACHE_DIR, cid + ".mp4");

  if (!range) {
    return res.status(400).json({ error: "Range header is required" });
  }

  const stat = fs.statSync(cachedFilePath);
  const fileSize = stat.size;
  const parts = range.replace(/bytes=/, "").split("-");
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
  const chunkSize = end - start + 1;
  const chunkKey = `${cid}_${start}-${end}`;

  // If the chunk is in memory cache, serve it
  if (videoChunkCache.has(chunkKey)) {
    console.log(`⚡ Serving chunk ${chunkKey} from memory cache`);
    const chunk = videoChunkCache.get(chunkKey);
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunk.length,
      "Content-Type": "video/mp4",
    });
    return res.end(chunk);
  }

  // Read the chunk from disk if not in memory
  const buffer = Buffer.alloc(chunkSize);
  const fd = fs.openSync(cachedFilePath, "r");
  fs.readSync(fd, buffer, 0, chunkSize, start);
  fs.closeSync(fd);

  // Cache the chunk in memory
  videoChunkCache.set(chunkKey, buffer);
  console.log(`🧠 Cached chunk ${chunkKey} in memory`);

  res.writeHead(206, {
    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": chunkSize,
    "Content-Type": "video/mp4",
  });

  res.end(buffer);

  // Check if all chunks are fetched, and if so, cache the full video to disk (optional)
  const totalChunks = Math.ceil(fileSize / chunkSize);
  const fetchedChunks = Object.keys(videoChunkCache.keys())
    .filter((key) => key.startsWith(cid))
    .length;

  if (fetchedChunks === totalChunks) {
    const fullVideo = Buffer.concat(
      Array.from({ length: totalChunks }).map((_, i) =>
        videoChunkCache.get(`${cid}_${i * chunkSize}-${(i + 1) * chunkSize - 1}`)
      )
    );

    fs.writeFileSync(cachedFilePath, fullVideo);
    console.log(`💾 Full video for ${cid} saved to disk`);
  }
}

// Start Server + Register Node
app.listen(PORT, async () => {
  console.log(`🚀 Edge Node Running on Port ${PORT}`);

  const walletPrivateKey = process.env.DOCKER_WALLET_PRIVATE_KEY_ONE;
  if (!walletPrivateKey) {
    console.error("❌ No wallet private key set in environment variables");
    process.exit(1);
  }

  await registerEdgeNode(walletPrivateKey);
});
