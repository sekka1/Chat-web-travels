#!/usr/bin/env npx tsx
/**
 * Road Trip Research Tool
 *
 * Researches things to do along a driving route from location A to location B by:
 * 1. Using Google Maps API to get the exact route and points of interest
 * 2. Generating targeted Google searches based on POIs found
 * 3. Scraping detailed information about each location
 *
 * Usage:
 *   npx tsx scripts/research-road-trip.ts <origin> <destination> [num-results] [output-dir] [categories]
 *
 * Examples:
 *   npx tsx scripts/research-road-trip.ts "San Francisco" "Los Angeles"
 *   npx tsx scripts/research-road-trip.ts "New York" "Miami" 5
 *   npx tsx scripts/research-road-trip.ts "Seattle" "Portland" 3 ./data/scraped/seattle-portland
 *   npx tsx scripts/research-road-trip.ts "Austin" "Houston" 3 ./data/scraped/austin-houston restaurants,local-food
 *
 * Output:
 *   - Creates category-specific subdirectories with scraped results
 *   - Each result contains content.md and images/ (if images are found)
 *   - Generates _road_trip_summary.md with overview of all research
 *
 * Prerequisites:
 *   npm install playwright
 *   npx playwright install chromium
 *   GOOGLE_MAPS_API_KEY environment variable must be set
 */

import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as https from 'node:https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  error_message?: string;
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
  place_id?: string;
}

interface PlacesResponse {
  results: Place[];
  status: string;
}

interface SearchQuery {
  category: string;
  query: string;
  outputDir: string;
  place?: Place;
}

interface CategoryResult {
  category: string;
  categoryDisplayName: string;
  queries: string[];
  totalResults: number;
  sources: SourceInfo[];
  poisFound?: number;
}

interface SourceInfo {
  title: string;
  path: string;
  hasImages: boolean;
  imageCount: number;
}

interface ResearchSummary {
  origin: string;
  destination: string;
  researchDate: string;
  routeInfo?: {
    distance: string;
    duration: string;
    summary: string;
  };
  categories: CategoryResult[];
  totalQueries: number;
  totalResults: number;
  totalImages: number;
  totalPOIs: number;
}

// ============================================================================
// Search Templates Configuration
// ============================================================================

/**
 * Maps categories to Google Maps place types for POI search
 */
const CATEGORY_TO_PLACE_TYPES: Record<string, { types: string[], radius: number }> = {
  'restaurants': { types: ['restaurant', 'cafe', 'bakery'], radius: 10000 },
  'local-food': { types: ['restaurant', 'meal_takeaway', 'food'], radius: 10000 },
  'points-of-interest': { types: ['tourist_attraction', 'point_of_interest'], radius: 15000 },
  'historical-sites': { types: ['museum', 'church', 'synagogue', 'hindu_temple'], radius: 20000 },
  'national-parks': { types: ['park', 'natural_feature', 'campground'], radius: 25000 },
  'local-experiences': { types: ['tourist_attraction', 'amusement_park', 'zoo', 'aquarium'], radius: 15000 },
};

/**
 * Fallback search query templates for route overview (doesn't use POIs)
 * {origin}, {destination}, and {route} are replaced with actual values.
 */
const ROUTE_OVERVIEW_TEMPLATES: string[] = [
  '{origin} to {destination} route',
  'cities between {origin} and {destination}',
  '{origin} to {destination} road trip guide',
];

/**
 * Display names for categories (for summary output)
 */
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  'route-overview': '🗺️ Route Overview',
  restaurants: '🍽️ Restaurants',
  'local-food': '🌮 Local Food',
  'points-of-interest': '📍 Points of Interest',
  'historical-sites': '🏛️ Historical Sites',
  'national-parks': '🏞️ National Parks',
  'local-experiences': '🎨 Local Experiences',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Converts a string to a URL-safe slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Makes an HTTPS GET request and returns the JSON response
 * @param url - The URL to fetch
 * @returns Promise resolving to the JSON response
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
 * Get driving directions from origin to destination using Google Maps API
 * @param origin - Starting location
 * @param destination - Ending location
 * @param apiKey - Google Maps API key
 * @returns Promise resolving to directions response
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
 * Search for places near a location using Google Maps Places API
 * @param location - Location to search near
 * @param type - Place type to search for
 * @param radius - Search radius in meters
 * @param apiKey - Google Maps API key
 * @returns Promise resolving to places response
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
 * Generate waypoints along the route for POI searching
 * @param route - Route leg from directions
 * @param intervalKm - Distance between waypoints in kilometers
 * @returns Array of location waypoints
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

/**
 * Prints usage information and exits
 */
function showUsage(): void {
  console.log(`
Road Trip Research Tool

Usage:
  npx tsx research-road-trip.ts <origin> <destination> [num-results] [output-dir] [categories]

Arguments:
  origin          (required) Starting location (city, state, or address)
  destination     (required) Ending location (city, state, or address)
  num-results     (optional) Number of results per search (default: 3)
  output-dir      (optional) Output directory (default: ./data/scraped/[origin]-to-[destination]-road-trip)
  categories      (optional) Comma-separated categories (default: all)

Available Categories:
  route-overview, restaurants, local-food, points-of-interest,
  historical-sites, national-parks, local-experiences

Environment Variables:
  GOOGLE_MAPS_API_KEY   (required) Google Maps API key for route and POI data

Examples:
  npx tsx research-road-trip.ts "San Francisco" "Los Angeles"
  npx tsx research-road-trip.ts "New York" "Miami" 5
  npx tsx research-road-trip.ts "Seattle" "Portland" 3 ./data/scraped/seattle-portland
  npx tsx research-road-trip.ts "Austin" "Houston" 3 ./data/scraped/austin-houston restaurants,local-food

Note:
  This skill now requires Google Maps API to get accurate route information
  and points of interest. Set GOOGLE_MAPS_API_KEY environment variable before running.
`);
  process.exit(1);
}

/**
 * Runs the Google search and scrape script
 */
async function runGoogleScraper(
  query: string,
  numResults: number,
  outputDir: string
): Promise<boolean> {
  return new Promise((resolve) => {
    const scriptPath = path.join(
      __dirname,
      '../../google-search-scraper/scripts/google-search-and-scrape.ts'
    );

    // Properly escape the query for shell execution
    const escapedQuery = query.replace(/"/g, '\\"');
    const args = [
      'tsx',
      scriptPath,
      `"${escapedQuery}"`,
      numResults.toString(),
      `"${outputDir}"`
    ];

    console.log(`\n🔍 Searching: "${query}"`);
    console.log(`   Output: ${outputDir}\n`);

    const child = spawn('npx', args, {
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        console.error(
          `\n⚠️  Search failed for "${query}" (exit code: ${code})\n`
        );
        resolve(false);
      }
    });

    child.on('error', (err) => {
      console.error(`\n❌ Error running search for "${query}":`, err.message);
      resolve(false);
    });
  });
}

/**
 * Scans a directory to collect information about scraped sources
 */
function scanSourcesInDirectory(categoryDir: string): SourceInfo[] {
  const sources: SourceInfo[] = [];

  if (!fs.existsSync(categoryDir)) {
    return sources;
  }

  const entries = fs.readdirSync(categoryDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const sourceDir = path.join(categoryDir, entry.name);
      const contentPath = path.join(sourceDir, 'content.md');
      const imagesDir = path.join(sourceDir, 'images');

      if (fs.existsSync(contentPath)) {
        let imageCount = 0;
        let hasImages = false;

        if (fs.existsSync(imagesDir)) {
          const imageFiles = fs
            .readdirSync(imagesDir)
            .filter(
              (f) =>
                !f.startsWith('_') &&
                /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
            );
          imageCount = imageFiles.length;
          hasImages = imageCount > 0;
        }

        // Extract title from directory name (remove numeric prefix)
        const title = entry.name.replace(/^\d+-/, '').replace(/-/g, ' ');

        sources.push({
          title:
            title.charAt(0).toUpperCase() + title.slice(1),
          path: path.relative(categoryDir, contentPath),
          hasImages,
          imageCount,
        });
      }
    }
  }

  return sources;
}

/**
 * Generates a road trip research summary markdown file
 * @param summary - Research summary data
 * @param outputDir - Output directory
 */
function generateSummary(
  summary: ResearchSummary,
  outputDir: string
): void {
  const lines: string[] = [];

  lines.push(`# Road Trip Research: ${summary.origin} to ${summary.destination}\n`);
  lines.push(`**Route:** ${summary.origin} → ${summary.destination}`);
  lines.push(`**Research Date:** ${summary.researchDate}`);

  if (summary.routeInfo) {
    lines.push(`**Distance:** ${summary.routeInfo.distance}`);
    lines.push(`**Duration:** ${summary.routeInfo.duration}`);
    lines.push(`**Route:** ${summary.routeInfo.summary}`);
  }

  lines.push(`**Categories Researched:** ${summary.categories.length}`);
  lines.push(`**Total POIs Found:** ${summary.totalPOIs}`);
  lines.push(`**Total Sources Scraped:** ${summary.totalResults}\n`);
  lines.push('---\n');

  lines.push('## Categories\n');

  for (const category of summary.categories) {
    const poisInfo = category.poisFound ? ` (${category.poisFound} POIs found)` : '';
    lines.push(
      `### ${category.categoryDisplayName} (${category.totalResults} sources${poisInfo})\n`
    );

    if (category.sources.length === 0) {
      lines.push('*No sources found*\n');
      continue;
    }

    for (let i = 0; i < category.sources.length; i++) {
      const source = category.sources[i];
      const imageInfo = source.hasImages
        ? ` (${source.imageCount} images)`
        : '';
      lines.push(
        `${i + 1}. [${source.title}](./${category.category}/${source.path})${imageInfo}`
      );
    }

    lines.push('');
  }

  lines.push('---\n');

  lines.push('## Research Statistics\n');
  lines.push(`- **Total POIs found:** ${summary.totalPOIs}`);
  lines.push(`- **Total queries performed:** ${summary.totalQueries}`);
  lines.push(`- **Sources scraped:** ${summary.totalResults}`);
  lines.push(`- **Images downloaded:** ${summary.totalImages}`);
  lines.push('');

  lines.push('---\n');
  lines.push('**Research powered by:**\n');
  lines.push('- 🗺️ Google Maps API (route and POI data)');
  lines.push('- 🔍 Google Search (detailed information)');
  lines.push('- 📰 Travel blogs and guides\n');

  const summaryPath = path.join(outputDir, '_road_trip_summary.md');
  fs.writeFileSync(summaryPath, lines.join('\n'), 'utf-8');

  console.log(`\n📄 Road trip summary saved to: ${summaryPath}\n`);
}

/**
 * Main research function
 * @param origin - Starting location
 * @param destination - Ending location
 * @param numResults - Number of results to scrape per search
 * @param outputBaseDir - Base output directory
 * @param selectedCategories - Categories to research
 * @param apiKey - Google Maps API key
 */
async function researchRoadTrip(
  origin: string,
  destination: string,
  numResults: number,
  outputBaseDir: string,
  selectedCategories: string[],
  apiKey: string
): Promise<void> {
  console.log('═'.repeat(70));
  console.log(`🚗 ROAD TRIP RESEARCH: ${origin} to ${destination}`);
  console.log('═'.repeat(70));
  console.log(`\n📊 Configuration:`);
  console.log(`   Origin: ${origin}`);
  console.log(`   Destination: ${destination}`);
  console.log(`   Results per search: ${numResults}`);
  console.log(`   Output directory: ${outputBaseDir}`);
  console.log(`   Categories: ${selectedCategories.join(', ')}\n`);

  // Create base output directory
  if (!fs.existsSync(outputBaseDir)) {
    fs.mkdirSync(outputBaseDir, { recursive: true });
  }

  // Step 1: Get route from Google Maps API
  console.log('═'.repeat(70));
  console.log('STEP 1: Get Route from Google Maps');
  console.log('═'.repeat(70));

  const directions = await getDirections(origin, destination, apiKey);
  const route = directions.routes[0];
  const leg = route.legs[0];

  console.log(`\n✅ Route found!`);
  console.log(`   Distance: ${leg.distance.text}`);
  console.log(`   Duration: ${leg.duration.text}`);
  console.log(`   Summary: ${route.summary}`);
  console.log(`   Steps: ${leg.steps.length} navigation steps\n`);

  // Step 2: Generate waypoints along the route
  console.log('═'.repeat(70));
  console.log('STEP 2: Generate Waypoints');
  console.log('═'.repeat(70));

  const waypoints = generateWaypoints(leg, 50); // Every 50km
  console.log(`\n✅ Generated ${waypoints.length} waypoints along the route\n`);

  // Step 3: Search for POIs along the route using Google Maps
  console.log('═'.repeat(70));
  console.log('STEP 3: Find Points of Interest');
  console.log('═'.repeat(70));

  const allPOIs: Map<string, Place[]> = new Map();
  let totalPOIs = 0;

  for (const category of selectedCategories) {
    // Skip route-overview as it doesn't use POIs
    if (category === 'route-overview') {
      continue;
    }

    const placeConfig = CATEGORY_TO_PLACE_TYPES[category];
    if (!placeConfig) {
      console.warn(`⚠️  No Google Maps configuration for category: ${category}`);
      continue;
    }

    console.log(`\n🔍 Searching for ${CATEGORY_DISPLAY_NAMES[category]}...`);
    const categoryPOIs: Place[] = [];

    // Sample waypoints to avoid too many API calls (every other waypoint)
    const sampleWaypoints = waypoints.filter((_, i) => i % 2 === 0);

    for (const placeType of placeConfig.types) {
      for (let i = 0; i < sampleWaypoints.length; i++) {
        const wp = sampleWaypoints[i];

        try {
          const places = await searchNearbyPlaces(wp, placeType, placeConfig.radius, apiKey);

          if (places.results.length > 0) {
            console.log(`   Waypoint ${i + 1}: Found ${places.results.length} ${placeType}(s)`);
            categoryPOIs.push(...places.results);
          }

          // Rate limiting: wait 200ms between requests
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`   ⚠️  Error searching near waypoint ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Deduplicate by name
    const uniquePOIs = Array.from(
      new Map(categoryPOIs.map(p => [p.name, p])).values()
    );

    allPOIs.set(category, uniquePOIs);
    totalPOIs += uniquePOIs.length;

    console.log(`   ✅ Total unique POIs: ${uniquePOIs.length}`);
  }

  // Step 4: Generate targeted searches based on POIs and scrape details
  console.log('\n' + '═'.repeat(70));
  console.log('STEP 4: Research POIs with Google Search');
  console.log('═'.repeat(70));

  const categoryResults: CategoryResult[] = [];
  let totalQueries = 0;
  let totalSuccesses = 0;

  // Process each category
  for (const category of selectedCategories) {
    console.log('\n' + '═'.repeat(70));
    console.log(`📂 Category: ${CATEGORY_DISPLAY_NAMES[category] || category}`);
    console.log('═'.repeat(70));

    const categoryDir = path.join(outputBaseDir, category);
    const queries: string[] = [];
    let poisFound = 0;

    // Handle route-overview differently (no POIs)
    if (category === 'route-overview') {
      // Use fallback templates for route overview
      for (const template of ROUTE_OVERVIEW_TEMPLATES) {
        const query = template
          .replace(/{origin}/g, origin)
          .replace(/{destination}/g, destination)
          .replace(/{route}/g, `${origin} to ${destination}`);

        queries.push(query);
        totalQueries++;

        const success = await runGoogleScraper(query, numResults, categoryDir);
        if (success) totalSuccesses++;

        // Add delay between searches
        console.log('⏳ Waiting 3 seconds before next search...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } else {
      // Generate targeted searches for each POI
      const pois = allPOIs.get(category) || [];
      poisFound = pois.length;

      if (pois.length === 0) {
        console.log('⚠️  No POIs found for this category, skipping searches\n');
      } else {
        // Limit to top N POIs to avoid too many searches
        const maxPOIsPerCategory = Math.min(10, Math.max(3, Math.floor(15 / selectedCategories.length)));
        const topPOIs = pois
          .filter(p => p.rating && p.rating >= 3.5) // Only well-rated places
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, maxPOIsPerCategory);

        console.log(`\n📍 Researching top ${topPOIs.length} POIs...\n`);

        for (const poi of topPOIs) {
          // Generate targeted query for this POI
          const location = poi.vicinity || poi.formatted_address || '';
          const query = `${poi.name} ${location} details reviews`;

          queries.push(query);
          totalQueries++;

          const success = await runGoogleScraper(query, numResults, categoryDir);
          if (success) totalSuccesses++;

          // Add delay between searches
          console.log('⏳ Waiting 3 seconds before next search...\n');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }

    // Collect source information
    const sources = scanSourcesInDirectory(categoryDir);

    categoryResults.push({
      category,
      categoryDisplayName: CATEGORY_DISPLAY_NAMES[category] || category,
      queries,
      totalResults: sources.length,
      sources,
      poisFound,
    });

    console.log(`\n✅ Category complete: ${sources.length} sources scraped\n`);
  }

  // Calculate total images
  const totalImages = categoryResults.reduce(
    (sum, cat) =>
      sum + cat.sources.reduce((s, src) => s + src.imageCount, 0),
    0
  );

  // Generate summary
  const summary: ResearchSummary = {
    origin,
    destination,
    researchDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    routeInfo: {
      distance: leg.distance.text,
      duration: leg.duration.text,
      summary: route.summary,
    },
    categories: categoryResults,
    totalQueries,
    totalResults: categoryResults.reduce(
      (sum, cat) => sum + cat.totalResults,
      0
    ),
    totalImages,
    totalPOIs,
  };

  generateSummary(summary, outputBaseDir);

  // Final report
  console.log('═'.repeat(70));
  console.log('✨ RESEARCH COMPLETE!');
  console.log('═'.repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   Route: ${origin} → ${destination}`);
  console.log(`   Distance: ${leg.distance.text}`);
  console.log(`   Duration: ${leg.duration.text}`);
  console.log(`   Categories researched: ${categoryResults.length}`);
  console.log(`   Total POIs found: ${totalPOIs}`);
  console.log(`   Total queries: ${totalQueries}`);
  console.log(`   Successful searches: ${totalSuccesses}`);
  console.log(`   Total sources scraped: ${summary.totalResults}`);
  console.log(`   Total images downloaded: ${totalImages}`);
  console.log(`   Output directory: ${outputBaseDir}\n`);
  console.log('═'.repeat(70));
}

// ============================================================================
// Main Script
// ============================================================================

async function main() {
  // Check for API key first
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('\n❌ Error: GOOGLE_MAPS_API_KEY environment variable is required\n');
    console.error('This skill now requires Google Maps API to get route information and POIs.\n');
    console.error('Please set the environment variable:');
    console.error('  export GOOGLE_MAPS_API_KEY="your-api-key"\n');
    console.error('For more information, see:');
    console.error('  .github/skills/road-trip-research/scripts/use-google-maps-secret.md\n');
    process.exit(1);
  }

  const args = process.argv.slice(2);

  if (args.length < 2 || args[0] === '--help' || args[0] === '-h') {
    showUsage();
  }

  const origin = args[0];
  const destination = args[1];
  const numResults = args[2] ? parseInt(args[2], 10) : 3;
  const originSlug = slugify(origin);
  const destinationSlug = slugify(destination);
  const outputBaseDir =
    args[3] || path.join('./data/scraped', `${originSlug}-to-${destinationSlug}-road-trip`);
  const categoriesArg = args[4];

  // Parse selected categories
  const allCategories = ['route-overview', ...Object.keys(CATEGORY_TO_PLACE_TYPES)];
  const selectedCategories = categoriesArg
    ? categoriesArg.split(',').map((c) => c.trim())
    : allCategories;

  // Validate categories
  const invalidCategories = selectedCategories.filter(
    (c) => !allCategories.includes(c)
  );
  if (invalidCategories.length > 0) {
    console.error(
      `\n❌ Invalid categories: ${invalidCategories.join(', ')}\n`
    );
    console.error(
      `Valid categories: ${allCategories.join(', ')}\n`
    );
    process.exit(1);
  }

  if (isNaN(numResults) || numResults < 1) {
    console.error('\n❌ num-results must be a positive number\n');
    process.exit(1);
  }

  try {
    await researchRoadTrip(
      origin,
      destination,
      numResults,
      outputBaseDir,
      selectedCategories,
      apiKey
    );
  } catch (error) {
    console.error('\n❌ Research failed:', error);
    process.exit(1);
  }
}

main();
