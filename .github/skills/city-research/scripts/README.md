# City Research Scripts

This directory contains scripts for researching things to do in cities.

## Scripts

### research-city.ts

Main script for researching a city by performing targeted Google searches for different activity categories.

**Usage:**
```bash
npx tsx research-city.ts <city-name> [num-results] [output-dir] [categories]
```

**Examples:**
```bash
# Research all categories for Mexico City
npx tsx research-city.ts "Mexico City"

# Research with 5 results per search
npx tsx research-city.ts "Paris" 5

# Custom output directory
npx tsx research-city.ts "Tokyo" 3 ./data/destinations/tokyo-research

# Research specific categories only
npx tsx research-city.ts "New York" 3 ./data/scraped/nyc museums,restaurants,bars
```

**Activity Categories:**
- `museums` - Museums to visit
- `restaurants` - Good places to eat
- `local-food` - Food that is local or famous
- `tourist-attractions` - Top tourist spots
- `tech` - Interesting tech-related places
- `bars` - Top bars and nightlife
- `markets` - Local markets
- `street-food` - Street food spots
- `historical` - Historical landmarks

**Search Sources:**
- Lonely Planet (travel expertise)
- Eater (restaurant curation)
- General Google search results

## Output Structure

The script creates a structured directory with research organized by category:

```
<output-dir>/
├── museums/
│   ├── 1-best-museums-in-city/
│   │   ├── content.md
│   │   └── images/
│   └── 2-lonely-planet-museums/
│       └── content.md
├── restaurants/
│   ├── 1-eater-city/
│   │   └── content.md
│   └── 2-best-restaurants/
│       └── content.md
├── local-food/
├── tourist-attractions/
├── tech/
├── bars/
├── markets/
├── street-food/
├── historical/
└── _research_summary.md  # Overview of all research
```

## How It Works

1. **Query Generation**: For each category, generates targeted Google search queries
2. **Google Search & Scrape**: Uses the Google search scraper to find and scrape organic results
3. **Content Organization**: Saves results in category-specific directories
4. **Summary Generation**: Creates a research summary with links to all sources

## Prerequisites

```bash
# Install Playwright (if not already installed)
npm install

# Install Chromium browser
npx playwright install chromium
```

## Configuration

Search templates and categories are configured in `research-city.ts`:

```typescript
const SEARCH_TEMPLATES: Record<string, string[]> = {
  museums: [
    'best museums in {city}',
    'lonely planet museums {city}'
  ],
  restaurants: [
    'best restaurants in {city}',
    'eater {city}'
  ],
  // ... more categories
};
```

You can modify these templates or add new categories as needed.

## Error Handling

- **Missing city name**: Shows usage information
- **Invalid categories**: Lists valid categories and exits
- **Scraping failures**: Logs error but continues with other searches
- **Network issues**: Reports error and continues

## Best Practices

1. Don't run too many searches simultaneously (built-in 3-second delays)
2. Review scraped content for quality
3. Update research periodically as city information changes
4. Maintain source attribution for all content
5. Use appropriate output directories for organization

## See Also

- [Google Search and Scraper Skill](../../google-search-scraper/SKILL.md)
- [City Research Skill Documentation](../SKILL.md)
