const axios = require('axios');

const FARMER_NAME = 'poor farmer'; 
let client_id = '';
let client_secret = '';
let access_token = '';
let token_expiry = Date.now();

const BASE_URL = 'https://happyharvest.fun';

// 1. Register farmer
async function registerFarmer() {
  try {
    const res = await axios.post(`${BASE_URL}/register`, {
      playername: FARMER_NAME
    });
    client_id = res.data.client_id;
    client_secret = res.data.client_secret;
    console.log('✅ Registered:', res.data);
  } catch (err) {
    console.error('❌ Registration failed:', err.response?.data || err.message);
  }
}

// 2. Get JWT token
async function getToken() {
  try {
    const res = await axios.post(`${BASE_URL}/auth/token`, {
      client_id,
      client_secret,
      grant_type: 'client_credentials'
    });
    access_token = res.data.access_token;
    token_expiry = Date.now() + (res.data.expires_in - 30) * 1000; // refresh 30 sec before expiry
    console.log('🔑 Token acquired');
  } catch (err) {
    console.error('❌ Token error:', err.response?.data || err.message);
  }
}

// 3. Collect water
async function collectWater() {
  try {
    const res = await axios.post(`${BASE_URL}/collect`, {}, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });
    console.log(`💧 ${res.data.message} | Score: ${res.data.score} | Time: ${res.data.timestamp}`);
  } catch (err) {
    if (err.response?.status === 401) {
      console.warn('⚠️ Token expired, refreshing...');
      await getToken();
    } else {
      console.error('❌ Collect error:', err.response?.data || err.message);
    }
  }
}

// 4. Main loop
async function main() {
  await registerFarmer();
  await getToken();

  // Refresh token every 5 min
  setInterval(async () => {
    if (Date.now() > token_expiry) {
      await getToken();
    }
  }, 30 * 1000); // check every 30 sec

  // Collect every 60 sec
  setInterval(async () => {
    await collectWater();
  }, 60 * 1000); // call every 60 seconds
}

main();
