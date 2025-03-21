import { useState, useEffect } from "react";
import { ethers } from "ethers";
import VideoPlayer from "./VideoPlayer";
import VideoCDN from "../../artifacts/contracts/VideoCDN.sol/VideoCDN.json";
import "./App.css";
import config from "./config";



const contractAddress = config.CONTRACT_ADDRESS;

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [videos, setVideos] = useState([]);
  const [newVideo, setNewVideo] = useState({ file: null, price: "" });
  const [edgeNode, setEdgeNode] = useState(false);
  const [earnings, setEarnings] = useState("0");
  const [edgeNodes, setEdgeNodes] = useState([]);
  const [selectedEdgeNode, setSelectedEdgeNode] = useState("");

  useEffect(() => {
    if (account) {
      loadBlockchainData();
    }
  }, [account]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected!");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      setAccount(userAddress);

      loadBlockchainData(signer);
    } catch (error) {
      console.error("❌ Wallet connection failed:", error);
    }
  };

  const loadBlockchainData = async (signer) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      signer = signer || (await provider.getSigner());
      const contractInstance = new ethers.Contract(
        contractAddress,
        VideoCDN.abi,
        signer
      );
      setContract(contractInstance);

      await loadVideos(contractInstance);
      await checkEdgeNodeStatus(contractInstance, signer);
      await fetchEdgeNodes(contractInstance);
    } catch (error) {
      console.error("❌ Error loading blockchain data:", error);
    }
  };

  const loadVideos = async (contractInstance) => {
    try {
      const videosArray = await contractInstance.getVideos();
      const loadedVideos = await Promise.all(
        videosArray.map(async (video, index) => ({
          id: index + 1,
          owner: video.owner,
          price: ethers.formatEther(video.price),
          ipfsHash: video.ipfsHash,
          purchased: await checkVideoAccess(contractInstance, index + 1),
        }))
      );

      setVideos(loadedVideos);
    } catch (error) {
      console.error("❌ Error fetching videos:", error);
    }
  };

  const checkVideoAccess = async (contractInstance, videoId) => {
    if (!contractInstance || !account) return false;
    try {
      return await contractInstance.hasAccess(account, videoId);
    } catch (error) {
      console.error(
        `❌ Error checking video access for Video ${videoId}:`,
        error
      );
      return false;
    }
  };

  const uploadVideo = async (event) => {
    event.preventDefault();

    if (!newVideo.file || !newVideo.price) {
      alert("⚠️ Please select a file and enter a price!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", newVideo.file);

      // Upload to IPFS via Pinata
      const response = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        {
          method: "POST",
          headers: {
            pinata_api_key: config.PINATA_API_KEY,
            pinata_secret_api_key:
             config.PINATA_SECRET_KEY,
          },
          body: formData,
        }
      );

      const data = await response.json();
      const ipfsHash = data.IpfsHash;
      console.log("✅ Uploaded to IPFS:", ipfsHash);
      const priceStr = newVideo.price.trim();

      if (!ipfsHash || !priceStr || isNaN(priceStr) || Number(priceStr) <= 0) {
        alert("⚠️ Please enter a valid IPFS Hash and positive Price!");
        return;
      }

      console.log("Uploading Video:", { ipfsHash, priceStr }); // Debugging log
      const priceInWei = ethers.parseUnits(priceStr, "ether");
      const tx = await contract.uploadVideo(ipfsHash, priceInWei);
      await tx.wait();
      console.log("Uploaded :)   ->", { ipfsHash, priceStr });
      setNewVideo({ ipfsHash: "", price: "" });
      await loadVideos(contract);
    } catch (error) {
      console.error("❌ Upload failed:", error);
    }
  };

  const fetchEdgeNodes = async (contractInstance) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum); // Get provider
      const blockNumber = await provider.getBlockNumber(); // Fetch latest block number

      const filter = contractInstance.filters.EdgeNodeRegistered();
      const events = await contractInstance.queryFilter(filter, 0, blockNumber);

      const allNodes = events.map((event) => event.args.node);
      setEdgeNodes([...new Set(allNodes)]); // Remove duplicates
    } catch (error) {
      console.error("❌ Error fetching edge nodes:", error);
    }
  };

  const buyVideo = async (videoId) => {
    if (!selectedEdgeNode) {
      alert("⚠️ Please select an Edge Node!");
      return;
    }

    try {
      const video = videos.find((v) => v.id === videoId);
      const tx = await contract.buyVideo(videoId, selectedEdgeNode, {
        value: ethers.parseEther(video.price),
      });
      await tx.wait();
      alert("Purchase successful!");

      await loadVideos(contract); // Refresh videos list

      // 🔄 Fetch updated edge node earnings
      await checkEdgeNodeStatus(
        contract,
        await new ethers.BrowserProvider(window.ethereum).getSigner()
      );
    } catch (error) {
      console.error("❌ Purchase failed:", error);
    }
  };

  const registerEdgeNode = async () => {
    try {
      console.log("📡 Registering as Edge Node...");
      const tx = await contract.registerEdgeNode();
      await tx.wait();
      console.log("✅ Registered as Edge Node!");

      alert("You are now an edge node!");
      setEdgeNode(true);

      // 🔄 Fetch edge nodes immediately after registration
      await fetchEdgeNodes(contract);
    } catch (error) {
      console.error("❌ Edge Node Registration failed:", error);
    }
  };

  const checkEdgeNodeStatus = async (contract, signer) => {
    try {
      const address = await signer.getAddress();
      const node = await contract.edgeNodes(address);

      if (node.isRegistered) {
        setEdgeNode(true);
        setEarnings(ethers.formatEther(node.earnings));
      }
    } catch (error) {
      console.error("❌ Error checking edge node status:", error);
    }
  };

  const claimEarnings = async () => {
    try {
      console.log("💸 Claiming earnings...");
      const tx = await contract.withdrawEarnings();
      await tx.wait();
      console.log("✅ Earnings claimed!");

      alert("Earnings claimed!");

      // 🔄 Refresh Edge Node Status to update earnings
      await checkEdgeNodeStatus(
        contract,
        await new ethers.BrowserProvider(window.ethereum).getSigner()
      );
    } catch (error) {
      console.error("❌ Claim earnings failed:", error);
    }
  };

  return (
    <div className="app">
      <header className="navbar">
        <h1>Blockchain 5G CDN</h1>
        {account ? (
          <p>Connected as: {account}</p>
        ) : (
          <button onClick={connectWallet}>Connect Wallet</button>
        )}
      </header>

      {account && (
        <>
          <h2>Upload Video</h2>
          <input
            type="file"
            accept="video/*"
            onChange={(e) =>
              setNewVideo({ ...newVideo, file: e.target.files[0] })
            }
          />
          <input
            type="text"
            placeholder="Price in MATIC"
            value={newVideo.price}
            onChange={(e) =>
              setNewVideo({ ...newVideo, price: e.target.value })
            }
          />
          <button onClick={uploadVideo}>Upload</button>

          <button onClick={registerEdgeNode} disabled={edgeNode}>
            Register as Edge Node
          </button>
          {edgeNode && (
            <button onClick={claimEarnings}>
              Claim Earnings: {earnings} MATIC
            </button>
          )}

          <h2>Available Videos</h2>
          {videos.map((video) => (
            <div key={video.id}>
              <p>Owner: {video.owner}</p>
              <p>Price: {video.price} MATIC</p>
              {video.purchased ? (
                <VideoPlayer ipfsHash={video.ipfsHash} />
              ) : (
                <>
                  <label>Select Edge Node:</label>
                  <select
                    value={selectedEdgeNode}
                    onChange={(e) => setSelectedEdgeNode(e.target.value)}
                  >
                    <option value="">-- Choose Edge Node --</option>
                    {edgeNodes.map((node) => (
                      <option key={node} value={node}>
                        {node}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => buyVideo(video.id)}>Buy</button>
                </>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default App;