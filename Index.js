const axios = require('axios');
const colors = require('colors');
const moment = require('moment-timezone');
require('dotenv').config();
const { AUTH_TOKEN_1, AUTH_TOKEN_2, AUTH_TOKEN_3, AUTH_TOKEN_4} = process.env;

// Payload untuk tiga akun
const tokens = [
    { name: "0x5b53", initData: AUTH_TOKEN_1 },
    { name: "0x2", initData: AUTH_TOKEN_2 },
    { name: "0x3", initData: AUTH_TOKEN_3 },
    { name: "0x5", initData: AUTH_TOKEN_4 }
];

// Function to get Bearer token
async function getBearerToken(payload) {
    const API_URL = 'https://moon.popp.club/pass/login';

    try {
        const response = await axios.post(API_URL, payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const token = response.data.data.token;
        return token;
    } catch (error) {
        console.error('Error fetching the bearer token:', error);
        throw error;
    }
}

// Function to process the claim request
async function fetchData(token) {
    try {
        const response = await axios.get('https://moon.popp.club/moon/claim/farming', {
            headers: {
                'Authorization': token
            }
        });
        const message = response.data.msg;
        return message;
    } catch (error) {
        console.error('Claim Farming:', error);
        return null;
    }
}

// Function to fetch farming data
async function fetchFarmingData(token) {
    try {
        const response = await axios.get('https://moon.popp.club/moon/farming', {
            headers: {
                'Authorization': token
            }
        });
        const message = response.data.msg;
        return message;
    } catch (error) {
        console.error('Start Farming:', error);
        return null;
    }
}

// Function to fetch asset data
async function fetchAssetData(token) {
    try {
        const response = await axios.get('https://moon.popp.club/moon/asset', {
            headers: {
                'Authorization': token
            }
        });
        const message = response.data.data.sd;
        return message;
    } catch (error) {
        console.error('Fetch Asset Data:', error);
        return null;
    }
}

// Function to log the current time
function logCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const currentTime = `Current Time: ${hours}:${minutes}:${seconds}`;
    return currentTime;
}

// Function to fetch asset data and check conditions for the account
async function fetchAssetPerMinute(token, name) {
    try {
        const response = await axios.get('https://moon.popp.club/moon/asset', {
            headers: {
                'Authorization': token
            }
        });
        if (response.data.data.farmingEndTime === 0) {
            console.log(`=====================\nExecuting for ${name}`);
            console.log(`Farming has ended for ${name}!`.red);
            console.log(logCurrentTime().yellow);

            const claimMessage = await fetchData(token);
            if (claimMessage) {
                console.log('Claim Farming:', claimMessage.green);
            }

            const farmingMessage = await fetchFarmingData(token);
            if (farmingMessage) {
                console.log('Start Farming:', farmingMessage.green);
            }

            const assetMessage = await fetchAssetData(token);
            if (assetMessage) {
                console.log('Asset Amount (SD):', assetMessage);
            }
            console.log('=====================\n');
        }
    } catch (error) {
        console.error('Fetch Asset Per Minute:', error);
    }
}

// Function to run the fetchAssetPerMinute function continuously every 5 seconds
async function runContinuously() {
    const tokenMap = new Map();

    for (const { name, initData } of tokens) {
        try {
            const token = await getBearerToken({ initData });
            tokenMap.set(name, token);
        } catch (error) {
            console.error(`Error fetching token for ${name}:`, error);
        }
    }

    const startTime = moment().tz('Asia/Jakarta');

    let intervalId = setInterval(async () => {
        const now = moment().tz('Asia/Jakarta');
        const elapsedHours = now.diff(startTime, 'hours', true); 

        if (elapsedHours >= 5) {
            clearInterval(intervalId);
            console.log('Stopped running after 5 hours.');
            return;
        }

        for (const [name, token] of tokenMap.entries()) {
            await fetchAssetPerMinute(token, name);
        }
    }, 5 * 1000);
}

// Start the continuous run
runContinuously();
