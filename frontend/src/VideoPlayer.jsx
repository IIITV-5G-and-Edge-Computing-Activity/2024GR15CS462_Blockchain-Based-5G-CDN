import React, { useEffect, useState } from 'react';
import Plyr from 'plyr-react';
import 'plyr-react/plyr.css';
import axios from 'axios';

const VideoPlayer = ({ ipfsHash }) => {
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    const fetchEdgeNode = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/edge-node/${ipfsHash}`);
        setVideoUrl(res.data.edgeNodeUrl);
      } catch (err) {
        console.error("❌ Could not fetch edge node. Falling back to IPFS.io");
        setVideoUrl(`https://ipfs.io/ipfs/${ipfsHash}`);
      }
    };

    fetchEdgeNode();
  }, [ipfsHash]);

  return (
    <div style={{ maxWidth: '800px', margin: 'auto' }}>
    <p style={{ fontSize: '14px', color: '#888' }}>
      Streaming from: {videoUrl.includes("ipfs.io") ? "IPFS" : "Edge Node Cache"}
    </p>
      {videoUrl && (
        <Plyr
          source={{
            type: 'video',
            sources: [{ src: videoUrl, type: 'video/mp4' }],
          }}
        />
      )}
    </div>
  );
};

export default VideoPlayer;
