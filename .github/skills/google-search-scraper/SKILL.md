---
name: google-search-scraper
description: Perform Google searches, identify organic results (skipping ads), and scrape the top N results to extract their content and images. Use when a user asks to search for and scrape content from Google search results.
---

# Google Search and Scraper Skill

Perform Google searches and automatically scrape the top organic results, filtering out ads and extracting meaningful content.

## Overview

This skill automates the process of:
1. Performing a Google search with any query
2. Identifying and skipping advertisements in search results
3. Selecting the top N organic (non-ad) results
4. Scraping each result page for content and images
5. Saving the extracted content in a structured format

## When to Use

Use this skill when a user:
- Asks to "search Google for" something and scrape the results
- Wants to "find top articles about" a topic and extract their content
- Requests to "get content from Google search results"
- Needs to "research" a topic by scraping multiple sources
- Wants to gather information from the web about a specific query

## Key Features

### Ad Detection and Filtering
- **Automatic ad detection**: Identifies sponsored results using multiple heuristics
- **Organic results only**: Only scrapes real search results, not advertisements
- **Verbose output**: Shows which results are ads and why they were skipped

### Content Extraction
- Extracts main article content while filtering out noise (ads, navigation, sidebars)
- Preserves important content structure (headings, lists, paragraphs)
- Converts HTML to clean markdown format
- Includes source attribution and scrape date

### Image Handling
- Detects and downloads relevant images from articles
- Handles lazy-loaded images (data-src, data-lazy-src, srcset)
- Generates attribution manifest for all images
- Skips ads, icons, and decorative images

## Usage

### Basic Usage

```bash
# Search and scrape top 3 results (default)
npx tsx .github/skills/google-search-scraper/scripts/google-search-and-scrape.ts "top things to do in Mexico City"
```

### Advanced Usage

```bash
# Specify number of results to scrape
npx tsx .github/skills/google-search-scraper/scripts/google-search-and-scrape.ts "best restaurants in Paris" 5

# Specify custom output directory
npx tsx .github/skills/google-search-scraper/scripts/google-search-and-scrape.ts "travel tips Tokyo" 3 ./data/destinations
```

### Command Syntax

```
npx tsx .github/skills/google-search-scraper/scripts/google-search-and-scrape.ts <search-query> [num-results] [output-base-dir]
```

**Arguments:**
- `search-query` (required): The Google search query
- `num-results` (optional): Number of results to scrape (default: 3)
- `output-base-dir` (optional): Base directory for output (default: ./data/scraped)

## Output Structure

The skill creates a structured directory for each scraped result:

```
<output-base-dir>/
├── 1-first-result-title/
│   ├── content.md           # Extracted page content as markdown
│   └── images/              # Downloaded images (if any)
│       ├── _attribution.yaml  # Image attribution manifest
│       ├── image-1.jpg
│       └── image-2.png
├── 2-second-result-title/
│   ├── content.md
│   └── images/
│       └── _attribution.yaml
└── 3-third-result-title/
    ├── content.md
    └── images/
        └── _attribution.yaml
```

## Verbose Output Example

When you run the script, you'll see detailed information about the search and scraping process:

```
🔍 Searching Google for: "top things to do in Mexico City"

═══════════════════════════════════════════════════════════

🚫 SKIPPED ADS (2):

1. [AD] Visit Mexico City - Official Tourism Website
   URL: https://www.visitmexico.com/mexico-city
   Reason: Marked as advertisement

2. [AD] Book Mexico City Tours Now
   URL: https://www.tours.com/mexico-city
   Reason: Marked as advertisement

✅ ORGANIC RESULTS (10):

1. Top 10 Things to Do in Mexico City - Travel Guide
   URL: https://example.com/mexico-city-guide
   Snippet: Discover the best attractions, museums, and cultural experiences...

2. Mexico City Activities and Attractions
   URL: https://example.com/activities
   Snippet: From ancient ruins to modern art galleries, Mexico City offers...

[... more results ...]

═══════════════════════════════════════════════════════════

🎯 Will scrape top 3 results:

1. Top 10 Things to Do in Mexico City - Travel Guide
   https://example.com/mexico-city-guide

2. Mexico City Activities and Attractions
   https://example.com/activities

3. Best Museums and Historical Sites
   https://example.com/museums

📄 Scraping: Top 10 Things to Do in Mexico City - Travel Guide
   URL: https://example.com/mexico-city-guide
   📜 Scrolling to trigger lazy-loaded images...
   📥 Downloading 5 images...
      ✅ mexico-city-zocalo.jpg
      ✅ frida-kahlo-museum.jpg
      ✅ teotihuacan-pyramids.jpg
      ✅ chapultepec-park.jpg
      ✅ historic-center.jpg
   ✅ Scraped successfully!
   📝 Content saved to: ./data/scraped/1-top-10-things-to-do-in-mexico-city/content.md
   🖼️  Images: 5/5 downloaded

   ⏳ Waiting 2 seconds before next scrape...

[... continues for each result ...]

═══════════════════════════════════════════════════════════
✨ SCRAPING COMPLETE!

📊 Summary:
   Query: "top things to do in Mexico City"
   Results scraped: 3/3
   Output directory: ./data/scraped

1. Top 10 Things to Do in Mexico City - Travel Guide
   URL: https://example.com/mexico-city-guide
   Images: 5/5

2. Mexico City Activities and Attractions
   URL: https://example.com/activities
   Images: 3/3

3. Best Museums and Historical Sites
   URL: https://example.com/museums
   Images: 7/8

═══════════════════════════════════════════════════════════
```

## How Ad Detection Works

The skill uses multiple heuristics to identify advertisements:

1. **Data attributes**: Checks for `data-text-ad` and similar markers
2. **CSS classes**: Looks for classes containing "ad", "ads-ad", "ad_cclk"
3. **Text patterns**: Detects "·Ad·" and "Sponsored" labels
4. **Container analysis**: Identifies ad-specific container elements

## Content Extraction Process

For each result page, the skill:

1. **Loads the page**: Uses Playwright to render JavaScript-heavy sites
2. **Scrolls the page**: Triggers lazy-loaded images by scrolling
3. **Extracts content**: Finds main content area using semantic HTML selectors
4. **Filters noise**: Removes ads, navigation, headers, footers, sidebars
5. **Converts to markdown**: Creates clean, readable markdown format
6. **Extracts images**: Identifies content images (not ads or icons)
7. **Downloads images**: Saves images locally with attribution
8. **Saves content**: Writes markdown file with metadata

## Prerequisites

This skill requires Playwright with Chromium installed:

```bash
# Install Playwright (already in package.json)
npm install

# Install Chromium browser
npx playwright install chromium
```

## Configuration

The script includes configurable settings in the `CONFIG` object:

```typescript
const CONFIG = {
  viewport: { width: 1920, height: 1080 },  // Browser viewport size
  networkIdleTimeout: 2000,                 // Wait time for network idle
  scrollStep: 500,                          // Pixels to scroll per step
  scrollDelay: 300,                         // Delay between scroll steps (ms)
  pageTimeout: 30000,                       // Maximum page load time (ms)
  userAgent: '...',                         // Browser user agent
  contentSelectors: [...],                  // Selectors for main content
  removeSelectors: [...],                   // Selectors to remove
};
```

## Error Handling

The skill handles various error conditions:

| Error Type | Behavior |
|------------|----------|
| No search results | Reports "No organic search results found" |
| Page load timeout | Skips the result and continues |
| Image download failure | Logs error but continues with other images |
| Content extraction failure | Skips the result and continues |

## Limitations

- **Rate limiting**: Google may rate-limit if too many requests are made
- **JavaScript-required sites**: Some sites may require additional handling
- **Authentication**: Cannot scrape login-protected content
- **Dynamic content**: Some content loaded via complex JavaScript may be missed
- **Google changes**: Google's HTML structure may change, affecting result extraction

## Best Practices

1. **Be respectful**: Don't scrape too many results at once
2. **Review output**: Always review scraped content for accuracy
3. **Attribution**: Maintain source attribution for all content and images
4. **Storage**: Organize output in appropriate data directories
5. **Delays**: The script includes delays between scrapes to be respectful

## Integration with Chat-web-travels

### Recommended Usage

For travel-related searches, save results to appropriate directories:

```bash
# Destinations
npx tsx .github/skills/google-search-scraper/scripts/google-search-and-scrape.ts \
  "top things to do in Mexico City" 3 ./data/destinations/mexico-city-scraped

# Activities
npx tsx .github/skills/google-search-scraper/scripts/google-search-and-scrape.ts \
  "best restaurants in Paris" 5 ./data/scraped/paris-restaurants

# Travel guides
npx tsx .github/skills/google-search-scraper/scripts/google-search-and-scrape.ts \
  "packing tips for Europe" 3 ./data/guides/europe-packing
```

### Content Organization

After scraping:
1. Review the extracted content for quality
2. Move or consolidate the best content into the appropriate data directories
3. Update tags and metadata as needed
4. Ensure image attribution is maintained

## Example: Mexico City Activities

```bash
# Search for top things to do in Mexico City
npx tsx .github/skills/google-search-scraper/scripts/google-search-and-scrape.ts \
  "top things to do in Mexico City" 3 ./data/scraped/mexico-city-activities
```

This will:
1. Search Google for "top things to do in Mexico City"
2. Skip all advertisement results
3. Scrape the top 3 organic results
4. Extract content and images from each page
5. Save to `./data/scraped/mexico-city-activities/`

## Future Enhancements

Potential improvements for this skill:
- Support for other search engines (Bing, DuckDuckGo)
- More sophisticated ad detection
- Content quality scoring
- Duplicate content detection
- Language translation
- Structured data extraction (ratings, prices, locations)

## Troubleshooting

### "No organic search results found"

This can happen if:
- Google's HTML structure has changed
- All results are marked as ads
- Network connectivity issues

**Solution**: Try a different search query or check Google manually

### Images not downloading

This can happen if:
- Images are behind authentication
- Image URLs are temporary/expired
- Network issues

**Solution**: Check the error messages in the output

### Content appears incomplete

This can happen if:
- Content is heavily JavaScript-rendered
- Site uses unusual HTML structure
- Content is behind a paywall

**Solution**: Try the page manually to verify accessibility

## See Also

- [Web Content Scraper Skill](../web-content-scraper/SKILL.md) - For scraping single URLs
- [data/AGENTS.md](../../../data/AGENTS.md) - Knowledge base organization guidelines
