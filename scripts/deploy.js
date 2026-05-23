const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const ConsentLedger = await hre.ethers.getContractFactory("ConsentLedger");
  const ledger = await ConsentLedger.deploy();
  await ledger.waitForDeployment();

  const address = await ledger.getAddress();
  const artifact = await hre.artifacts.readArtifact("ConsentLedger");
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

  fs.mkdirSync(contractsDir, { recursive: true });
  fs.writeFileSync(
    path.join(contractsDir, "deployment.json"),
    `${JSON.stringify({ address, chainId: 31337 }, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(contractsDir, "ConsentLedgerAbi.json"),
    `${JSON.stringify(artifact.abi, null, 2)}\n`
  );

  console.log(`ConsentLedger deployed to ${address}`);
  console.log("Frontend contract files updated.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
