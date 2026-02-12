#!/usr/bin/env npx tsx
/**
 * Road Trip Research Tool
 *
 * Researches things to do along a driving route from location A to location B by
 * performing multiple targeted Google searches for different activity categories
 * and scraping the top results.
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
 */

import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Types
// ============================================================================

interface SearchQuery {
  category: string;
  query: string;
  outputDir: string;
}

interface CategoryResult {
  category: string;
  categoryDisplayName: string;
  queries: string[];
  totalResults: number;
  sources: SourceInfo[];
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
  categories: CategoryResult[];
  totalQueries: number;
  totalResults: number;
  totalImages: number;
}

// ============================================================================
// Search Templates Configuration
// ============================================================================

/**
 * Search query templates for different activity categories along a route.
 * {origin}, {destination}, and {route} are replaced with actual values.
 */
const SEARCH_TEMPLATES: Record<string, string[]> = {
  'route-overview': [
    '{origin} to {destination} route',
    'cities between {origin} and {destination}',
    '{origin} to {destination} road trip guide',
  ],
  restaurants: [
    'best restaurants along {origin} to {destination}',
    'famous restaurants {origin} to {destination}',
    'must-stop restaurants between {origin} and {destination}',
  ],
  'local-food': [
    'famous food {origin} to {destination}',
    'regional food along {origin} to {destination}',
    'local cuisine between {origin} and {destination}',
  ],
  'points-of-interest': [
    'roadside attractions {origin} to {destination}',
    'scenic stops along {origin} to {destination}',
    'points of interest between {origin} and {destination}',
  ],
  'historical-sites': [
    'historical sites along {origin} to {destination}',
    'historical landmarks between {origin} and {destination}',
    'museums along {origin} to {destination}',
  ],
  'national-parks': [
    'national parks near {origin} to {destination}',
    'state parks along {origin} to {destination}',
    'parks between {origin} and {destination}',
  ],
  'local-experiences': [
    'things to do {origin} to {destination}',
    'local experiences along {origin} to {destination}',
    'tours between {origin} and {destination}',
  ],
};

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

Examples:
  npx tsx research-road-trip.ts "San Francisco" "Los Angeles"
  npx tsx research-road-trip.ts "New York" "Miami" 5
  npx tsx research-road-trip.ts "Seattle" "Portland" 3 ./data/scraped/seattle-portland
  npx tsx research-road-trip.ts "Austin" "Houston" 3 ./data/scraped/austin-houston restaurants,local-food
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

    const args = [scriptPath, query, numResults.toString(), outputDir];

    console.log(`\n🔍 Searching: "${query}"`);
    console.log(`   Output: ${outputDir}\n`);

    const child = spawn('npx', ['tsx', ...args], {
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
 */
function generateSummary(
  summary: ResearchSummary,
  outputDir: string
): void {
  const lines: string[] = [];

  lines.push(`# Road Trip Research: ${summary.origin} to ${summary.destination}\n`);
  lines.push(`**Route:** ${summary.origin} → ${summary.destination}`);
  lines.push(`**Research Date:** ${summary.researchDate}`);
  lines.push(`**Categories Researched:** ${summary.categories.length}`);
  lines.push(`**Total Sources Scraped:** ${summary.totalResults}\n`);
  lines.push('---\n');

  lines.push('## Categories\n');

  for (const category of summary.categories) {
    lines.push(
      `### ${category.categoryDisplayName} (${category.totalResults} sources)\n`
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
  lines.push(`- **Total queries performed:** ${summary.totalQueries}`);
  lines.push(`- **Sources scraped:** ${summary.totalResults}`);
  lines.push(`- **Images downloaded:** ${summary.totalImages}`);
  lines.push('');

  lines.push('---\n');
  lines.push('**Research powered by:**\n');
  lines.push('- 🔍 Google Search (organic results only)');
  lines.push('- 📰 Travel blogs and route guides');
  lines.push('- 🗺️ Regional tourism sites\n');

  const summaryPath = path.join(outputDir, '_road_trip_summary.md');
  fs.writeFileSync(summaryPath, lines.join('\n'), 'utf-8');

  console.log(`\n📄 Road trip summary saved to: ${summaryPath}\n`);
}

/**
 * Main research function
 */
async function researchRoadTrip(
  origin: string,
  destination: string,
  numResults: number,
  outputBaseDir: string,
  selectedCategories: string[]
): Promise<void> {
  console.log('═'.repeat(70));
  console.log(`🚗 ROAD TRIP RESEARCH: ${origin} to ${destination}`);
  console.log('═'.repeat(70));
  console.log(`\n📊 Configuration:`);
  console.log(`   Origin: ${origin}`);
  console.log(`   Destination: ${destination}`);
  console.log(`   Results per search: ${numResults}`);
  console.log(`   Output directory: ${outputBaseDir}`);
  console.log(
    `   Categories: ${selectedCategories.length === Object.keys(SEARCH_TEMPLATES).length ? 'all' : selectedCategories.join(', ')}\n`
  );

  // Create base output directory
  if (!fs.existsSync(outputBaseDir)) {
    fs.mkdirSync(outputBaseDir, { recursive: true });
  }

  const categoryResults: CategoryResult[] = [];
  let totalQueries = 0;
  let totalSuccesses = 0;

  // Process each category
  for (const category of selectedCategories) {
    const templates = SEARCH_TEMPLATES[category];
    if (!templates) {
      console.warn(`⚠️  Unknown category: ${category}`);
      continue;
    }

    console.log('═'.repeat(70));
    console.log(
      `📂 Category: ${CATEGORY_DISPLAY_NAMES[category] || category}`
    );
    console.log('═'.repeat(70));

    const categoryDir = path.join(outputBaseDir, category);
    const queries: string[] = [];

    // Execute each search query for this category
    for (const template of templates) {
      const query = template
        .replace(/{origin}/g, origin)
        .replace(/{destination}/g, destination)
        .replace(/{route}/g, `${origin} to ${destination}`);

      queries.push(query);
      totalQueries++;

      const success = await runGoogleScraper(
        query,
        numResults,
        categoryDir
      );

      if (success) {
        totalSuccesses++;
      }

      // Add delay between searches to be respectful
      if (totalQueries < selectedCategories.length * templates.length) {
        console.log('⏳ Waiting 3 seconds before next search...\n');
        await new Promise((resolve) => setTimeout(resolve, 3000));
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
    });

    console.log(
      `\n✅ Category complete: ${sources.length} sources scraped\n`
    );
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
    categories: categoryResults,
    totalQueries,
    totalResults: categoryResults.reduce(
      (sum, cat) => sum + cat.totalResults,
      0
    ),
    totalImages,
  };

  generateSummary(summary, outputBaseDir);

  // Final report
  console.log('═'.repeat(70));
  console.log('✨ RESEARCH COMPLETE!');
  console.log('═'.repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   Route: ${origin} → ${destination}`);
  console.log(`   Categories researched: ${categoryResults.length}`);
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
  const allCategories = Object.keys(SEARCH_TEMPLATES);
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
      selectedCategories
    );
  } catch (error) {
    console.error('\n❌ Research failed:', error);
    process.exit(1);
  }
}

main();
