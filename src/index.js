const { ethers } = require('ethers');
const { log } = require('./logger'); 
const config = require('./config.json'); 
require('dotenv').config();

const privateKeys = process.env.PRIVATE_KEYS;

if (!privateKeys) {
    log('ERROR', "PRIVATE_KEYS not defined in .env file");
    process.exit(1); 
}

const PRIVATE_KEYS = privateKeys.split(',').map(key => key.trim()); 
const PROVIDER_URL = 'https://base.blockpi.network/v1/rpc/public'; 

const ABI = [
    "function mintPublic(address nftContract,address feeRecipient,address minterIfNotPayer,uint256 quantity) external payable"
];


const provider = new ethers.JsonRpcProvider(PROVIDER_URL);


const CONTRACT_ADDRESS = '0x00005EA00Ac477B1030CE78506496e8C2dE24bf5';
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);


const { nftContract, quantity, mintStartTime } = config;
const feeRecipient = '0x0000a26b00c1F0DF003000390027140000fAa719';
const minterIfNotPayer = '0x0000000000000000000000000000000000000000';
const value = ethers.parseEther("0"); 


const gasLimit = 500000;

async function mintNFT(wallet, walletIndex) {
    try {
        const nonce = await provider.getTransactionCount(wallet.address);
        const feeData = await provider.getFeeData();

        const tx = await contract.connect(wallet).mintPublic(
            nftContract,
            feeRecipient,
            minterIfNotPayer,
            quantity,
            {
                value: value,
                gasLimit: gasLimit,
                nonce: nonce,
                maxFeePerGas: feeData.maxFeePerGas,
                maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
            }
        );

        log('INFO', `Wallet ${walletIndex + 1} | ${wallet.address} | Mint Processing`);
        log('SUCCESS', `Mint Successfully | TX hash: https://basescan.org/tx/${tx.hash}`);
    } catch (error) {
        log('ERROR', `Error during minting for Wallet(${wallet.address}): ${error.message}`);
    }
}

async function waitForMintStart() {
    const now = new Date();
    const mintTime = new Date(mintStartTime);
    const timeToWait = mintTime - now;

    if (timeToWait > 0) {
        log('INFO', `Waiting until mint starts at ${mintTime.toLocaleString()} WIB...`);
        await new Promise(resolve => setTimeout(resolve, timeToWait));
    }

    PRIVATE_KEYS.forEach((privateKey, index) => {
        const wallet = new ethers.Wallet(privateKey.trim(), provider);
        mintNFT(wallet, index);
    });
}

async function main() {
    await waitForMintStart();
}


main();