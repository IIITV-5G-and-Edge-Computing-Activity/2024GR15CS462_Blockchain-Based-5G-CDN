import React from 'react';
import Plyr from 'plyr-react';
import 'plyr-react/plyr.css';

const VideoPlayer = ({ ipfsHash }) => {
  const videoUrl = `https://ipfs.io/ipfs/${ipfsHash}`;

  return (
    <div style={{ maxWidth: '800px', margin: 'auto' }}>
      <Plyr
        source={{
          type: 'video',
          sources: [{ src: videoUrl, type: 'video/mp4' }],
        }}
      />
    </div>
  );
};

export default VideoPlayer;
