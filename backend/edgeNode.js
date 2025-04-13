const express = require("express");
const cors = require("cors");
const axios = require("axios");
const NodeCache = require("node-cache");
const os = require("os");
const { ethers } = require("ethers");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";
const BACKEND_SERVER = "http://localhost:3000"; 

const videoCache = new NodeCache({ stdTTL: 7200, checkperiod: 3600 });

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const contractABI = require("../artifacts/contracts/VideoCDN.sol/VideoCDN.json");

async function registerEdgeNode() {
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  console.log(`Using signer address: ${address}`);

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
    const tx = await contract.registerEdgeNode(); // On-chain registration
    await tx.wait();
    console.log(" Edge Node registered on-chain");
  } catch (error) {
    const isAlreadyRegistered =
      error.reason === "Already registered" ||
      (error.errorName === "Error" && error.errorArgs?.[0] === "Already registered");

    if (isAlreadyRegistered) {
      console.warn(" Edge Node already registered on-chain, continuing...");
    } else {
      console.error(" Registration failed:", error.message || error);
      return;
    }
  }

  try {
    await axios.post(`${BACKEND_SERVER}/register-edge`, { ip: myIP });
    console.log(" Edge Node Registered with backend:", myIP);
  } catch (backendError) {
    console.error(" Backend registration failed:", backendError.message || backendError);
  }
}

// Serve Video from Cache or IPFS
app.get("/video/:cid", async (req, res) => {
  const { cid } = req.params;

  if (videoCache.has(cid)) {
    console.log(` Serving ${cid} from cache`);
    return res.send(videoCache.get(cid));
  }

  try {
    console.log(` Fetching ${cid} from IPFS gateway...`);
    const response = await axios.get(`${PINATA_GATEWAY}/${cid}`, { responseType: "arraybuffer" });
    videoCache.set(cid, response.data);
    res.send(response.data);
  } catch (error) {
    console.error(" Error fetching video:", error.message || error);
    res.status(500).json({ error: "Failed to retrieve video" });
  }
});


app.listen(PORT, async () => {
  console.log(` Edge Node Running on Port ${PORT}`);
  await registerEdgeNode();
});
