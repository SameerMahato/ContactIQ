#!/usr/bin/env node

/**
 * System Test Script
 * Tests all components of the ContactIQ application
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, url, data = null) {
  try {
    const config = { method, url: `${BASE_URL}${url}` };
    if (data) config.data = data;
    
    const response = await axios(config);
    log(`✓ ${name}: PASSED`, 'green');
    return { success: true, data: response.data };
  } catch (error) {
    log(`✗ ${name}: FAILED - ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n=== ContactIQ System Tests ===\n', 'yellow');
  
  // Test 1: Server Health
  log('Testing Server Endpoints...', 'yellow');
  await testEndpoint('GET /api/contacts', 'GET', '/api/contacts?limit=10');
  
  // Test 2: Analytics Segments
  log('\nTesting Analytics Endpoints...', 'yellow');
  const segmentsResult = await testEndpoint('GET /api/analytics/segments', 'GET', '/api/analytics/segments');
  
  if (segmentsResult.success) {
    const { totalContacts, segments, insights } = segmentsResult.data;
    log(`  - Total Contacts: ${totalContacts}`, 'green');
    log(`  - Industries: ${segments.byIndustry.length}`, 'green');
    log(`  - Locations: ${segments.byLocation.length}`, 'green');
    log(`  - Insights Generated: ${insights.length}`, 'green');
  }
  
  // Test 3: Analytics Campaigns
  const campaignsResult = await testEndpoint('GET /api/analytics/campaigns', 'GET', '/api/analytics/campaigns');
  
  if (campaignsResult.success) {
    const { totalCampaigns, campaigns } = campaignsResult.data;
    log(`  - Total Campaigns: ${totalCampaigns}`, 'green');
    if (campaigns.length > 0) {
      log(`  - Sample Campaign: ${campaigns[0].name}`, 'green');
    }
  }
  
  // Test 4: Chat Endpoint (requires GOOGLE_API_KEY)
  log('\nTesting Chat Endpoint...', 'yellow');
  const chatResult = await testEndpoint(
    'POST /api/chat/message',
    'POST',
    '/api/chat/message',
    { message: 'List all contacts', history: [] }
  );
  
  if (chatResult.success) {
    log(`  - Contacts Used: ${chatResult.data.contactsUsed}`, 'green');
    log(`  - Model Used: ${chatResult.data.modelUsed}`, 'green');
  }
  
  log('\n=== Test Summary ===\n', 'yellow');
  log('All critical endpoints tested!', 'green');
  log('\nTo test the full application:', 'yellow');
  log('1. Run: npm run dev', 'reset');
  log('2. Open: http://localhost:3000', 'reset');
  log('3. Import: test-sample.csv', 'reset');
  log('4. Click: 📊 Analytics button', 'reset');
}

// Check if server is running
axios.get(`${BASE_URL}/api/contacts`)
  .then(() => runTests())
  .catch(() => {
    log('\n✗ Server is not running!', 'red');
    log('\nPlease start the server first:', 'yellow');
    log('  npm run dev', 'reset');
    log('\nOr start just the backend:', 'yellow');
    log('  npm run server', 'reset');
    process.exit(1);
  });
