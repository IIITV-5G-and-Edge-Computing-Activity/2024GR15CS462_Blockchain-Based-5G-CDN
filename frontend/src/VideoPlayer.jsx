import React, { useEffect, useState } from 'react';
import Plyr from 'plyr-react';
import 'plyr-react/plyr.css';
import axios from 'axios';
import "./VideoPlayer.css";

const VideoPlayer = ({ ipfsHash }) => {
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    const fetchEdgeNode = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/edge-node/${ipfsHash}`);
        setVideoUrl(res.data.edgeNodeUrl);
      } catch (err) {
        console.error(" Could not fetch edge node. Falling back to IPFS.io");
        setVideoUrl(`https://ipfs.io/ipfs/${ipfsHash}`);
      }
    };

    fetchEdgeNode();
  }, [ipfsHash]);

  return (
    <div className='container'>
      <div className="custom-player">
    {videoUrl && (
      <Plyr
        source={{
          type: 'video',
          sources: [{ src: videoUrl, type: 'video/mp4' }],
        }}
      />
    )}
  </div>
      <h1>
      Streaming from: {videoUrl.includes("ipfs.io") ? "IPFS" : "Edge Node Cache"}
    </h1>
    </div>
  );
};

export default VideoPlayer;
