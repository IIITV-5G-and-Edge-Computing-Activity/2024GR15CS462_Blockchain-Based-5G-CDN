import { useState, useEffect } from "react";
import {ethers } from "ethers";
import VideoPlayer from "./VideoPlayer";
import VideoCDN from "../../artifacts/contracts/VideoCDN.sol/VideoCDN.json";
import "./App.css";
import config from "./config";

import { motion } from "framer-motion";
import { Md5G } from "react-icons/md";
import {
  RiHome5Line,
  RiVideoLine,
  RiTrophyLine,
  RiBookmarkLine,
  RiSearchLine,
  RiPlayFill,
  RiHeartLine,
  RiAddLine,
  RiFilterLine,
  RiCloseLine
} from "react-icons/ri";
import { SiHiveBlockchain, SiPolygon } from "react-icons/si";

const contractAddress = config.CONTRACT_ADDRESS;

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [newVideo, setNewVideo] = useState({
    title: "",
    subtitle: "",
    date: "",
    genres: "",
    image: "",
    trailer: "",
    file: null,  // Files should start as null
    price: "",
  });
  
  const [edgeNode, setEdgeNode] = useState(false);
  const [earnings, setEarnings] = useState("0");
  const [edgeNodes, setEdgeNodes] = useState([]);
  const [selectedEdgeNode, setSelectedEdgeNode] = useState("");
  const [uploadPopup, setUploadPopup] = useState(false);
  

  

  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState({
    title: "Default Movie",
    subtitle: "Uploaded by Unknown",
    date: "N/A",
    genres: ["N/A"],
    image: "https://brandingforthepeople.com/wp-content/uploads/2019/04/Stock-Photography-vs-Real-Imagery.jpg",
    trailer: "",
  });
  const [earningsPopup, setEarningsPopup] = useState(false);
  const [edgeNodeDropdown, setEdgeNodeDropdown] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showAccount, setShowAccount] = useState(false);





  


  useEffect(() => {
    if (account) {
      loadBlockchainData();
    }
  }, [account]);

  useEffect(() => {
    if (movies.length > 0) {
      setSelectedMovie(movies[0]); // Set the first movie as default
    }
  }, [movies]);

  
  

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
      console.error(" Error loading blockchain data:", error);
    }
  };

  const loadVideos = async (contractInstance) => {
    try {
      const videosArray = await contractInstance.getVideos();
  
      const loadedVideos = await Promise.all(
        videosArray.map(async (video, index) => {
          return {
            id: index+1, // Change from index + 1 to index
            title: video.title || `Video ${index + 1}`,
            subtitle: video.subtitle || `Uploaded by ${video.owner.substring(0, 6)}...`,
            date: video.date || new Date().toLocaleDateString(),
            genres: video.genres.length > 0 ? video.genres : ["Blockchain", "Decentralized"],
            image: video.image || "https://via.placeholder.com/800x400",
            trailer: video.trailer || "",
            ipfsHash: video.ipfsHash, // Keeping the hash but not fetching from IPFS
            price: ethers.formatEther(video.price),
            purchased: await checkVideoAccess(contractInstance, index+1),
          };
        })
      );
  
      console.log(" Updated Movies List:", loadedVideos);
  
      setMovies(loadedVideos); //    Ensures no duplicate movies
    } catch (error) {
      console.error(" Error fetching videos:", error);
    }
  };
  
  
  

  const checkVideoAccess = async (contractInstance, videoId) => {
    if (!contractInstance || !account) return false;
    try {
      const access = await contractInstance.hasAccess(account, videoId);
      console.log(` Video ${videoId} access:`, access);
      return access;
    } catch (error) {
      console.error(` Error checking video access for Video ${videoId}:`, error);
      return false;
    }
  };
  
  const uploadVideo = async (event) => {
  event.preventDefault();

  const { title, subtitle, date, genres, image, trailer, file, price } = newVideo;

  if (!title || !subtitle || !date || !genres || !image || !trailer || !file || !price) {
    alert(" Please fill out all fields!");
    return;
  }

  try {
    // 1️ Upload video file to IPFS
    const formData = new FormData();
    formData.append("file", file);

    const videoResponse = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: config.PINATA_API_KEY,
        pinata_secret_api_key: config.PINATA_SECRET_KEY,
      },
      body: formData,
    });

    const videoData = await videoResponse.json();
    const videoIpfsHash = videoData.IpfsHash;
    console.log(" Video uploaded to IPFS:", videoIpfsHash);

    //  Store all metadata directly on-chain
    const priceInWei = ethers.parseUnits(price.trim(), "ether");
    const genreArray = genres.map((g) => g.trim());

    const tx = await contract.uploadVideo(
      title,
      subtitle,
      date,
      genreArray,
      image,
      videoIpfsHash,  // Store only video hash
      priceInWei,
      trailer
    );

    await tx.wait();
    console.log(" Video metadata stored on-chain!");

    //  Refresh the UI
    await loadVideos(contract);

    setNewVideo({
      title: "",
      subtitle: "",
      date: "",
      genres: "",
      image: "",
      trailer: "",
      file: null,
      price: "",
    });

    setUploadPopup(false);
  } catch (error) {
    console.error(" Upload failed:", error);
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
      alert(" Please select an Edge Node!");
      return;
    }
    if (!selectedMovie || !selectedMovie.price) {
      alert(" No video selected or video price missing!");
      return;
    }
  

    try {
      // const video = videos.find((v) => v.id === videoId);
      // console.log(videos);
      console.log("Purchasing Video:", selectedMovie);
    const tx = await contract.buyVideo(selectedMovie.id, selectedEdgeNode, {
      value: ethers.parseEther(selectedMovie.price),
      });
      await tx.wait();
      alert("Purchase successful!");
      // setSelectedMovie((prev) => ({ ...prev, purchased: true }));
      await loadVideos(contract); // Refresh videos list

      //  Fetch updated edge node earnings
      await checkEdgeNodeStatus(
        contract,
        await new ethers.BrowserProvider(window.ethereum).getSigner()
      );
    } catch (error) {
      console.error(" Purchase failed:", error);
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
      console.error(" Error checking edge node status:", error);
    }
  };

  const claimEarnings = async () => {
    try {
      console.log(" Claiming earnings...");
      const tx = await contract.withdrawEarnings();
      await tx.wait();
      console.log(" Earnings claimed!");

      alert("Earnings claimed!");

      //  Refresh Edge Node Status to update earnings
      await checkEdgeNodeStatus(
        contract,
        await new ethers.BrowserProvider(window.ethereum).getSigner()
      );
    } catch (error) {
      console.error(" Claim earnings failed:", error);
    }
  };





  

  // title: "The Gorge",
  // subtitle: "A thrilling action-packed adventure",
  // date: "October 12, 2024",
  // genres: Action, Scifi,
  // image:
  //   "https://m.media-amazon.com/images/M/MV5BOTQ5Y2QyYTktYmFmZi00NWJlLWE0MzgtYTA4M2I0ZjQwZjcxXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg"
  // https://www.youtube.com/watch?v=rUSdnuOLebE





  // {
  //   title: "The Joker",
  //   subtitle: "Put on a happy face (2019)",
  //   date: "October 4, 2019",
  //   genres: Crime, Drama,
  //   image:
  //     "https://m.media-amazon.com/images/M/MV5BNzY3OWQ5NDktNWQ2OC00ZjdlLThkMmItMDhhNDk3NTFiZGU4XkEyXkFqcGc@._V1_.jpg",
  // https://www.youtube.com/watch?v=zAGVQLHvwOY
  // },



  // The Beginning After the End
  // Episode 1
  // https://m.media-amazon.com/images/I/71W0OAilxgL._AC_UF1000,1000_QL80_.jpg
  // Isekei, Fantasy
  // Every Thursday
  // 







  return (
    <div className="app">
      




      <div className="welcome-page">
  {account ? (
    showAccount ? (
      <p className="acc-connect" onClick={() => setShowAccount(false)}>Connected as: {account}</p>
    ) : null
  ) : (<>
  <img src="https://images.unsplash.com/photo-1597733336794-12d05021d510?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHRlY2h8ZW58MHx8MHx8fDA%3D" alt="" />
    <div className="welcome-content">
    <h1>Blockchain 5G CDN</h1>
    <button onClick={connectWallet}>Connect Wallet</button>
    </div>
    </>
  )}
</div>



















      {account && (
        <>




{/* Background Image */}
<div className="background">
        <img src={selectedMovie.image} alt={selectedMovie.title} />
        <div className="gradient-overlay"></div>
      </div>

      {/* Sidebar */}
      <aside className="sidebar">
      <div className="logo" onClick={() => setShowAccount(!showAccount)}>
      <SiHiveBlockchain />
</div>

        <div className="sidebar-icon" onClick={() => {
  loadVideos(contract); // Reload the movies list
}}>
          <RiHome5Line size={24} />
        </div>
        <div className="sidebar-icon" onClick={() => {
    setUploadPopup(true);
    setEarningsPopup(false); 
  }}>
          <RiVideoLine size={24} />
        </div>
        <div className="sidebar-icon" onClick={() => {
    setEarningsPopup(true);
    setUploadPopup(false); 
  }}>
  <RiTrophyLine size={24} />
</div>

        <div className="sidebar-icon">
          <RiBookmarkLine size={24} />
        </div>
      </aside>







      <main className="main">
        {/* Video Player Overlay */}


{showPlayer && (
  <div className="video-player-overlay">
    <button className="close-btn" onClick={() => setShowPlayer(false)}><RiCloseLine size={30} /></button>
    <p>{selectedMovie.title}</p>
    <VideoPlayer ipfsHash={selectedMovie.ipfsHash} edgeNode={selectedEdgeNode} />
  </div>
)}


        {/* Search Bar */}
        <div className="search-container">
          <RiSearchLine className="search-icon" />
          <input
            type="text"
            placeholder="Search for Movie"
            className="search-input"
          />
          <RiFilterLine className="filter-icon" />
        </div>











        {uploadPopup && (
  <div className="upload-popup">
    <div className="popup-content-1">
      <div className="headline">
      <button className="close-btn" onClick={() => setUploadPopup(false)}>
        <RiCloseLine size={30} />
      </button>
      <h2>Upload a Video</h2>
      </div>
      

      <input
        type="text"
        placeholder="Video Title"
        value={newVideo.title}
        onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
      />

      <input
        type="text"
        placeholder="Subtitle"
        value={newVideo.subtitle}
        onChange={(e) => setNewVideo({ ...newVideo, subtitle: e.target.value })}
      />

      <input
        type="text"
        placeholder="Release Date"
        value={newVideo.date}
        onChange={(e) => setNewVideo({ ...newVideo, date: e.target.value })}
      />

      <input
        type="text"
        placeholder="Genres (comma-separated)"
        value={newVideo.genres}
        onChange={(e) =>
          setNewVideo({ ...newVideo, genres: e.target.value.split(",") })
        }
      />

      <input
        type="text"
        placeholder="Movie Poster URL"
        value={newVideo.image}
        onChange={(e) => setNewVideo({ ...newVideo, image: e.target.value })}
      />

      <input
        type="text"
        placeholder="Trailer URL"
        value={newVideo.trailer}
        onChange={(e) => setNewVideo({ ...newVideo, trailer: e.target.value })}
      />

      <input
        type="file"
        accept="video/*"
        onChange={(e) => setNewVideo({ ...newVideo, file: e.target.files[0] })}
      />

      <input
        type="text"
        placeholder="Price in MATIC"
        value={newVideo.price}
        onChange={(e) => setNewVideo({ ...newVideo, price: e.target.value })}
      />

      <button className="upload-btn" onClick={uploadVideo}>
        Upload
      </button>
    </div>
  </div>
)}



{earningsPopup && (
  <div className="upload-popup">
    <div className="popup-content-2">
    <div className="headline"> <button className="close-btn" onClick={() => setEarningsPopup(false)}>
        <RiCloseLine size={24} />
      </button>
      <h2>Edge Node Earnings</h2>
       </div>      

      {edgeNode ? (
        <>
          <p>Current Ballance: {earnings} <SiPolygon /></p>
          <button className="upload-btn" onClick={claimEarnings}>
            Claim Earnings
          </button>
        </>
      ) : (
        <>
          <p>You are not registered as an Edge Node.</p>
          <button className="upload-btn" onClick={registerEdgeNode}>
            Register as Edge Node
          </button>
        </>
      )}
    </div>
  </div>
)}









        {/* Content */}
        <div className="content">
          <div className="movie-info">
            <span>{selectedMovie.date}</span>
            <span>•</span>
            <span>{selectedMovie.genres?.join(", ")}</span>
          </div>
          <h1 className="movie-title">{selectedMovie.title}</h1>
          <p className="movie-subtitle">{selectedMovie.subtitle}</p>



         {/* Buy Now & Play Button */}
<div className="buttons">
  {selectedMovie.purchased ? (
    <button className="btn primary" onClick={() => {
      if (!selectedEdgeNode) {
        alert("Please select an Edge Node!");
        return;
      }
      setShowPlayer(true);
    }}>
      ▶ Play
    </button>
  ) : (
    <button
      className="btn primary"
      onClick={() => buyVideo(selectedMovie.id)}
      disabled={selectedMovie.purchased}
    >
      {selectedMovie.purchased ? "Purchased" : "Buy Now"}
    </button>
  )}

  {/* Show Select Edge Node only if the video is not purchased */}
  { (
    <div className="dropdown-container">
      <button className="btn secondary" onClick={() => setEdgeNodeDropdown(!edgeNodeDropdown)}>
      <Md5G className='edge-btn' size={35}/><p>{selectedEdgeNode ? `${selectedEdgeNode.substring(0, 10).toUpperCase()}` : "Edge Node"}</p>
      </button>
      {edgeNodeDropdown && (
        <div className="dropdown">
          {edgeNodes.length > 0 ? (
            edgeNodes.map((node, index) => (
              <div
                key={index}
                className={`dropdown-item ${selectedEdgeNode === node ? "selected" : ""}`}
                onClick={() => {
                  setSelectedEdgeNode(node);
                  setEdgeNodeDropdown(false);
                }}
              >
                {node.substring(0, 10).toUpperCase()}
              </div>
            ))
          ) : (
            <div className="dropdown-item">No Edge Nodes Available</div>
          )}
        </div>
      )}
    </div>
  )}
</div>





          {/* Movie Slider */}
          <div className="movie-slider">
            <div className="movie-list">
              {movies.map((movie, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    scale: selectedMovie.title === movie.title ? 1.1 : 1,
                    filter:
                      selectedMovie.title === movie.title
                        ? "brightness(1) blur(0px)"
                        : "brightness(0.5) blur(2px)",
                  }}
                  transition={{ delay: index * 0.1, duration: 0.2 }}
                  className="movie-thumbnail"
                  onClick={() => setSelectedMovie(movie)}
                >
                  <img src={movie.image} alt={movie.title} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="circle-btn">
            <RiHeartLine size={24} />
          </button>
          <button className="circle-btn">
            <RiAddLine size={24} />
          </button>
        </div>
      </main>
























          
        </>
      )}
    </div>
  );
}

export default App;
