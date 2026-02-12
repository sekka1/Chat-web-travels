---
name: city-research
description: Research things to do in a city by performing targeted Google searches for museums, restaurants, tourist attractions, historical sites, street food, bars, markets, and tech-related places. Use when a user asks to research or find things to do in a city.
---

# City Research Skill

Research comprehensive information about things to do in a specific city using targeted Google searches and web scraping.

## Overview

This skill automates the process of researching a city by:
1. Performing multiple Google searches with targeted queries for different activity types
2. Leveraging authoritative sources like Lonely Planet and Eater
3. Scraping the top results from each search
4. Organizing the content by activity category
5. Saving everything in a structured format for later use

## When to Use

Use this skill when a user:
- Asks to "research things to do in [city name]"
- Wants to "find activities in [city name]"
- Requests information about "what to see in [city name]"
- Needs comprehensive travel information for a specific city
- Wants to know about restaurants, museums, attractions, etc. in a city

## Activity Categories

The skill searches for these types of activities:

| Category | Description | Example Searches |
|----------|-------------|------------------|
| **Museums** | Museums to visit | "best museums in [city]", "lonely planet museums [city]" |
| **Restaurants** | Good places to eat | "best restaurants in [city]", "eater [city]" |
| **Local Food** | Food that is local or famous | "famous food in [city]", "[city] local dishes eater" |
| **Tourist Attractions** | Top tourist spots | "top tourist attractions [city]", "lonely planet things to do in [city]" |
| **Tech Places** | Interesting tech-related places | "tech museums [city]", "tech hubs [city]" |
| **Bars** | Top bars and nightlife | "best bars [city]", "top nightlife [city]" |
| **Markets** | Local markets | "markets in [city]", "[city] local markets" |
| **Street Food** | Street food spots | "best street food [city]", "[city] street food guide" |
| **Historical Sites** | Historical landmarks | "historical sites [city]", "[city] historical landmarks" |

## Authoritative Sources

The skill prioritizes these trusted sources:

### Lonely Planet
- **What it is**: Renowned travel guide publisher with comprehensive city guides
- **Why we use it**: High-quality, well-researched content about destinations
- **Example query**: `lonely planet things to do in Mexico City`

### Eater
- **What it is**: Trusted food and restaurant aggregation website
- **Why we use it**: Expert-curated lists of top restaurants, best dishes, and food guides
- **Example query**: `eater Mexico City`

## Usage

### Basic Usage

```bash
# Research a city with default settings (all categories, 3 results per search)
npx tsx .github/skills/city-research/scripts/research-city.ts "Mexico City"
```

### Advanced Usage

```bash
# Specify number of results per search
npx tsx .github/skills/city-research/scripts/research-city.ts "Paris" 5

# Specify custom output directory
npx tsx .github/skills/city-research/scripts/research-city.ts "Tokyo" 3 ./data/destinations/tokyo-research

# Research specific categories only
npx tsx .github/skills/city-research/scripts/research-city.ts "New York" 3 ./data/scraped/nyc museums,restaurants,bars
```

### Command Syntax

```
npx tsx .github/skills/city-research/scripts/research-city.ts <city-name> [num-results] [output-dir] [categories]
```

**Arguments:**
- `city-name` (required): Name of the city to research
- `num-results` (optional): Number of results to scrape per search (default: 3)
- `output-dir` (optional): Output directory (default: ./data/scraped/[city-name-slug]-research)
- `categories` (optional): Comma-separated list of categories to research (default: all)

**Available categories:**
- `museums`
- `restaurants`
- `local-food`
- `tourist-attractions`
- `tech`
- `bars`
- `markets`
- `street-food`
- `historical`

## Output Structure

The skill creates a well-organized directory structure:

```
./data/scraped/[city-name]-research/
├── museums/
│   ├── 1-best-museums-in-mexico-city/
│   │   ├── content.md
│   │   └── images/
│   │       ├── _attribution.yaml
│   │       └── *.jpg
│   ├── 2-lonely-planet-museums/
│   │   └── content.md
│   └── 3-national-museum-guide/
│       └── content.md
├── restaurants/
│   ├── 1-eater-mexico-city/
│   │   ├── content.md
│   │   └── images/
│   └── 2-best-restaurants/
│       └── content.md
├── local-food/
│   ├── 1-traditional-mexican-food/
│   │   └── content.md
│   └── 2-street-tacos-guide/
│       └── content.md
├── tourist-attractions/
│   ├── 1-lonely-planet-things-to-do/
│   │   └── content.md
│   └── 2-top-10-attractions/
│       └── content.md
├── historical-sites/
│   └── 1-aztec-ruins-guide/
│       └── content.md
├── bars/
│   └── 1-best-bars-nightlife/
│       └── content.md
├── markets/
│   └── 1-local-markets-guide/
│       └── content.md
├── street-food/
│   └── 1-street-food-vendors/
│       └── content.md
├── tech/
│   └── 1-tech-museums/
│       └── content.md
└── _research_summary.md  # Overview of all research performed
```

## How It Works

### Step 1: Query Generation

For each activity category, the skill generates multiple search queries:

**Example for "Mexico City":**
- Museums: `"best museums in Mexico City"`, `"lonely planet museums Mexico City"`
- Restaurants: `"best restaurants in Mexico City"`, `"eater Mexico City"`
- Tourist Attractions: `"lonely planet things to do in Mexico City"`, `"top tourist attractions Mexico City"`

### Step 2: Google Search and Scrape

For each query:
1. Performs Google search
2. Filters out advertisements
3. Scrapes top N organic results
4. Extracts content and images
5. Saves to category-specific directory

### Step 3: Content Organization

- Each category gets its own subdirectory
- Results are numbered and titled
- Images are downloaded with attribution
- All content is converted to clean markdown

### Step 4: Summary Generation

Creates a `_research_summary.md` file containing:
- City name and research date
- List of all categories researched
- Number of results per category
- Quick links to all scraped content
- Statistics about the research

## Example Output

### _research_summary.md

```markdown
# City Research: Mexico City

**Research Date:** February 12, 2026
**Categories Researched:** 9
**Total Sources Scraped:** 27

---

## Categories

### 🏛️ Museums (3 sources)

1. [Best Museums in Mexico City](./museums/1-best-museums-in-mexico-city/content.md)
2. [Lonely Planet Museums Guide](./museums/2-lonely-planet-museums/content.md)
3. [National Museum of Anthropology](./museums/3-national-museum-guide/content.md)

### 🍽️ Restaurants (3 sources)

1. [Eater Mexico City Guide](./restaurants/1-eater-mexico-city/content.md)
2. [Best Restaurants 2026](./restaurants/2-best-restaurants/content.md)
3. [Fine Dining in Mexico City](./restaurants/3-fine-dining-guide/content.md)

### 🌮 Local Food (3 sources)

1. [Traditional Mexican Food](./local-food/1-traditional-mexican-food/content.md)
2. [Street Tacos Guide](./local-food/2-street-tacos-guide/content.md)
3. [Eater Essential Dishes](./local-food/3-essential-dishes/content.md)

[... continues for all categories ...]

---

## Research Statistics

- **Total queries performed:** 18
- **Ads filtered out:** 34
- **Sources scraped:** 27
- **Images downloaded:** 142
- **Total content size:** 2.4 MB

---

**Research powered by:**
- 🔍 Google Search (organic results only)
- 📰 Lonely Planet (travel expertise)
- 🍴 Eater (restaurant curation)
```

## Integration with Google Search Scraper

This skill is built on top of the [Google Search and Scraper Skill](../google-search-scraper/SKILL.md). It:

1. Calls the Google search scraper multiple times with different queries
2. Organizes results by category
3. Provides a higher-level abstraction for city research
4. Generates summary documentation

## Prerequisites

Same as Google Search Scraper:

```bash
# Install dependencies (already in package.json)
npm install

# Install Playwright browser
npx playwright install chromium
```

## Configuration

The script includes configurable search templates:

```typescript
const SEARCH_TEMPLATES = {
  museums: [
    'best museums in {city}',
    'lonely planet museums {city}'
  ],
  restaurants: [
    'best restaurants in {city}',
    'eater {city}'
  ],
  'local-food': [
    'famous food in {city}',
    '{city} local dishes eater'
  ],
  // ... more categories
};
```

## Customization

### Adding New Categories

To add new activity categories, edit the `SEARCH_TEMPLATES` object in the script:

```typescript
const SEARCH_TEMPLATES = {
  // Existing categories...

  // Add new category
  'coffee-shops': [
    'best coffee shops in {city}',
    '{city} specialty coffee guide'
  ],

  'architecture': [
    'architectural landmarks {city}',
    'lonely planet architecture {city}'
  ]
};
```

### Modifying Search Queries

You can customize search queries for existing categories to get different results:

```typescript
// Original
restaurants: [
  'best restaurants in {city}',
  'eater {city}'
],

// Modified to focus on specific types
restaurants: [
  'michelin star restaurants {city}',
  'eater essential {city}',
  'best cheap eats {city}'
],
```

## Error Handling

The skill handles errors gracefully:

| Error Type | Behavior |
|------------|----------|
| City name missing | Shows usage information and exits |
| No search results for category | Logs warning and continues with other categories |
| Scraping failure | Logs error for that result but continues |
| Network issues | Retries once, then skips that query |

## Best Practices

1. **Be respectful**: Don't run this for too many cities at once
2. **Review results**: Always review scraped content for quality
3. **Update regularly**: City information changes - re-run periodically
4. **Organize well**: Use the default output structure or customize thoughtfully
5. **Attribution**: Maintain source attribution for all content
6. **Storage**: Archive research results in appropriate data directories

## Example: Researching Mexico City

```bash
# Full research with all categories
npx tsx .github/skills/city-research/scripts/research-city.ts "Mexico City"

# Research specific categories only
npx tsx .github/skills/city-research/scripts/research-city.ts "Mexico City" 3 ./data/destinations/mexico-city museums,restaurants,historical-sites

# Quick research with fewer results
npx tsx .github/skills/city-research/scripts/research-city.ts "Mexico City" 2
```

This will:
1. Search for museums, restaurants, local food, attractions, etc.
2. Use Lonely Planet and Eater as trusted sources
3. Scrape 3 organic results per search query
4. Download images with attribution
5. Organize everything by category
6. Generate a research summary

## Use Cases

### Planning a Trip
Research a new destination before traveling to understand what to see, where to eat, and what experiences are available.

### Building Travel Guides
Create comprehensive travel guides by gathering information from multiple authoritative sources.

### Updating Knowledge Base
Regularly update the travel knowledge base with fresh content about destinations.

### Comparison Research
Research multiple cities to compare their offerings and help users decide where to go.

## Limitations

- **Rate limiting**: Google may rate-limit if too many searches are performed quickly
- **Content quality**: Results depend on the quality of Google search results
- **Completeness**: May not capture every activity type or local spot
- **Timeliness**: Information may become outdated (restaurants close, museums change hours)
- **Local expertise**: Cannot replace local knowledge or current visitor experiences

## Future Enhancements

Potential improvements:
- Detect and remove duplicate content across sources
- Score content quality and relevance
- Extract structured data (ratings, prices, addresses)
- Support for non-English cities and queries
- Integration with maps APIs for location data
- Sentiment analysis of restaurant reviews
- Date/time information extraction

## Troubleshooting

### No results for a category

**Cause**: Search query may not match city or category not applicable

**Solution**:
- Check if the city name is spelled correctly
- Try customizing search templates for that city
- Some categories may not apply to all cities

### Too many ads, not enough organic results

**Cause**: Certain queries trigger many advertisements

**Solution**:
- Modify search templates to be more specific
- Use authoritative source names (Lonely Planet, Eater)
- Add modifiers like "guide" or "blog" to queries

### Content seems incomplete

**Cause**: Page may be heavily JavaScript-rendered

**Solution**:
- Review the scraped content manually
- Consider re-running the search
- Try different search queries for the same category

## See Also

- [Google Search and Scraper Skill](../google-search-scraper/SKILL.md) - Underlying search/scrape functionality
- [Web Content Scraper Skill](../web-content-scraper/SKILL.md) - For scraping single URLs
- [data/AGENTS.md](../../../data/AGENTS.md) - Knowledge base organization guidelines
