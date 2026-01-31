import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try loading from packages/sdk/.env, then root .env
const localEnvPath = path.resolve(__dirname, '../../.env');
const rootEnvPath = path.resolve(__dirname, '../../../../.env');

if (fs.existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
}

// Ensure private key has 0x prefix
let privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
if (privateKey && !privateKey.startsWith('0x')) {
    privateKey = `0x${privateKey}`;
}

export const config = {
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8080/api/v1',
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'https://rpc.tau.gateway.fm',
    chainId: parseInt(process.env.BLOCKCHAIN_CHAIN_ID || '737998412'),
    paymentTokenAddress: process.env.BLOCKCHAIN_PAYMENT_TOKEN_ADDRESS || '0xCe06F92A73e888a7eb8885Bf4741eF4E5490f8Fb',
    privateKey: privateKey as `0x${string}`,
    network: `eip155:${process.env.BLOCKCHAIN_CHAIN_ID || '737998412'}`,
};

if (!config.privateKey) {
    console.warn('WARNING: BLOCKCHAIN_PRIVATE_KEY is not set. Token funding will fail.');
}
