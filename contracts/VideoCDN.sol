// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VideoCDN {
    struct Video {
        address owner;
        uint256 price;
        string ipfsHash;
        string title;
        string subtitle;
        string date;
        string[] genres;
        string image;
        string trailer;
    }

    struct EdgeNode {
        bool isRegistered;
        uint256 earnings;
    }

    mapping(uint256 => Video) public videos;
    mapping(address => EdgeNode) public edgeNodes;
    mapping(address => mapping(uint256 => bool)) public hasAccess;

    uint256 public videoCount;
    uint256 public edgeNodeReward = 10;

    event VideoUploaded(uint256 videoId, address owner, string ipfsHash, uint256 price);
    event VideoPurchased(uint256 videoId, address buyer);
    event EdgeNodePaid(address node, uint256 amount);
    event EdgeNodeRegistered(address node);

    function registerEdgeNode() external {
        require(!edgeNodes[msg.sender].isRegistered, "Already registered");
        edgeNodes[msg.sender].isRegistered = true;
        emit EdgeNodeRegistered(msg.sender);
    }

    function uploadVideo(
        string memory _title,
        string memory _subtitle,
        string memory _date,
        string[] memory _genres,
        string memory _image,
        string memory _ipfsHash,
        uint256 _price,
        string memory _trailer
    ) external {
        videoCount++;
        videos[videoCount] = Video(
            msg.sender,
            _price,
            _ipfsHash,
            _title,
            _subtitle,
            _date,
            _genres,
            _image,
            _trailer
        );
        emit VideoUploaded(videoCount, msg.sender, _ipfsHash, _price);
    }

    function buyVideo(uint256 _videoId, address _edgeNode) external payable {
        require(_videoId > 0 && _videoId <= videoCount, "Invalid video ID");
        Video storage video = videos[_videoId];
        require(msg.value >= video.price, "Insufficient payment");
        require(!hasAccess[msg.sender][_videoId], "Already purchased");

        uint256 edgeNodeCut = (video.price * edgeNodeReward) / 100;
        uint256 ownerCut = video.price - edgeNodeCut;

        payable(video.owner).transfer(ownerCut);

        if (_edgeNode != address(0) && edgeNodes[_edgeNode].isRegistered) {
            edgeNodes[_edgeNode].earnings += edgeNodeCut;
            emit EdgeNodePaid(_edgeNode, edgeNodeCut);
        }

        hasAccess[msg.sender][_videoId] = true;
        emit VideoPurchased(_videoId, msg.sender);
    }

    function withdrawEarnings() external {
        uint256 amount = edgeNodes[msg.sender].earnings;
        require(amount > 0, "No earnings to withdraw");
        edgeNodes[msg.sender].earnings = 0;
        payable(msg.sender).transfer(amount);
    }

    function setEdgeNodeReward(uint256 _reward) external {
        require(_reward <= 50, "Too high reward");
        edgeNodeReward = _reward;
    }

    function getVideos() public view returns (Video[] memory) {
        Video[] memory allVideos = new Video[](videoCount);
        for (uint256 i = 1; i <= videoCount; i++) {
            allVideos[i - 1] = videos[i];
        }
        return allVideos;
    }
}
