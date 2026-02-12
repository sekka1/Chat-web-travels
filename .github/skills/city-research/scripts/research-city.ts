#!/usr/bin/env npx tsx
/**
 * City Research Tool
 *
 * Researches things to do in a city by performing multiple targeted Google searches
 * for different activity categories and scraping the top results.
 *
 * Usage:
 *   npx tsx scripts/research-city.ts <city-name> [num-results] [output-dir] [categories]
 *
 * Examples:
 *   npx tsx scripts/research-city.ts "Mexico City"
 *   npx tsx scripts/research-city.ts "Paris" 5
 *   npx tsx scripts/research-city.ts "Tokyo" 3 ./data/destinations/tokyo
 *   npx tsx scripts/research-city.ts "New York" 3 ./data/scraped/nyc museums,restaurants,bars
 *
 * Output:
 *   - Creates category-specific subdirectories with scraped results
 *   - Each result contains content.md and images/ (if images are found)
 *   - Generates _research_summary.md with overview of all research
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
  cityName: string;
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
 * Search query templates for different activity categories.
 * {city} is replaced with the actual city name.
 */
const SEARCH_TEMPLATES: Record<string, string[]> = {
  museums: [
    'best museums in {city}',
    'lonely planet museums {city}',
  ],
  restaurants: [
    'best restaurants in {city}',
    'eater {city}',
  ],
  'local-food': [
    'famous food in {city}',
    '{city} local dishes eater',
  ],
  'tourist-attractions': [
    'lonely planet things to do in {city}',
    'top tourist attractions {city}',
  ],
  tech: [
    'tech museums {city}',
    'tech hubs {city}',
  ],
  bars: [
    'best bars {city}',
    'top nightlife {city}',
  ],
  markets: [
    'markets in {city}',
    '{city} local markets',
  ],
  'street-food': [
    'best street food {city}',
    '{city} street food guide',
  ],
  historical: [
    'historical sites {city}',
    '{city} historical landmarks',
  ],
  'cultural-experiences': [
    'cultural experiences {city}',
    '{city} traditional festivals events',
  ],
};

/**
 * Display names for categories (for summary output)
 */
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  museums: '🏛️ Museums',
  restaurants: '🍽️ Restaurants',
  'local-food': '🌮 Local Food',
  'tourist-attractions': '🎭 Tourist Attractions',
  tech: '💻 Tech Places',
  bars: '🍺 Bars',
  markets: '🛍️ Markets',
  'street-food': '🌯 Street Food',
  historical: '🏰 Historical Sites',
  'cultural-experiences': '🎨 Cultural Experiences',
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
City Research Tool

Usage:
  npx tsx research-city.ts <city-name> [num-results] [output-dir] [categories]

Arguments:
  city-name       (required) Name of the city to research
  num-results     (optional) Number of results per search (default: 3)
  output-dir      (optional) Output directory (default: ./data/scraped/[city]-research)
  categories      (optional) Comma-separated categories (default: all)

Available Categories:
  museums, restaurants, local-food, tourist-attractions, tech, bars,
  markets, street-food, historical

Examples:
  npx tsx research-city.ts "Mexico City"
  npx tsx research-city.ts "Paris" 5
  npx tsx research-city.ts "Tokyo" 3 ./data/destinations/tokyo
  npx tsx research-city.ts "New York" 3 ./data/scraped/nyc museums,restaurants,bars
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
 * Generates a research summary markdown file
 */
function generateSummary(
  summary: ResearchSummary,
  outputDir: string
): void {
  const lines: string[] = [];

  lines.push(`# City Research: ${summary.cityName}\n`);
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
  lines.push('- 📰 Lonely Planet (travel expertise)');
  lines.push('- 🍴 Eater (restaurant curation)\n');

  const summaryPath = path.join(outputDir, '_research_summary.md');
  fs.writeFileSync(summaryPath, lines.join('\n'), 'utf-8');

  console.log(`\n📄 Research summary saved to: ${summaryPath}\n`);
}

/**
 * Main research function
 */
async function researchCity(
  cityName: string,
  numResults: number,
  outputBaseDir: string,
  selectedCategories: string[]
): Promise<void> {
  console.log('═'.repeat(70));
  console.log(`🌆 CITY RESEARCH: ${cityName}`);
  console.log('═'.repeat(70));
  console.log(`\n📊 Configuration:`);
  console.log(`   City: ${cityName}`);
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
      const query = template.replace(/{city}/g, cityName);
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
    cityName,
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
  console.log(`   City: ${cityName}`);
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

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showUsage();
  }

  const cityName = args[0];
  const numResults = args[1] ? parseInt(args[1], 10) : 3;
  const citySlug = slugify(cityName);
  const outputBaseDir =
    args[2] || path.join('./data/scraped', `${citySlug}-research`);
  const categoriesArg = args[3];

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
    await researchCity(
      cityName,
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
