// Import necessary modules and types from the ethers and hardhat libraries
import { BigNumber, Contract, Signer, providers, Wallet } from "ethers";
import { ethers } from "hardhat";
import OnchainID from "@onchain-id/solidity";
import { AGENT_ROLE, TOKEN_ROLE } from "../scripts/utils";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

async function deployIdentityProxy(
  implementationAuthority: Contract["address"], // Address of the implementation authority contract
  managementKey: string, // Management key for the identity
  signer: Signer, // Signer object to sign transactions
  provider: any, //Provider added in order to deploy on testnet
  deployer: Wallet //Deployer added in order to deploy on testnet
) {
  const identityProxyFactory = new ethers.ContractFactory(
    OnchainID.contracts.IdentityProxy.abi, // ABI of the IdentityProxy contract
    OnchainID.contracts.IdentityProxy.bytecode, // Bytecode of the IdentityProxy contract
    signer // Signer to deploy the contract
  );

  const txIdentityProxyFactoryDeployment = await identityProxyFactory.getDeployTransaction(implementationAuthority, managementKey);

  txIdentityProxyFactoryDeployment.to = null; // Deploying a new contract, not sending to an address
  txIdentityProxyFactoryDeployment.value = ethers.utils.parseEther("0"); // No Ether transfer
  txIdentityProxyFactoryDeployment.gasLimit = 5000000; // Adjust gas limit if needed
  txIdentityProxyFactoryDeployment.maxPriorityFeePerGas = ethers.utils.parseUnits("5", "gwei"); // Adjust fee if needed
  txIdentityProxyFactoryDeployment.maxFeePerGas = ethers.utils.parseUnits("20", "gwei"); // Adjust fee if needed
  txIdentityProxyFactoryDeployment.nonce = await provider.getSigner(deployer.address).getTransactionCount(); // Get nonce
  txIdentityProxyFactoryDeployment.type = 2; // EIP-1559 transaction type
  txIdentityProxyFactoryDeployment.chainId = 80002; // Replace with Polygon Amoy chain ID (if different)

  const signedTx_IdentityProxyFactoryDeployment = await deployer.signTransaction(txIdentityProxyFactoryDeployment);

  const sendTx_IdentityProxyFactory = await provider.sendTransaction(signedTx_IdentityProxyFactoryDeployment);

  const receipt_IdentityProxyFactory = await sendTx_IdentityProxyFactory.wait(); // Wait for transaction confirmation

  const identityProxyFactory_address = receipt_IdentityProxyFactory.contractAddress;

  const identityReturn = await new ethers.Contract(identityProxyFactory_address, OnchainID.contracts.Identity.abi, signer);

  // Return an instance of the Identity contract at the deployed address
  return identityReturn;
}

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

  const { deploy } = hre.deployments;

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

  ///////////////////////////////////////////////////////
  //Identity Implementation Contract Deployment
  ///////////////////////////////////////////////////////

  console.log("\nIdentity Implementation Contract Deployment...");

  const identityImplementationFactory = await new ethers.ContractFactory(
    OnchainID.contracts.Identity.abi,
    OnchainID.contracts.Identity.bytecode,
    deployer
  );

  const txIdentityImplementationDeployment = await identityImplementationFactory.getDeployTransaction(deployer.address, true);

  txIdentityImplementationDeployment.to = null; // Deploying a new contract, not sending to an address
  txIdentityImplementationDeployment.value = ethers.utils.parseEther("0"); // No Ether transfer
  txIdentityImplementationDeployment.gasLimit = 5000000; // Adjust gas limit if needed
  txIdentityImplementationDeployment.maxPriorityFeePerGas = ethers.utils.parseUnits("5", "gwei"); // Adjust fee if needed
  txIdentityImplementationDeployment.maxFeePerGas = ethers.utils.parseUnits("20", "gwei"); // Adjust fee if needed
  txIdentityImplementationDeployment.nonce = await provider.getSigner(deployer.address).getTransactionCount(); // Get nonce
  txIdentityImplementationDeployment.type = 2; // EIP-1559 transaction type
  txIdentityImplementationDeployment.chainId = 80002; // Replace with Polygon Amoy chain ID (if different)

  const signedTx_IdentityImplementationDeployment = await deployer.signTransaction(txIdentityImplementationDeployment);

  const sendTx_IdentityImplementation = await provider.sendTransaction(signedTx_IdentityImplementationDeployment);

  const receipt_IdentityImplementation = await sendTx_IdentityImplementation.wait(); // Wait for transaction confirmation

  const identityImplementation_address = receipt_IdentityImplementation.contractAddress;

  const identityImplementation = await new ethers.Contract(identityImplementation_address, OnchainID.contracts.Identity.abi, deployer);

  console.log("Identity Implementation Contract Address: : ", identityImplementation.address);


  ///////////////////////////////////////////////////////
  //Identity Implementation Authority Contract Deployment
  ///////////////////////////////////////////////////////

  console.log("\nIdentity Implementation Authority Deployment...");

  const identityImplementationAuthorityFactory = await new ethers.ContractFactory(
    OnchainID.contracts.ImplementationAuthority.abi,
    OnchainID.contracts.ImplementationAuthority.bytecode,
    deployer
  );

  const txIdentityImplementationAuthorityDeployment = await identityImplementationAuthorityFactory.getDeployTransaction(identityImplementation.address);

  txIdentityImplementationAuthorityDeployment.to = null; // Deploying a new contract, not sending to an address
  txIdentityImplementationAuthorityDeployment.value = ethers.utils.parseEther("0"); // No Ether transfer
  txIdentityImplementationAuthorityDeployment.gasLimit = 5000000; // Adjust gas limit if needed
  txIdentityImplementationAuthorityDeployment.maxPriorityFeePerGas = ethers.utils.parseUnits("5", "gwei"); // Adjust fee if needed
  txIdentityImplementationAuthorityDeployment.maxFeePerGas = ethers.utils.parseUnits("20", "gwei"); // Adjust fee if needed
  txIdentityImplementationAuthorityDeployment.nonce = await provider.getSigner(deployer.address).getTransactionCount(); // Get nonce
  txIdentityImplementationAuthorityDeployment.type = 2; // EIP-1559 transaction type
  txIdentityImplementationAuthorityDeployment.chainId = 80002; // Replace with Polygon Amoy chain ID (if different)

  const signedTx_IdentityImplementationAuthorityDeployment = await deployer.signTransaction(txIdentityImplementationAuthorityDeployment);

  const sendTx_IdentityImplementationAuthority = await provider.sendTransaction(signedTx_IdentityImplementationAuthorityDeployment);

  const receipt_IdentityImplementaionAuthority = await sendTx_IdentityImplementationAuthority.wait(); // Wait for transaction confirmation

  const identityImplementationAuthority_address = receipt_IdentityImplementaionAuthority.contractAddress;

  const identityImplementationAuthority = await new ethers.Contract(identityImplementationAuthority_address, OnchainID.contracts.ImplementationAuthority.abi, deployer);

  console.log("Identity Implementation Authority Contract Address: ", identityImplementationAuthority.address);


  ///////////////////////////////////////////////////////
  //ClaimTopicsRegistry Contract Deployment
  ///////////////////////////////////////////////////////

  console.log("\nClaim Topics Registry Deployment...");

  const claimTopicsRegistryFactory = await ethers.getContractFactory("ClaimTopicsRegistry", deployer);

  const txClaimTopicsRegistryDeployment = await claimTopicsRegistryFactory.getDeployTransaction();

  txClaimTopicsRegistryDeployment.to = null; // Deploying a new contract, not sending to an address
  txClaimTopicsRegistryDeployment.value = ethers.utils.parseEther("0"); // No Ether transfer
  txClaimTopicsRegistryDeployment.gasLimit = 5000000; // Adjust gas limit if needed
  txClaimTopicsRegistryDeployment.maxPriorityFeePerGas = ethers.utils.parseUnits("5", "gwei"); // Adjust fee if needed
  txClaimTopicsRegistryDeployment.maxFeePerGas = ethers.utils.parseUnits("20", "gwei"); // Adjust fee if needed
  txClaimTopicsRegistryDeployment.nonce = await provider.getSigner(deployer.address).getTransactionCount(); // Get nonce
  txClaimTopicsRegistryDeployment.type = 2; // EIP-1559 transaction type
  txClaimTopicsRegistryDeployment.chainId = 80002; // Replace with Polygon Amoy chain ID (if different)

  const signedTx_ClaimTopicsRegistryDeployment = await deployer.signTransaction(txClaimTopicsRegistryDeployment);

  const sendTx_ClaimTopicsRegistry = await provider.sendTransaction(signedTx_ClaimTopicsRegistryDeployment);

  const receipt_ClaimTopicsRegistry = await sendTx_ClaimTopicsRegistry.wait(); // Wait for transaction confirmation

  const claimTopicsRegistry_address = receipt_ClaimTopicsRegistry.contractAddress;

  const claimTopicsRegistryAbi = claimTopicsRegistryFactory.interface.format(ethers.utils.FormatTypes.json);

  const claimTopicsRegistry = await new ethers.Contract(claimTopicsRegistry_address, claimTopicsRegistryAbi, deployer);

  console.log("Claim Topics Registry Contract Address: ", claimTopicsRegistry.address);


  ///////////////////////////////////////////////////////
  //Claim Issuers Registry Deployment
  ///////////////////////////////////////////////////////

  console.log("\nClaim Issuers Registry Deployment...");

  const claimIssuersRegistryFactory = await ethers.getContractFactory("ClaimIssuersRegistry", deployer);

  const txClaimIssuersRegistryDeployment = await claimIssuersRegistryFactory.getDeployTransaction();

  txClaimIssuersRegistryDeployment.to = null; // Deploying a new contract, not sending to an address
  txClaimIssuersRegistryDeployment.value = ethers.utils.parseEther("0"); // No Ether transfer
  txClaimIssuersRegistryDeployment.gasLimit = 5000000; // Adjust gas limit if needed
  txClaimIssuersRegistryDeployment.maxPriorityFeePerGas = ethers.utils.parseUnits("5", "gwei"); // Adjust fee if needed
  txClaimIssuersRegistryDeployment.maxFeePerGas = ethers.utils.parseUnits("20", "gwei"); // Adjust fee if needed
  txClaimIssuersRegistryDeployment.nonce = await provider.getSigner(deployer.address).getTransactionCount(); // Get nonce
  txClaimIssuersRegistryDeployment.type = 2; // EIP-1559 transaction type
  txClaimIssuersRegistryDeployment.chainId = 80002; // Replace with Polygon Amoy chain ID (if different)

  const signedTx_ClaimIssuersRegistryDeployment = await deployer.signTransaction(txClaimIssuersRegistryDeployment);

  const sendTx_ClaimIssuersRegistry = await provider.sendTransaction(signedTx_ClaimIssuersRegistryDeployment);

  const receipt_ClaimIssuersRegistry = await sendTx_ClaimIssuersRegistry.wait();

  const claimIssuersRegistry_address = receipt_ClaimIssuersRegistry.contractAddress;

  const claimIssuersRegistryAbi = claimIssuersRegistryFactory.interface.format(ethers.utils.FormatTypes.json);

  const claimIssuersRegistry = await new ethers.Contract(claimIssuersRegistry_address, claimIssuersRegistryAbi, deployer);

  console.log("Claim Issuers Registry Contract Address: ", claimIssuersRegistry.address);


  ///////////////////////////////////////////////////////
  //Identity Registry Storage Deployment
  ///////////////////////////////////////////////////////

  console.log("\nIdentity Registry Storage Deployment...");

  const identityRegistryStorageFactory = await ethers.getContractFactory("IdentityRegistryStorage", deployer);

  const txIdentityRegistryStorageDeployment = await identityRegistryStorageFactory.getDeployTransaction();

  txIdentityRegistryStorageDeployment.to = null; // Deploying a new contract, not sending to an address
  txIdentityRegistryStorageDeployment.value = ethers.utils.parseEther("0"); // No Ether transfer
  txIdentityRegistryStorageDeployment.gasLimit = 5000000;
  txIdentityRegistryStorageDeployment.maxPriorityFeePerGas = ethers.utils.parseUnits("5", "gwei");
  txIdentityRegistryStorageDeployment.maxFeePerGas = ethers.utils.parseUnits("20", "gwei");
  txIdentityRegistryStorageDeployment.nonce = await provider.getSigner(deployer.address).getTransactionCount();
  txIdentityRegistryStorageDeployment.type = 2;
  txIdentityRegistryStorageDeployment.chainId = 80002;

  const signedTx_IdentityRegistryStorageDeployment = await deployer.signTransaction(txIdentityRegistryStorageDeployment);

  const sendTx_IdentityRegistryStorage = await provider.sendTransaction(signedTx_IdentityRegistryStorageDeployment);

  const receipt_IdentityRegistryStorage = await sendTx_IdentityRegistryStorage.wait();

  const identityRegistryStorage_address = receipt_IdentityRegistryStorage.contractAddress;

  const identityRegistryStorageAbi = identityRegistryStorageFactory.interface.format(ethers.utils.FormatTypes.json);

  const identityRegistryStorage = await new ethers.Contract(identityRegistryStorage_address, identityRegistryStorageAbi, deployer);

  console.log("Identity Registry Storage Contract Address: ", identityRegistryStorage.address);


  ///////////////////////////////////////////////////////
  //Identity Registry Storage Deployment
  ///////////////////////////////////////////////////////

  console.log("\nIdentity Registry Deployment...");

  const identityRegistryFactory = await ethers.getContractFactory("IdentityRegistry", deployer);

  const txIdentityRegistryDeployment = await identityRegistryFactory.getDeployTransaction(
    claimIssuersRegistry.address,
    claimTopicsRegistry.address,
    identityRegistryStorage.address
  );

  txIdentityRegistryDeployment.to = null; // Deploying a new contract, not sending to an address
  txIdentityRegistryDeployment.value = ethers.utils.parseEther("0"); // No Ether transfer
  txIdentityRegistryDeployment.gasLimit = 5000000;
  txIdentityRegistryDeployment.maxPriorityFeePerGas = ethers.utils.parseUnits("5", "gwei");
  txIdentityRegistryDeployment.maxFeePerGas = ethers.utils.parseUnits("20", "gwei");
  txIdentityRegistryDeployment.nonce = await provider.getSigner(deployer.address).getTransactionCount();
  txIdentityRegistryDeployment.type = 2;
  txIdentityRegistryDeployment.chainId = 80002;

  const signedTx_IdentityRegistryDeployment = await deployer.signTransaction(txIdentityRegistryDeployment);

  const sendTx_IdentityRegistry = await provider.sendTransaction(signedTx_IdentityRegistryDeployment);

  const receipt_IdentityRegistry = await sendTx_IdentityRegistry.wait();

  const identityRegistry_address = receipt_IdentityRegistry.contractAddress;

  const identityRegistryAbi = identityRegistryFactory.interface.format(ethers.utils.FormatTypes.json);

  const identityRegistry = await new ethers.Contract(identityRegistry_address, identityRegistryAbi, deployer);

  console.log("Identity Registry Contract Address: ", identityRegistry.address);

  ///////////////////////////////////////////////////////
  //Basic Compliance Deployment
  ///////////////////////////////////////////////////////

  console.log("\nBasic Compliance Deployment...");

  const BasicComplianceFactory = await ethers.getContractFactory("BasicCompliance", deployer);
  
  const txBasicComplianceDeployment = await BasicComplianceFactory.getDeployTransaction();

  txBasicComplianceDeployment.to = null; // Deploying a new contract, not sending to an address
  txBasicComplianceDeployment.value = ethers.utils.parseEther("0"); // No Ether transfer
  txBasicComplianceDeployment.gasLimit = 5000000;
  txBasicComplianceDeployment.maxPriorityFeePerGas = ethers.utils.parseUnits("5", "gwei");
  txBasicComplianceDeployment.maxFeePerGas = ethers.utils.parseUnits("20", "gwei");
  txBasicComplianceDeployment.nonce = await provider.getSigner(deployer.address).getTransactionCount();
  txBasicComplianceDeployment.type = 2;
  txBasicComplianceDeployment.chainId = 80002;
  const signedTx_BasicComplianceDeployment = await deployer.signTransaction(txBasicComplianceDeployment);

  const sendTx_BasicCompliance = await provider.sendTransaction(signedTx_BasicComplianceDeployment);

  const receipt_BasicCompliance = await sendTx_BasicCompliance.wait();

  const basicCompliance_address = receipt_BasicCompliance.contractAddress;

  const basicComplianceAbi = BasicComplianceFactory.interface.format(ethers.utils.FormatTypes.json);

  const basicCompliance = await new ethers.Contract(basicCompliance_address, basicComplianceAbi, deployer);

  console.log("Basic Compliance Contract Address: ", basicCompliance.address);


  ///////////////////////////////////////////////////////
  //Token OID Deployment
  ///////////////////////////////////////////////////////

  console.log("\nTokenOID Deployment...");

  const tokenOID = await deployIdentityProxy(
    identityImplementationAuthority.address, // Address of the ImplementationAuthority contract
    tokenIssuer.address, // Address of the token issuer
    deployer, // Signer to deploy the contract,
    provider, //Provider added in order to deploy on testnet
    deployer //Deployer added in order to deploy on testnet
  );

  console.log("TokenOID Contract Address: ", tokenOID.address);

  ///////////////////////////////////////////////////////
  //Token Deployment
  ///////////////////////////////////////////////////////

  console.log("\nToken Deployment...");

  // Define the token details as Name, Symbol and Decimals.
  const tokenName = "ERC-3643";
  const tokenSymbol = "TREX";
  const tokenDecimals = BigNumber.from("6");

  // Replace with your actual contract code
  const TokenFactory = await ethers.getContractFactory("Token", deployer);

  // Contract constructor arguments
  const args_tokenFactory = [
    identityRegistry.address,  // Address of the IdentityRegistry contract (replace with actual address)
    basicCompliance.address,   // Address of the BasicCompliance contract
    tokenName,                  // Name of the token
    tokenSymbol,                // Symbol of the token
    tokenDecimals,              // Decimals of the token
    tokenOID.address,           // Address of the token's IdentityProxy contract
  ];

  const txTokenDeployment = await TokenFactory.getDeployTransaction(...args_tokenFactory);

  // Set deployment specific parameters
  txTokenDeployment.to = null; // Deploying a new contract, not sending to an address
  txTokenDeployment.value = ethers.utils.parseEther("0"); // No Ether transfer
  txTokenDeployment.gasLimit = 5000000; // Adjust gas limit if needed
  txTokenDeployment.maxPriorityFeePerGas = ethers.utils.parseUnits("5", "gwei"); // Set max priority fee
  txTokenDeployment.maxFeePerGas = ethers.utils.parseUnits("20", "gwei"); // Set max fee
  txTokenDeployment.nonce = await provider.getSigner(deployer.address).getTransactionCount();
  txTokenDeployment.type = 2; // Set transaction type to 2 (EIP-1559)
  txTokenDeployment.chainId = 80002; // Polygon Amoy Chain ID

  const signedTx_TokenDeployment = await deployer.signTransaction(txTokenDeployment);

  const sendTx_Token = await provider.sendTransaction(signedTx_TokenDeployment);

  const receipt_Token = await sendTx_Token.wait();

  const token_address = receipt_Token.contractAddress;

  const tokenAbi = TokenFactory.interface.format(ethers.utils.FormatTypes.json);

  const token = await new ethers.Contract(token_address, tokenAbi, deployer);

  console.log("Token Contract Address: ", token.address);

  ///////////////////////////////////////////////////////
  //Granting roles in deployed smart contracts
  ///////////////////////////////////////////////////////

  //await new Promise(f => setTimeout(f, 5000));

  // Grant the TOKEN_ROLE to the token contract in the BasicCompliance contract (1)
  await basicCompliance.grantRole(TOKEN_ROLE, token.address);

  // Grant the AGENT_ROLE to the token agent in the token contract (2)
  await token.grantRole(AGENT_ROLE, tokenAgent.address);

  // Grant the AGENT_ROLE to the Token Smart Contract Address in the identityRegistry contract (3)
  await identityRegistry.grantRole(AGENT_ROLE, token.address);

  // Bind the IdentityRegistryStorage contract to the IdentityRegistry contract (4)
  await identityRegistryStorage.bindIdentityRegistry(identityRegistry.address);

  // Grant the AGENT_ROLE to the token agent in the token contract (5)
  await token.grantRole(AGENT_ROLE, tokenAgent.address);

  // Grant the AGENT_ROLE to the token agent in the IdentityRegistry contract (6)
  await identityRegistry.grantRole(AGENT_ROLE, tokenAgent.address);

  // Define the claim topics and add them to the ClaimTopicsRegistry (7)
  const claimTopics = [ethers.utils.id("CLAIM_TOPIC")];
  await claimTopicsRegistry.connect(deployer).addClaimTopic(claimTopics[0]);

  await new Promise(f => setTimeout(f, 10000));

  ///////////////////////////////////////////////////////
  //Claim Issuer Deployment
  ///////////////////////////////////////////////////////

  console.log("\n~~ Claims setup ~~");

  console.log("\nClaim Issuer Deployment...");

  // Replace with your actual contract code
  const ClaimIssuerFactory = await ethers.getContractFactory("ClaimIssuer", deployer);

  // Contract constructor arguments
  const args = [claimIssuer.address]; // Assuming 'claimIssuer.address' is the address or variable holding the argument

  const txClaimIssuerDeployment = await ClaimIssuerFactory.getDeployTransaction(...args);

  // Set deployment specific parameters
  txClaimIssuerDeployment.to = null; // Deploying a new contract, not sending to an address
  txClaimIssuerDeployment.value = ethers.utils.parseEther("0"); // No Ether transfer
  txClaimIssuerDeployment.gasLimit = 5000000; // Adjust gas limit if needed
  txClaimIssuerDeployment.maxPriorityFeePerGas = ethers.utils.parseUnits("5", "gwei"); // Set max priority fee
  txClaimIssuerDeployment.maxFeePerGas = ethers.utils.parseUnits("20", "gwei"); // Set max fee
  txClaimIssuerDeployment.nonce = await provider.getSigner(deployer.address).getTransactionCount();
  txClaimIssuerDeployment.type = 2; // Set transaction type to 2 (EIP-1559)
  txClaimIssuerDeployment.chainId = 80002; // Polygon Amoy Chain ID

  const signedTx_ClaimIssuerDeployment = await deployer.signTransaction(txClaimIssuerDeployment);

  const sendTx_ClaimIssuer = await provider.sendTransaction(signedTx_ClaimIssuerDeployment);

  const receipt_ClaimIssuer = await sendTx_ClaimIssuer.wait();

  const claimIssuer_address = receipt_ClaimIssuer.contractAddress;

  const claimIssuerAbi = ClaimIssuerFactory.interface.format(ethers.utils.FormatTypes.json);

  const claimIssuerContract = await new ethers.Contract(claimIssuer_address, claimIssuerAbi, deployer);

  console.log("Claim Issuer Contract Address: ", claimIssuerContract.address);

  ///////////////////////////////////////////////////////
  //Adding claims to smart contract
  ///////////////////////////////////////////////////////

  // Add a key to the ClaimIssuer contract

  const addKeyToTheClaimIssuerContractTransaction = await claimIssuerContract
    .connect(claimIssuer)
    .addKey(
      ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["address"], // Key type
          [claimIssuerSigningKey.address] // Address of the signing key
        )
      ),
      3, // Purpose of the key
      1, // Type of the key
      { gasLimit: 5000000 });

  await addKeyToTheClaimIssuerContractTransaction.wait();

  // Add the ClaimIssuer contract to the ClaimIssuersRegistry

  const addClaimIssuerContractToClaimIssuerRegistryTransaction = await claimIssuersRegistry
    .connect(deployer)
    .addClaimIssuer(claimIssuerContract.address, claimTopics, {gasLimit: 5000000});

  await addClaimIssuerContractToClaimIssuerRegistryTransaction.wait();
  
  ///////////////////////////////////////////////////////
  //Deployer Identity Deployment
  ///////////////////////////////////////////////////////

  console.log("\nDeployer Identity Deployment...");
      
  // Deploy IdentityProxy contract for the deployer to be able to do metatesting
  const deployerIdentity = await deployIdentityProxy(
    identityImplementationAuthority.address, // Address of the ImplementationAuthority contract
    deployer.address, // Address of users's wallet
    deployer, // Signer to deploy the contract
    provider, //Provider added in order to deploy on testnet
    deployer //Deployer added in order to deploy on testnet
  );
  console.log("Deployer Identity Contract: ", deployerIdentity.address);

  ///////////////////////////////////////////////////////
  //Adam Identity Deployment
  ///////////////////////////////////////////////////////

  console.log("\nAdam Identity Deployment...");

  // Deploy IdentityProxy contracts for Adam, Bob, and Charlie
  const adamIdentity = await deployIdentityProxy(
    identityImplementationAuthority.address, // Address of the ImplementationAuthority contract
    adamWallet.address, // Address of Adam's wallet
    deployer, // Signer to deploy the contract
    provider, //Provider added in order to deploy on testnet
    deployer //Deployer added in order to deploy on testnet
  );
  console.log("Adam Identity Contract: ", adamIdentity.address);

  // Add an action key to Adam's Identity contract
  
  const addActionKeyToAdamsIdentityContractTransaction = await adamIdentity
    .connect(adamWallet)
    .addKey(
      ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["address"], // Key type
          [adamActionKey.address] // Address of Adam's action key
        )
      ),
      2, // Purpose of the key
      1, // Type of the key
      {gasLimit: 5000000}
    );

  await addActionKeyToAdamsIdentityContractTransaction.wait();

  ///////////////////////////////////////////////////////
  //Bob Identity Deployment
  ///////////////////////////////////////////////////////

  console.log("\nBob Identity Deployment...");

  const bobIdentity = await deployIdentityProxy(
    identityImplementationAuthority.address, // Address of the ImplementationAuthority contract
    bobWallet.address, // Address of Bob's wallet
    deployer, // Signer to deploy the contract
    provider, //Provider added in order to deploy on testnet
    deployer //Deployer added in order to deploy on testnet
  );
  console.log("Bob Identity Contract: ", bobIdentity.address);

  ///////////////////////////////////////////////////////
  //Charlie Identity Deployment
  ///////////////////////////////////////////////////////

  console.log("\nCharlie Identity Deployment...");

  const charlieIdentity = await deployIdentityProxy(
    identityImplementationAuthority.address, // Address of the ImplementationAuthority contract
    charlieWallet.address, // Address of Charlie's wallet
    deployer, // Signer to deploy the contract
    provider, //Provider added in order to deploy on testnet
    deployer //Deployer added in order to deploy on testnet
  );
  console.log("Charlie Identity Contract: ", charlieIdentity.address);

  ///////////////////////////////////////////////////////
  //Granting roles in deployed smart contracts
  ///////////////////////////////////////////////////////

  // Grant the AGENT_ROLE to the token agent and token in the IdentityRegistry contract
  await identityRegistry.grantRole(AGENT_ROLE, tokenAgent.address);

  await new Promise(f => setTimeout(f, 5000));

  await identityRegistry.grantRole(TOKEN_ROLE, token.address);

  await new Promise(f => setTimeout(f, 5000));

  console.log("\nBatch register identities in the Identity Registry...");
  
  // Batch register identities in the IdentityRegistry
 
  const batchRegisterIdentitiesInIdentityRegistryTransaction = await identityRegistry
    .connect(tokenAgent)
    .batchRegisterIdentity(
      [deployer.address, adamWallet.address, bobWallet.address, charlieWallet.address], // Addresses of Adam and Bob's wallets
      [deployerIdentity.address, adamIdentity.address, bobIdentity.address, charlieIdentity.address], // Addresses of Adam and Bob's identities
      [300, 42, 666, 304], //Values associated with Adam and Bob in the identity registry
      {gasLimit: 5000000});

  await batchRegisterIdentitiesInIdentityRegistryTransaction.wait();

  ///////////////////////////////////////////////////////
  //Define the claim data - sign it and add it for the Deployer account
  ///////////////////////////////////////////////////////

  console.log("\nDefine the claim data for the deployer...");

  // Define the claim data for the deployer
  const claimForDeployer = {
    data: ethers.utils.hexlify(
      ethers.utils.toUtf8Bytes("Some claim public data.") // Public claim data for Deployer
    ),
    issuer: claimIssuerContract.address, // Address of the ClaimIssuer contract
    topic: claimTopics[0], // Claim topic
    scheme: 1, // Scheme of the claim
    identity: deployerIdentity.address, // Address of Deployer's Identity contract
    signature: "", // Placeholder for the claim signature
  };

  console.log("\nSign the claim data for Deployer...");

  // Sign the claim data for Deployer
  claimForDeployer.signature = await claimIssuerSigningKey.signMessage(
    ethers.utils.arrayify(
      ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256", "bytes"], // Types of the claim data
          [claimForDeployer.identity, claimForDeployer.topic, claimForDeployer.data] // Claim data for Deployer
        )
      )
    )
  );

  console.log("\nAdd the claim to Deployer's Identity contract...");
  
  // Add the claim to Deployer's Identity contract
  const txAddClaimToDeployerIdentity = await deployerIdentity
    .connect(deployer)
    .addClaim(
      claimForDeployer.topic, // Claim topic
      claimForDeployer.scheme, // Claim scheme
      claimForDeployer.issuer, // Address of the ClaimIssuer contract
      claimForDeployer.signature, // Signed claim data
      claimForDeployer.data, // Public claim data
      "", // Additional data (optional)
    );

  await txAddClaimToDeployerIdentity.wait();

  ///////////////////////////////////////////////////////
  //Define the claim data - sign it and add it for Adam account
  ///////////////////////////////////////////////////////

  console.log("\nDefine the claim data for Adam identity...");

  // Define the claim data for Adam
  const claimForAdam = {
    data: ethers.utils.hexlify(
      ethers.utils.toUtf8Bytes("Some claim public data.") // Public claim data for Adam
    ),
    issuer: claimIssuerContract.address, // Address of the ClaimIssuer contract
    topic: claimTopics[0], // Claim topic
    scheme: 1, // Scheme of the claim
    identity: adamIdentity.address, // Address of Adam's Identity contract
    signature: "", // Placeholder for the claim signature
  };

  console.log("Sign the claim data for Adam identity...");

  // Sign the claim data for Adam
  claimForAdam.signature = await claimIssuerSigningKey.signMessage(
    ethers.utils.arrayify(
      ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256", "bytes"], // Types of the claim data
          [claimForAdam.identity, claimForAdam.topic, claimForAdam.data] // Claim data for Adam
        )
      )
    )
  );

  console.log("Add the claim to Adams's Identity contract...");

  // Add the claim to Deployer's Identity contract
  const txAddClaimToAdamIdentity = await adamIdentity
    .connect(adamWallet)
    .addClaim(
      claimForAdam.topic, // Claim topic
      claimForAdam.scheme, // Claim scheme
      claimForAdam.issuer, // Address of the ClaimIssuer contract
      claimForAdam.signature, // Signed claim data
      claimForAdam.data, // Public claim data
      "", // Additional data (optional)
    );

  await txAddClaimToAdamIdentity.wait();

  ///////////////////////////////////////////////////////
  //Define the claim data - sign it and add it for Bob account
  ///////////////////////////////////////////////////////

  console.log("\nDefine the claim data for Bob identity...");

  // Define the claim data for Bob
  const claimForBob = {
    data: ethers.utils.hexlify(
      ethers.utils.toUtf8Bytes("Some claim public data.") // Public claim data for Bob
    ),
    issuer: claimIssuerContract.address, // Address of the ClaimIssuer contract
    topic: claimTopics[0], // Claim topic
    scheme: 1, // Scheme of the claim
    identity: bobIdentity.address, // Address of Bob's Identity contract
    signature: "", // Placeholder for the claim signature
  };

  console.log("Sign the claim data for Bob identity...");

  // Sign the claim data for Bob
  claimForBob.signature = await claimIssuerSigningKey.signMessage(
    ethers.utils.arrayify(
      ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256", "bytes"], // Types of the claim data
          [claimForBob.identity, claimForBob.topic, claimForBob.data] // Claim data for Bob
        )
      )
    )
  );

  console.log("Add the claim to Bob's Identity contract...");

  // Add the claim to Bob's Identity contract
  const txAddClaimToBobIdentity = await bobIdentity
    .connect(bobWallet)
    .addClaim(
      claimForBob.topic, // Claim topic
      claimForBob.scheme, // Claim scheme
      claimForBob.issuer, // Address of the ClaimIssuer contract
      claimForBob.signature, // Signed claim data
      claimForBob.data, // Public claim data
      "", // Additional data (optional)
    );

  await txAddClaimToBobIdentity.wait();

  ///////////////////////////////////////////////////////
  //Define the claim data - sign it and add it for Charlie account
  ///////////////////////////////////////////////////////

  console.log("\nDefine the claim data for Charlie identity...");
  // Define the claim data for Charlie
  const claimForCharlie = {
    data: ethers.utils.hexlify(
      ethers.utils.toUtf8Bytes("Some claim public data.") // Public claim data for Charlie
    ),
    issuer: claimIssuerContract.address, // Address of the ClaimIssuer contract
    topic: claimTopics[0], // Claim topic
    scheme: 1, // Scheme of the claim
    identity: charlieIdentity.address, // Address of Charlie's Identity contract
    signature: "", // Placeholder for the claim signature
  };

  console.log("Sign the claim data for Charlie identity...");

  // Sign the claim data for Charlie
  claimForCharlie.signature = await claimIssuerSigningKey.signMessage(
    ethers.utils.arrayify(
      ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256", "bytes"], // Types of the claim data
          [claimForCharlie.identity, claimForCharlie.topic, claimForCharlie.data] // Claim data for Charlie
        )
      )
    )
  );

  console.log("Add the claim to Charlie's Identity contract...");

  // Add the claim to Charlie's Identity contract
  const txAddClaimToCharlieIdentity = await charlieIdentity
    .connect(charlieWallet)
    .addClaim(
      claimForCharlie.topic, // Claim topic
      claimForCharlie.scheme, // Claim scheme
      claimForCharlie.issuer, // Address of the ClaimIssuer contract
      claimForCharlie.signature, // Signed claim data
      claimForCharlie.data, // Public claim data
      "", // Additional data (optional)
    );

  await txAddClaimToCharlieIdentity.wait();


  ///////////////////////////////////////////////////////
  //Mint tokens to stakeholders wallets
  ///////////////////////////////////////////////////////
  /*
  console.log("await identityRegistry.contains(deployer.address)");
  console.log(await identityRegistry.contains(deployer.address));

  console.log("await identityRegistry.canTransfer(deployer.address)");
  console.log(await basicCompliance.canTransfer("0x0000000000000000000000000000000000000000", deployer.address, 100000));

  console.log("await identityRegistry.isVerified(deployer.address)");
  console.log(await identityRegistry.isVerified(deployer.address));
  */

  console.log("\n~~ Sending tokens to wallets ~~");

  console.log("\n Sending tokens to Deployer wallet...");
  const txMintTokensToDeployerWallet =  await token.connect(tokenAgent).mint(deployer.address, 100000, {gasLimit: 5000000}); // Mint 100000 tokens to Deployer
  await txMintTokensToDeployerWallet.wait();
  
  /*
  await token.connect(tokenAgent).mint(adamWallet, 2000, {gasLimit: 5000000}); // Mint 1000 tokens to Adam
  await token.connect(tokenAgent).mint(bobWallet, 2000, {gasLimit: 5000000}); // Mint 500 tokens to Bob
  await token.connect(tokenAgent).mint(charlieWallet, 5000, {gasLimit: 5000000}); // Mint 5000 tokens to Charlie
  */

};

export default deployFullSuiteFixture;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployFullSuiteFixture.tags = ["ClaimTopicsRegistry", "ClaimIssuersRegistry", "IdentityRegistryStorage", "IdentityRegistry", "Token", "ClaimIssuer"];