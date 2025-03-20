const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const VideoCDN = await hre.ethers.getContractFactory("VideoCDN");
  const videoCDN = await VideoCDN.deploy();
  await videoCDN.waitForDeployment();

  console.log("VideoCDN deployed to:", await videoCDN.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
