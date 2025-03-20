const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VideoCDN Contract", function () {
    let VideoCDN, videoCDN, owner, user, edgeNode;

    beforeEach(async function () {
        [owner, user, edgeNode] = await ethers.getSigners();

        VideoCDN = await ethers.getContractFactory("VideoCDN");
        videoCDN = await VideoCDN.deploy();
        await videoCDN.waitForDeployment();
    });

    it("Should deploy correctly", async function () {
        expect(await videoCDN.videoCount()).to.equal(0);
    });

    it("Should allow users to upload videos", async function () {
        await videoCDN.uploadVideo("Qm1234abc", ethers.parseEther("1"));
        expect(await videoCDN.videoCount()).to.equal(1);
        
        const video = await videoCDN.videos(1);
        expect(video.ipfsHash).to.equal("Qm1234abc");
        expect(video.price).to.equal(ethers.parseEther("1"));
    });

    it("Should allow users to register as edge nodes", async function () {
        await videoCDN.connect(edgeNode).registerEdgeNode();
        const node = await videoCDN.edgeNodes(edgeNode.address);
        expect(node.isRegistered).to.be.true;
    });

    it("Should allow users to buy videos and pay edge nodes", async function () {
        await videoCDN.uploadVideo("Qm1234abc", ethers.parseEther("1"));
        await videoCDN.connect(edgeNode).registerEdgeNode();

        await videoCDN.connect(user).buyVideo(1, edgeNode.address, { value: ethers.parseEther("1") });

        expect(await videoCDN.hasAccess(user.address, 1)).to.be.true;

        const videoOwnerBalance = await ethers.provider.getBalance(owner.address);
        const edgeNodeData = await videoCDN.edgeNodes(edgeNode.address);

        expect(edgeNodeData.earnings).to.equal(ethers.parseEther("0.1")); // 10% edge node reward
    });

    it("Should allow edge nodes to withdraw earnings", async function () {
        await videoCDN.uploadVideo("Qm1234abc", ethers.parseEther("1"));
        await videoCDN.connect(edgeNode).registerEdgeNode();
        await videoCDN.connect(user).buyVideo(1, edgeNode.address, { value: ethers.parseEther("1") });

        const balanceBefore = await ethers.provider.getBalance(edgeNode.address);
        await videoCDN.connect(edgeNode).withdrawEarnings();
        const balanceAfter = await ethers.provider.getBalance(edgeNode.address);

        expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("Should allow owner to set edge node reward", async function () {
        await videoCDN.setEdgeNodeReward(20);
        expect(await videoCDN.edgeNodeReward()).to.equal(20);
    });
});
