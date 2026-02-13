#!/usr/bin/env npx tsx
/**
 * Google Maps API Road Trip Research Test
 *
 * This script tests using Google Maps APIs to:
 * 1. Get the driving route from origin to destination
 * 2. Find points of interest along the route
 * 3. Get details about restaurants, attractions, etc.
 *
 * Usage:
 *   GOOGLE_MAPS_API_KEY=your-key npx tsx test-google-maps-api.ts <origin> <destination>
 *
 * Example:
 *   GOOGLE_MAPS_API_KEY=your-key npx tsx test-google-maps-api.ts "Portland, OR" "Seattle, WA"
 *
 * Prerequisites:
 *   - Google Maps API key with the following APIs enabled:
 *     * Directions API
 *     * Places API (New)
 *   - npm install (to get dependencies)
 *
 * API Documentation References:
 *   This implementation uses the following Google Maps Platform APIs:
 *
 *   1. Directions API (REST)
 *      - Overview: https://developers.google.com/maps/documentation/directions/overview
 *      - Get Directions: https://developers.google.com/maps/documentation/directions/get-directions
 *      - Reference: https://developers.google.com/maps/documentation/directions/reference/rest
 *      - Used in: getDirections() function (line ~112)
 *      - Endpoint: https://maps.googleapis.com/maps/api/directions/json
 *
 *   2. Places API - Nearby Search (REST)
 *      - Overview: https://developers.google.com/maps/documentation/places/web-service/overview
 *      - Nearby Search: https://developers.google.com/maps/documentation/places/web-service/search-nearby
 *      - Place Types: https://developers.google.com/maps/documentation/places/web-service/supported_types
 *      - Reference: https://developers.google.com/maps/documentation/places/web-service/search
 *      - Used in: searchNearbyPlaces() function (line ~140)
 *      - Endpoint: https://maps.googleapis.com/maps/api/place/nearbysearch/json
 *
 *   General Resources:
 *   - Google Maps Platform Documentation: https://developers.google.com/maps/documentation
 *   - JavaScript API (for reference): https://developers.google.com/maps/documentation/javascript
 *   - API Key Best Practices: https://developers.google.com/maps/api-security-best-practices
 *   - Pricing Calculator: https://mapsplatform.google.com/pricing/
 *
 *   Note: This implementation uses the REST APIs (not the JavaScript client library)
 *         for server-side integration without browser dependencies.
 */

import https from 'https';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ============================================================================
// Types
// ============================================================================

interface Location {
  lat: number;
  lng: number;
}

interface RouteStep {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  start_location: Location;
  end_location: Location;
  html_instructions: string;
}

interface RouteLeg {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  start_address: string;
  end_address: string;
  start_location: Location;
  end_location: Location;
  steps: RouteStep[];
}

interface DirectionsResponse {
  routes: Array<{
    legs: RouteLeg[];
    overview_polyline: { points: string };
    summary: string;
  }>;
  status: string;
}

interface Place {
  name: string;
  formatted_address?: string;
  rating?: number;
  types?: string[];
  geometry?: {
    location: Location;
  };
  vicinity?: string;
}

interface PlacesResponse {
  results: Place[];
  status: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Makes an HTTPS GET request and returns the JSON response
 */
function httpsGet(url: string): Promise<any> {
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
 * Get driving directions from origin to destination
 */
async function getDirections(
  origin: string,
  destination: string,
  apiKey: string
): Promise<DirectionsResponse> {
  const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';
  const params = new URLSearchParams({
    origin,
    destination,
    mode: 'driving',
    key: apiKey,
  });

  const url = `${baseUrl}?${params.toString()}`;
  console.log(`\n🗺️  Fetching route from "${origin}" to "${destination}"...`);

  const response = await httpsGet(url);

  if (response.status !== 'OK') {
    throw new Error(`Directions API error: ${response.status} - ${response.error_message || 'Unknown error'}`);
  }

  return response;
}

/**
 * Search for places near a location
 */
async function searchNearbyPlaces(
  location: Location,
  type: string,
  radius: number,
  apiKey: string
): Promise<PlacesResponse> {
  const baseUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
  const params = new URLSearchParams({
    location: `${location.lat},${location.lng}`,
    radius: radius.toString(),
    type,
    key: apiKey,
  });

  const url = `${baseUrl}?${params.toString()}`;

  const response = await httpsGet(url);

  if (response.status !== 'OK' && response.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API error: ${response.status}`);
  }

  return response;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Generate waypoints along the route
 */
function generateWaypoints(route: RouteLeg, intervalKm: number = 50): Location[] {
  const waypoints: Location[] = [];

  // Add start location
  waypoints.push(route.start_location);

  // Sample points from route steps
  let cumulativeDistance = 0;
  for (const step of route.steps) {
    cumulativeDistance += step.distance.value / 1000; // Convert to km

    if (cumulativeDistance >= intervalKm) {
      waypoints.push(step.end_location);
      cumulativeDistance = 0;
    }
  }

  // Add end location
  waypoints.push(route.end_location);

  return waypoints;
}

// ============================================================================
// Main Function
// ============================================================================

async function main(): Promise<void> {
  // Check for API key
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: GOOGLE_MAPS_API_KEY environment variable is required');
    console.error('\nUsage:');
    console.error('  GOOGLE_MAPS_API_KEY=your-key npx tsx test-google-maps-api.ts <origin> <destination>');
    console.error('\nExample:');
    console.error('  GOOGLE_MAPS_API_KEY=your-key npx tsx test-google-maps-api.ts "Portland, OR" "Seattle, WA"');
    process.exit(1);
  }

  // Parse arguments
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('❌ Error: Origin and destination are required');
    console.error('\nUsage:');
    console.error('  GOOGLE_MAPS_API_KEY=your-key npx tsx test-google-maps-api.ts <origin> <destination>');
    process.exit(1);
  }

  const origin = args[0];
  const destination = args[1];

  console.log('═'.repeat(70));
  console.log('🚗 GOOGLE MAPS API ROAD TRIP TEST');
  console.log('═'.repeat(70));
  console.log(`\nRoute: ${origin} → ${destination}\n`);

  try {
    // Step 1: Get driving directions
    console.log('═'.repeat(70));
    console.log('STEP 1: Get Driving Route');
    console.log('═'.repeat(70));

    const directions = await getDirections(origin, destination, apiKey);
    const route = directions.routes[0];
    const leg = route.legs[0];

    console.log(`\n✅ Route found!`);
    console.log(`   Distance: ${leg.distance.text}`);
    console.log(`   Duration: ${leg.duration.text}`);
    console.log(`   Summary: ${route.summary}`);
    console.log(`   Steps: ${leg.steps.length} steps\n`);

    // Step 2: Generate waypoints along the route
    console.log('═'.repeat(70));
    console.log('STEP 2: Generate Waypoints');
    console.log('═'.repeat(70));

    const waypoints = generateWaypoints(leg, 50); // Every 50km
    console.log(`\n✅ Generated ${waypoints.length} waypoints along the route\n`);

    waypoints.forEach((wp, index) => {
      console.log(`   ${index + 1}. Lat: ${wp.lat.toFixed(4)}, Lng: ${wp.lng.toFixed(4)}`);
    });

    // Step 3: Search for points of interest near waypoints
    console.log('\n' + '═'.repeat(70));
    console.log('STEP 3: Search for Points of Interest');
    console.log('═'.repeat(70));

    const searchTypes = [
      { type: 'restaurant', name: 'Restaurants', radius: 10000 }, // 10km
      { type: 'tourist_attraction', name: 'Tourist Attractions', radius: 15000 }, // 15km
      { type: 'park', name: 'Parks', radius: 20000 }, // 20km
    ];

    const allPlaces: { [key: string]: Place[] } = {};

    for (const searchType of searchTypes) {
      console.log(`\n🔍 Searching for ${searchType.name}...`);
      allPlaces[searchType.type] = [];

      // Search near a sample of waypoints (to avoid too many API calls)
      const sampleWaypoints = waypoints.filter((_, i) => i % 2 === 0); // Every other waypoint

      for (let i = 0; i < sampleWaypoints.length; i++) {
        const wp = sampleWaypoints[i];

        try {
          const places = await searchNearbyPlaces(wp, searchType.type, searchType.radius, apiKey);

          if (places.results.length > 0) {
            console.log(`   Waypoint ${i + 1}: Found ${places.results.length} ${searchType.name.toLowerCase()}`);
            allPlaces[searchType.type].push(...places.results);
          }

          // Rate limiting: wait 200ms between requests
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`   ⚠️  Error searching near waypoint ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Deduplicate by name
      const uniquePlaces = Array.from(
        new Map(allPlaces[searchType.type].map(p => [p.name, p])).values()
      );
      allPlaces[searchType.type] = uniquePlaces;

      console.log(`   ✅ Total unique ${searchType.name.toLowerCase()}: ${uniquePlaces.length}`);
    }

    // Step 4: Display results
    console.log('\n' + '═'.repeat(70));
    console.log('STEP 4: Results Summary');
    console.log('═'.repeat(70));

    for (const searchType of searchTypes) {
      const places = allPlaces[searchType.type];
      console.log(`\n📍 ${searchType.name} (${places.length} found):\n`);

      // Show top 10
      places.slice(0, 10).forEach((place, index) => {
        const rating = place.rating ? ` ⭐ ${place.rating}` : '';
        const address = place.vicinity || place.formatted_address || 'Address not available';
        console.log(`   ${index + 1}. ${place.name}${rating}`);
        console.log(`      ${address}`);
      });

      if (places.length > 10) {
        console.log(`      ... and ${places.length - 10} more`);
      }
    }

    // Step 5: Save results to file
    console.log('\n' + '═'.repeat(70));
    console.log('STEP 5: Save Results');
    console.log('═'.repeat(70));

    const output = {
      route: {
        origin: leg.start_address,
        destination: leg.end_address,
        distance: leg.distance,
        duration: leg.duration,
        summary: route.summary,
      },
      waypoints: waypoints.length,
      pointsOfInterest: Object.entries(allPlaces).map(([type, places]) => ({
        type,
        count: places.length,
        places: places.slice(0, 20).map(p => ({
          name: p.name,
          rating: p.rating,
          address: p.vicinity || p.formatted_address,
          location: p.geometry?.location,
        })),
      })),
      timestamp: new Date().toISOString(),
    };

    const outputPath = path.join(process.cwd(), 'google-maps-test-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

    console.log(`\n✅ Results saved to: ${outputPath}`);

    // Final summary
    console.log('\n' + '═'.repeat(70));
    console.log('✨ TEST COMPLETE');
    console.log('═'.repeat(70));
    console.log('\n📊 Summary:');
    console.log(`   Route: ${leg.distance.text}, ${leg.duration.text}`);
    console.log(`   Waypoints: ${waypoints.length}`);
    console.log(`   Total POIs found: ${Object.values(allPlaces).reduce((sum, places) => sum + places.length, 0)}`);
    console.log(`   - Restaurants: ${allPlaces.restaurant?.length || 0}`);
    console.log(`   - Tourist Attractions: ${allPlaces.tourist_attraction?.length || 0}`);
    console.log(`   - Parks: ${allPlaces.park?.length || 0}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

main();
