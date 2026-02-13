#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Integration test for Google Maps API Key
 * This script tests that the GOOGLE_MAPS_API_KEY environment variable is set
 * and that the API key is valid and can authenticate with Google Maps API.
 *
 * Requirements:
 * - GOOGLE_MAPS_API_KEY environment variable set
 * - Google Maps Geocoding API enabled on the API key
 *
 * Usage:
 *   npm run test:integration:google-maps
 *
 * This test will:
 * 1. Check that GOOGLE_MAPS_API_KEY is set
 * 2. Make a minimal Geocoding API request to validate authentication
 * 3. Verify the API key works and has proper permissions
 *
 * Note: This test uses the Geocoding API which has minimal cost (negligible for a single request).
 * It does NOT call expensive APIs like Directions or Places to avoid costs.
 */

import https from 'https';

/**
 * Makes an HTTPS GET request and returns the JSON response
 * @param {string} url - The URL to fetch
 * @returns {Promise<any>} JSON response
 */
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Tests the Google Maps API key using a minimal Geocoding API request
 * @param {string} apiKey - The Google Maps API key
 * @returns {Promise<object>} Response from the Geocoding API
 */
async function testGoogleMapsApiKey(apiKey) {
  const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
  // Use a simple, well-known address to minimize cost
  const params = new URLSearchParams({
    address: 'New York, NY',
    key: apiKey,
  });

  const url = `${baseUrl}?${params.toString()}`;
  
  console.log('   Making Geocoding API request...');
  const response = await httpsGet(url);
  
  return response;
}

/**
 * Main integration test function
 */
async function runIntegrationTest() {
  console.log('═'.repeat(70));
  console.log('🗺️  GOOGLE MAPS API KEY INTEGRATION TEST');
  console.log('═'.repeat(70));
  console.log('');

  try {
    // Step 1: Check for API key
    console.log('1. Checking for GOOGLE_MAPS_API_KEY environment variable...');
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error(
        'GOOGLE_MAPS_API_KEY environment variable is not set.\n' +
        'To set up:\n' +
        '  1. Get a Google Maps API key from https://console.cloud.google.com/\n' +
        '  2. Enable the Geocoding API\n' +
        '  3. Add the key as a repository secret: GOOGLE_MAPS_API_KEY\n' +
        '  4. For local testing: export GOOGLE_MAPS_API_KEY=your-key-here'
      );
    }
    
    if (apiKey.trim() === '') {
      throw new Error('GOOGLE_MAPS_API_KEY is set but empty');
    }
    
    // Mask the API key for security
    const maskedKey = apiKey.substring(0, 4) + '***' + apiKey.substring(apiKey.length - 4);
    console.log(`   ✓ API key found: ${maskedKey}`);
    console.log(`   ✓ Key length: ${apiKey.length} characters\n`);

    // Step 2: Test authentication with Google Maps API
    console.log('2. Testing authentication with Google Maps Geocoding API...');
    console.log('   (Using minimal Geocoding request to avoid costs)');
    
    const response = await testGoogleMapsApiKey(apiKey);
    
    // Step 3: Validate response
    console.log('\n3. Validating API response...');
    
    if (!response.status) {
      throw new Error('API response missing status field');
    }
    
    console.log(`   Status: ${response.status}`);
    
    // Check for common error statuses
    if (response.status === 'REQUEST_DENIED') {
      const errorMessage = response.error_message || 'No error message provided';
      throw new Error(
        `API key authentication failed: ${errorMessage}\n` +
        'Common causes:\n' +
        '  - API key is invalid or disabled\n' +
        '  - Geocoding API is not enabled for this key\n' +
        '  - API key has restrictions that block this request\n' +
        'To fix:\n' +
        '  1. Go to https://console.cloud.google.com/apis/credentials\n' +
        '  2. Verify the API key is enabled\n' +
        '  3. Enable the Geocoding API at https://console.cloud.google.com/apis/library\n' +
        '  4. Check API key restrictions'
      );
    }
    
    if (response.status === 'INVALID_REQUEST') {
      throw new Error('Invalid request format - this is a bug in the test');
    }
    
    if (response.status === 'UNKNOWN_ERROR') {
      throw new Error('Google Maps API returned an unknown error - try again later');
    }
    
    if (response.status === 'OVER_QUERY_LIMIT') {
      throw new Error('API quota exceeded - check your usage limits');
    }
    
    if (response.status !== 'OK' && response.status !== 'ZERO_RESULTS') {
      throw new Error(`Unexpected API status: ${response.status}`);
    }
    
    // For a successful test, we expect either OK (found results) or ZERO_RESULTS (valid but no results)
    if (response.status === 'OK') {
      console.log('   ✓ Authentication successful');
      console.log('   ✓ API key is valid and has proper permissions');
      
      if (response.results && response.results.length > 0) {
        const result = response.results[0];
        console.log(`   ✓ Sample result: ${result.formatted_address || 'Address not available'}`);
      }
    } else if (response.status === 'ZERO_RESULTS') {
      console.log('   ✓ Authentication successful (no results found, but key is valid)');
    }

    console.log('');
    console.log('═'.repeat(70));
    console.log('✨ INTEGRATION TEST PASSED');
    console.log('═'.repeat(70));
    console.log('');
    console.log('✓ GOOGLE_MAPS_API_KEY is set and accessible');
    console.log('✓ API key successfully authenticated with Google Maps API');
    console.log('✓ API key has proper permissions for Geocoding API');
    console.log('');
    console.log('Next steps:');
    console.log('  - Use the API key in road-trip-research skill');
    console.log('  - Run: npx tsx .github/skills/road-trip-research/scripts/test-google-maps-api.ts');
    console.log('');
    
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('═'.repeat(70));
    console.error('❌ INTEGRATION TEST FAILED');
    console.error('═'.repeat(70));
    console.error('');
    
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('Unexpected error:', error);
    }
    
    console.error('');
    process.exit(1);
  }
}

// Run the integration test
runIntegrationTest().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
