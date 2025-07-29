// test-comprehensive.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:8080';

// Test results storage
const testResults = {
  backend: {},
  frontend: {},
  connectivity: {},
  errors: []
};

// Utility functions
const log = (message, data = null) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

const logError = (message, error) => {
  console.error(`❌ ${message}:`, error.message);
  testResults.errors.push({ message, error: error.message });
};

const logSuccess = (message) => {
  console.log(`✅ ${message}`);
};

// Backend tests
const testBackend = async () => {
  log('🔧 Testing Backend...');
  
  try {
    // Test server connectivity
    const healthResponse = await axios.get(`${API_BASE_URL}/actuator/health`);
    testResults.backend.health = healthResponse.status === 200;
    logSuccess('Backend health check passed');
  } catch (error) {
    logError('Backend health check failed', error);
    testResults.backend.health = false;
  }

  // Test API endpoints
  const endpoints = [
    { path: '/api/auth/register', method: 'POST', data: { username: 'testuser', password: 'testpass', email: 'test@example.com' } },
    { path: '/api/auth/login', method: 'POST', data: { username: 'testuser', password: 'testpass' } },
    { path: '/api/users', method: 'GET' },
    { path: '/api/users/search?query=test', method: 'GET' },
    { path: '/api/groups', method: 'GET' },
    { path: '/api/hazards', method: 'GET' },
    { path: '/api/locations', method: 'GET' },
    { path: '/api/routes', method: 'GET' },
    { path: '/api/destinations', method: 'GET' },
    { path: '/api/weather?latitude=40.7128&longitude=-74.0060', method: 'GET' },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${API_BASE_URL}${endpoint.path}`,
        data: endpoint.data,
        timeout: 5000
      });
      testResults.backend[endpoint.path] = response.status >= 200 && response.status < 300;
      logSuccess(`${endpoint.method} ${endpoint.path} - ${response.status}`);
    } catch (error) {
      logError(`${endpoint.method} ${endpoint.path} failed`, error);
      testResults.backend[endpoint.path] = false;
    }
  }
};

// Frontend file structure tests
const testFrontend = () => {
  log('📱 Testing Frontend Structure...');
  
  const requiredFiles = [
    'app.json',
    'package.json',
    'tsconfig.json',
    'app/index.tsx',
    'app/home.tsx',
    'app/dashcam.tsx',
    'app/searchScreen.tsx',
    'app/mapScreen.tsx',
    'src/services/api.ts',
    'src/services/auth.ts',
    'contexts/ThemeContext.tsx',
    'constants/theme.ts',
    'components/ErrorBoundary.tsx',
    'utils/logger.ts',
    'utils/responsive.ts'
  ];

  const basePath = path.join(__dirname, 'client', 'WanderNav');
  
  for (const file of requiredFiles) {
    const filePath = path.join(basePath, file);
    if (fs.existsSync(filePath)) {
      testResults.frontend[file] = true;
      logSuccess(`File exists: ${file}`);
    } else {
      testResults.frontend[file] = false;
      logError(`File missing: ${file}`);
    }
  }

  // Check for console.log statements (should be minimal in production)
  const scanForConsoleLogs = (dir) => {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    let consoleLogCount = 0;
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        consoleLogCount += scanForConsoleLogs(fullPath);
      } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const matches = content.match(/console\.log/g);
          if (matches) {
            consoleLogCount += matches.length;
          }
        } catch (error) {
          // Ignore read errors
        }
      }
    }
    return consoleLogCount;
  };

  const consoleLogCount = scanForConsoleLogs(basePath);
  testResults.frontend.consoleLogs = consoleLogCount;
  log(`Found ${consoleLogCount} console.log statements (should be minimal)`);
};

// Configuration tests
const testConfiguration = () => {
  log('⚙️ Testing Configuration...');
  
  try {
    // Test app.json
    const appJsonPath = path.join(__dirname, 'client', 'WanderNav', 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    // Check for required permissions
    const hasCameraPlugin = appJson.expo.plugins.some(p => 
      typeof p === 'object' && p[0] === 'expo-camera'
    );
    const hasLocationPlugin = appJson.expo.plugins.some(p => 
      typeof p === 'object' && p[0] === 'expo-location'
    );
    const hasMediaLibraryPlugin = appJson.expo.plugins.some(p => 
      typeof p === 'object' && p[0] === 'expo-media-library'
    );

    testResults.configuration = {
      appJson: true,
      cameraPlugin: hasCameraPlugin,
      locationPlugin: hasLocationPlugin,
      mediaLibraryPlugin: hasMediaLibraryPlugin
    };

    logSuccess('app.json configuration valid');
    if (hasCameraPlugin) logSuccess('Camera plugin configured');
    if (hasLocationPlugin) logSuccess('Location plugin configured');
    if (hasMediaLibraryPlugin) logSuccess('Media library plugin configured');
  } catch (error) {
    logError('Configuration test failed', error);
    testResults.configuration = { error: error.message };
  }
};

// Generate comprehensive report
const generateReport = () => {
  log('📊 Generating Comprehensive Report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      backendTests: Object.values(testResults.backend).filter(Boolean).length,
      frontendTests: Object.values(testResults.frontend).filter(Boolean).length,
      totalErrors: testResults.errors.length
    },
    details: testResults,
    recommendations: []
  };

  // Generate recommendations
  if (testResults.errors.length > 0) {
    report.recommendations.push('Fix the errors listed above before deployment');
  }

  if (testResults.frontend.consoleLogs > 10) {
    report.recommendations.push('Remove excessive console.log statements for production');
  }

  if (!testResults.backend.health) {
    report.recommendations.push('Ensure backend server is running on port 8080');
  }

  if (!testResults.configuration?.cameraPlugin) {
    report.recommendations.push('Add camera plugin configuration to app.json');
  }

  // Save report
  const reportPath = path.join(__dirname, 'audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📋 COMPREHENSIVE AUDIT REPORT');
  console.log('================================');
  console.log(`✅ Backend Tests Passed: ${report.summary.backendTests}`);
  console.log(`✅ Frontend Tests Passed: ${report.summary.frontendTests}`);
  console.log(`❌ Total Errors: ${report.summary.totalErrors}`);
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => console.log(`  • ${rec}`));
  }
  
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  
  return report;
};

// Main test execution
const runTests = async () => {
  console.log('🚀 Starting Comprehensive Project Audit...\n');
  
  try {
    await testBackend();
    console.log('');
    testFrontend();
    console.log('');
    testConfiguration();
    console.log('');
    generateReport();
  } catch (error) {
    logError('Test execution failed', error);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, testResults }; 