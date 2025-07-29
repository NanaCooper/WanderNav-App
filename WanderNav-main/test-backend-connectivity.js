const axios = require('axios');

const API_BASE_URL = 'http://10.33.249.250:8080';

async function testBackendConnectivity() {
  console.log('🔗 Testing backend connectivity...');
  
  try {
    // Test basic connectivity
    const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ Backend is accessible');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Backend connectivity failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔧 Backend server is not running. Please start the Spring Boot application.');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🔧 Cannot resolve hostname. Check the API_BASE_URL configuration.');
    } else if (error.response) {
      console.error('🔧 Backend responded with error:', error.response.status, error.response.data);
    }
  }
}

testBackendConnectivity(); 