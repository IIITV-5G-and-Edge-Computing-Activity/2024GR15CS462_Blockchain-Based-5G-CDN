import React, { useEffect, useState } from 'react';
import Plyr from 'plyr-react';
import 'plyr-react/plyr.css';
import axios from 'axios';
import "./VideoPlayer.css";
import edgeNodeMap from './assets/edgeNodeMap'; 

const VideoPlayer = ({ ipfsHash, edgeNode}) => {
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    const nodeUrl = edgeNodeMap[edgeNode];
    console.log(edgeNodeMap[edgeNode])
    if (nodeUrl) {
      setVideoUrl(`${nodeUrl}/video/${ipfsHash}`);
    } else {
      console.warn("Edge node not found. Falling back to IPFS.");
      setVideoUrl(`https://ipfs.io/ipfs/${ipfsHash}`);
    }
  }, [ipfsHash, edgeNode]);
  

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
