// Import necessary modules and types from the ethers and hardhat libraries
import { Wallet } from "ethers";
import { ethers } from "hardhat";
import OnchainID from "@onchain-id/solidity";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as dotenv from "dotenv";
dotenv.config();

const deployFullSuiteFixture: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */

  // Get the list of signer objects to represent different actors in the test environment

  const providerApiKey = process.env.REACT_APP_ALCHEMY_API_KEY;

  //Alchemy api key import
  const alchemyApiUrl = `https://polygon-amoy.g.alchemy.com/v2/${providerApiKey}`;

  const provider = new ethers.providers.JsonRpcProvider(alchemyApiUrl);

  //Deployer wallet account setup 
  const privKey_deployer = process.env.REACT_APP_DEPLOYER_PRIVATE_KEY || "";
  const deployer = new Wallet(privKey_deployer, provider);

  //Claim issuer wallet account setup 
  const privKey_claimIssuer = process.env.REACT_APP_CLAIM_ISSUER_PRIVATE_KEY || "";
  const claimIssuer = new Wallet(privKey_claimIssuer, provider);

  //Isser - Agend - admin wallet acount setup (for now the same for the three roles)
  const privKey_Issuer_Agent_Admin = process.env.REACT_APP_ISSUER_AGENT_ADMIN_PRIVATE_KEY || "";

  const tokenIssuer = new Wallet(privKey_Issuer_Agent_Admin, provider);
  const tokenAgent = new Wallet(privKey_Issuer_Agent_Admin, provider);
  const tokenAdmin = new Wallet(privKey_Issuer_Agent_Admin, provider);

  //Adam wallet account setup 
  const privKey_Adam = process.env.REACT_APP_ADAM_PRIVATE_KEY || "";

  const adamWallet = new Wallet(privKey_Adam, provider);

  //Bob wallet account setup 
  const privKey_Bob = process.env.REACT_APP_BOB_PRIVATE_KEY || "";
  const bobWallet = new Wallet(privKey_Bob, provider);

  //Charlie wallet account setup 
  const privKey_Charlie = process.env.REACT_APP_CHARLIE_PRIVATE_KEY || "";
  const charlieWallet = new Wallet(privKey_Charlie, provider);

  // Generate random signing keys for claim issuer and action key for Adam
  const claimIssuerSigningKey = ethers.Wallet.createRandom();
  const adamActionKey = ethers.Wallet.createRandom();

  console.log("\n~~ Accounts ~~");
  console.log("Deployer: ", deployer.address);
  console.log("Token Issuer: ", tokenIssuer.address);
  console.log("Token Agent: ", tokenAgent.address);
  console.log("Token Admin: ", tokenAdmin.address);
  console.log("Claim Issuer: ", claimIssuer.address);

  console.log("Claim Issuer Signing Key: ", claimIssuerSigningKey.address);
  console.log("Adam Action Key: ", adamActionKey.address);

  console.log("Adam Wallet: ", adamWallet.address);
  console.log("Bob Wallet: ", bobWallet.address);
  console.log("Charlie Wallet: ", charlieWallet.address);

  console.log("\n~~ Suite ~~");

  //List of deployed addresses to not need to redeploy again every single time

  const identityImplementation_address = "0x2A9CBB28b329cebC48D09EA34aECe8759E31Db00";
  const identityImplementationAuthority_address = "0x35A2980A60ddbDc8d4Da08DCf1d7cD4dbE3fC5A7";
  const claimTopicsRegistry_address = "0x34591de6f7606d41644eD10F16f6C07542c6B50A";
  const claimIssuersRegistry_address = "0xbcA0446Ac4E82c0685DEc89A9Ee0E7896543927F";
  const identityRegistryStorage_address = "0xd7398CD1Ae98dB99671E7fdf1979B0da8C86B431";
  const identityRegistry_address = "0x4ec843f44d361b1bDCba588705c6E218965232da";
  const basicCompliance_address = "0xbfdD5D76AB5A20BD5605aD40afF33d4211c20F21";
  const tokenOID_address = "0x096C680201025483785c68A5B9cEDa1DDEa2dd4F";
  const token_address = "0x60E5799fed9ACbdaF36e752a05468f1519b03c6f";
  const claimIssuer_address = "0x94D2Ec1a787d97d0a4A86b8d04217f66afd23caA";
  const deployerIdentity_address = "0xBe2a81d7672145eE4fF550d9780d71e0C09D07Dc";
  const adamIdentity_address = "0xe8fe41655b32BA93F1Aa27a266b0743afA019428";
  const bobIdentity_address = "0x2643B16B5D2D31c8Bf59f4E170Cb6B1BC27c5790";
  const charlieIdentity_address = "0xd30e99C61B55C360ece31e952B26793a723c0173";

  ///////////////////////////////////////////////////////
  //Identity Implementation Contract Deployment
  ///////////////////////////////////////////////////////

  console.log("\nIdentity Implementation Contract Deployment...");

  const identityImplementation = await new ethers.Contract(identityImplementation_address, OnchainID.contracts.Identity.abi, deployer);

  console.log("Identity Implementation Contract Address: : ", identityImplementation.address);

  ///////////////////////////////////////////////////////
  //Identity Implementation Authority Contract Deployment
  ///////////////////////////////////////////////////////

  console.log("\nIdentity Implementation Authority Deployment...");

  const identityImplementationAuthority = await new ethers.Contract(identityImplementationAuthority_address, OnchainID.contracts.ImplementationAuthority.abi, deployer);

  console.log("Identity Implementation Authority Contract Address: ", identityImplementationAuthority.address);


  ///////////////////////////////////////////////////////
  //ClaimTopicsRegistry Contract Deployment
  ///////////////////////////////////////////////////////

  console.log("\nClaim Topics Registry Deployment...");

  const claimTopicsRegistryFactory = await ethers.getContractFactory("ClaimTopicsRegistry", deployer);

  const claimTopicsRegistryAbi = claimTopicsRegistryFactory.interface.format(ethers.utils.FormatTypes.json);

  const claimTopicsRegistry = await new ethers.Contract(claimTopicsRegistry_address, claimTopicsRegistryAbi, deployer);

  console.log("Claim Topics Registry Contract Address: ", claimTopicsRegistry.address);


  ///////////////////////////////////////////////////////
  //Claim Issuers Registry Deployment
  ///////////////////////////////////////////////////////

  console.log("\nClaim Issuers Registry Deployment...");

  const claimIssuersRegistryFactory = await ethers.getContractFactory("ClaimIssuersRegistry", deployer);

  const claimIssuersRegistryAbi = claimIssuersRegistryFactory.interface.format(ethers.utils.FormatTypes.json);

  const claimIssuersRegistry = await new ethers.Contract(claimIssuersRegistry_address, claimIssuersRegistryAbi, deployer);

  console.log("Claim Issuers Registry Contract Address: ", claimIssuersRegistry.address);


  ///////////////////////////////////////////////////////
  //Identity Registry Storage Deployment
  ///////////////////////////////////////////////////////

  console.log("\nIdentity Registry Storage Deployment...");

  const identityRegistryStorageFactory = await ethers.getContractFactory("IdentityRegistryStorage", deployer);

  const identityRegistryStorageAbi = identityRegistryStorageFactory.interface.format(ethers.utils.FormatTypes.json);

  const identityRegistryStorage = await new ethers.Contract(identityRegistryStorage_address, identityRegistryStorageAbi, deployer);

  console.log("Identity Registry Storage Contract Address: ", identityRegistryStorage.address);

  ///////////////////////////////////////////////////////
  //Identity Registry Storage Deployment
  ///////////////////////////////////////////////////////

  console.log("\nIdentity Registry Deployment...");

  const identityRegistryFactory = await ethers.getContractFactory("IdentityRegistry", deployer);

  const identityRegistryAbi = identityRegistryFactory.interface.format(ethers.utils.FormatTypes.json);

  const identityRegistry = await new ethers.Contract(identityRegistry_address, identityRegistryAbi, deployer);

  console.log("Identity Registry Contract Address: ", identityRegistry.address);

  ///////////////////////////////////////////////////////
  //Basic Compliance Deployment
  ///////////////////////////////////////////////////////

  console.log("\nBasic Compliance Deployment...");

  const BasicComplianceFactory = await ethers.getContractFactory("BasicCompliance", deployer);

  const basicComplianceAbi = BasicComplianceFactory.interface.format(ethers.utils.FormatTypes.json);

  const basicCompliance = await new ethers.Contract(basicCompliance_address, basicComplianceAbi, deployer);

  console.log("Basic Compliance Contract Address: ", basicCompliance.address);


  ///////////////////////////////////////////////////////
  //Token OID Deployment
  ///////////////////////////////////////////////////////

  console.log("\nTokenOID Deployment...");
  const tokenOID = await new ethers.Contract(tokenOID_address, OnchainID.contracts.Identity.abi, deployer);
  console.log("TokenOID Contract Address: ", tokenOID.address);

  ///////////////////////////////////////////////////////
  //Token Deployment
  ///////////////////////////////////////////////////////
  
  console.log("\nToken Deployment...");

  // Replace with your actual contract code
  const TokenFactory = await ethers.getContractFactory("Token", deployer);

  const tokenAbi = TokenFactory.interface.format(ethers.utils.FormatTypes.json);

  const token = await new ethers.Contract(token_address, tokenAbi, deployer);

  console.log("Token Contract Address: ", token.address);

  
  ///////////////////////////////////////////////////////
  //Claim Issuer Deployment
  ///////////////////////////////////////////////////////

  console.log("\n~~ Claims setup ~~");

  console.log("\nClaim Issuer Deployment...");

  const ClaimIssuerFactory = await ethers.getContractFactory("ClaimIssuer", deployer);

  const claimIssuerAbi = ClaimIssuerFactory.interface.format(ethers.utils.FormatTypes.json);

  const claimIssuerContract = await new ethers.Contract(claimIssuer_address, claimIssuerAbi, deployer);

  console.log("Claim Issuer Contract Address: ", claimIssuerContract.address);

  ///////////////////////////////////////////////////////
  //Deployer Identity Deployment
  ///////////////////////////////////////////////////////

  console.log("\nDeployer Identity Deployment...");
  const deployerIdentity = await new ethers.Contract(deployerIdentity_address, OnchainID.contracts.Identity.abi, deployer);
  console.log("Deployer Identity Contract: ", deployerIdentity.address);

  ///////////////////////////////////////////////////////
  //Adam Identity Deployment
  ///////////////////////////////////////////////////////

  console.log("\nAdam Identity Deployment...");
  const adamIdentity = await new ethers.Contract(adamIdentity_address, OnchainID.contracts.Identity.abi, deployer);
  console.log("Adam Identity Contract: ", adamIdentity.address);

  ///////////////////////////////////////////////////////
  //Bob Identity Deployment
  ///////////////////////////////////////////////////////

  console.log("\nBob Identity Deployment...");
  const bobIdentity = await new ethers.Contract(bobIdentity_address, OnchainID.contracts.Identity.abi, deployer);
  console.log("Bob Identity Contract: ", bobIdentity.address);

  ///////////////////////////////////////////////////////
  //Charlie Identity Deployment
  ///////////////////////////////////////////////////////

  console.log("\nCharlie Identity Deployment...");
  const charlieIdentity = await new ethers.Contract(charlieIdentity_address , OnchainID.contracts.Identity.abi, deployer);
  console.log("Charlie Identity Contract: ", charlieIdentity.address);

  ///////////////////////////////////////////////////////
  //Mint tokens to stakeholders wallets
  ///////////////////////////////////////////////////////

  console.log("\n~~ Sending tokens to wallets ~~");

  /*
  console.log("await identityRegistry.contains(deployer.address)");
  console.log(await identityRegistry.contains(deployer.address));

  console.log("await identityRegistry.canTransfer(deployer.address)");
  console.log(await basicCompliance.canTransfer("0x0000000000000000000000000000000000000000", deployer.address, 1000));

  console.log("await identityRegistry.isVerified(deployer.address)");
  console.log(await identityRegistry.isVerified(deployer.address));
  
  console.log("\n Sending tokens to Deployer wallet...");
  const txMintTokensToDeployerWallet =  await token.connect(tokenAgent).mint(deployer.address, 1000, {gasLimit: 5000000}); // Mint tokens to Deployer 
  await txMintTokensToDeployerWallet.wait();

  /*
  console.log("\n Sending tokens to Adam wallet...");
  const txMintTokensToAdamWallet = await token.connect(tokenAgent).mint(adamWallet.address, 2000, {gasLimit: 5000000}); // Mint tokens to Adam
  await txMintTokensToAdamWallet.wait();

  console.log("\n Sending tokens to Bob wallet...");
  const txMintTokensToBobWallet = await token.connect(tokenAgent).mint(bobWallet.address, 2000, {gasLimit: 5000000}); // Mint tokens to Bob
  await txMintTokensToBobWallet.wait();

  console.log("\n Sending tokens to Charlie wallet...");
  const txMintTokensToCharlieWallet =  await token.connect(tokenAgent).mint(charlieWallet.address, 5000, {gasLimit: 5000000}); // Mint tokens to Charlie
  await txMintTokensToCharlieWallet.wait();
  */
 console.log("\n Done");

};

export default deployFullSuiteFixture;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployFullSuiteFixture.tags = ["ClaimTopicsRegistry", "ClaimIssuersRegistry", "IdentityRegistryStorage", "IdentityRegistry", "Token", "ClaimIssuer"];