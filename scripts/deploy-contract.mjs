import fs from "fs";
import path from "path";
import { ethers } from "ethers";

// Simple env file parser
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const parts = trimmed.split("=");
    const key = parts[0].trim();
    const value = parts.slice(1).join("=").trim();
    env[key] = value;
  });
  return env;
}

async function main() {
  const envLocalPath = path.resolve(process.cwd(), ".env.local");
  const env = loadEnv(envLocalPath);

  // Determine private key (arg or env)
  let privateKey = process.argv[2] || env.DEPLOYER_PRIVATE_KEY || env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("Error: Private key is missing.");
    console.error("Usage: node scripts/deploy-contract.mjs <YOUR_PRIVATE_KEY>");
    console.error("Or define DEPLOYER_PRIVATE_KEY or PRIVATE_KEY in .env.local");
    process.exit(1);
  }

  // Standardize private key (ensure 0x prefix)
  if (!privateKey.startsWith("0x") && privateKey.length === 64) {
    privateKey = "0x" + privateKey;
  }

  // Get RPC URL
  const rpcUrl = env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org";
  console.log(`Connecting to Base Sepolia RPC: ${rpcUrl}...`);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // Verify provider connection
  try {
    const network = await provider.getNetwork();
    console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
  } catch (error) {
    console.error("Error connecting to RPC URL:", error.message);
    process.exit(1);
  }

  let wallet;
  try {
    wallet = new ethers.Wallet(privateKey, provider);
  } catch (error) {
    console.error("Error creating wallet: Please verify your private key is valid.", error.message);
    process.exit(1);
  }
  
  console.log(`Deployer Wallet Address: ${wallet.address}`);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`Wallet Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.error("Error: Wallet has 0 ETH. Please fund this wallet with some Base Sepolia ETH before deploying.");
    process.exit(1);
  }

  // Read BadgeContract compiled output
  const artifactPath = path.resolve(
    process.cwd(),
    "contracts/out/BadgeContract.sol/BadgeContract.json"
  );
  if (!fs.existsSync(artifactPath)) {
    console.error(`Error: Compiled artifact not found at ${artifactPath}`);
    process.exit(1);
  }

  console.log("Loading compiled smart contract artifact...");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;
  const bytecode = artifact.bytecode.object;

  console.log("Deploying BadgeContract to Base Sepolia...");
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  
  try {
    const contract = await factory.deploy();
    console.log("Transaction submitted. Waiting for confirmation...");
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    console.log(`\n🎉 Success! BadgeContract deployed at: ${address}`);

    // Update .env.local
    let envContent = fs.readFileSync(envLocalPath, "utf8");
    const regex = /^NEXT_PUBLIC_BADGE_CONTRACT=.*$/m;
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `NEXT_PUBLIC_BADGE_CONTRACT=${address}`);
    } else {
      envContent += `\nNEXT_PUBLIC_BADGE_CONTRACT=${address}\n`;
    }
    fs.writeFileSync(envLocalPath, envContent, "utf8");
    console.log(`Updated .env.local with deployed contract address: ${address}\n`);
    
    console.log("The dApp is now fully configured and complete!");
  } catch (error) {
    console.error("Deployment failed:", error.message);
    process.exit(1);
  }
}

main();
