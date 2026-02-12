# City Research Skill - Usage Examples

This document provides practical examples for using the city-research skill.

## Quick Start

### Example 1: Research All Categories for a City

```bash
npx tsx .github/skills/city-research/scripts/research-city.ts "Mexico City"
```

This will:
- Search for all 9 activity categories (museums, restaurants, local food, tourist attractions, tech, bars, markets, street food, historical sites)
- Scrape top 3 results per search query (2 queries per category = ~18 searches total)
- Save to `./data/scraped/mexico-city-research/`
- Generate a research summary

### Example 2: Research with More Results

```bash
npx tsx .github/skills/city-research/scripts/research-city.ts "Paris" 5
```

This will scrape 5 results per search instead of 3, giving you more comprehensive information.

### Example 3: Research Specific Categories Only

```bash
npx tsx .github/skills/city-research/scripts/research-city.ts "Tokyo" 3 ./data/destinations/tokyo-research museums,restaurants,historical
```

This researches only:
- Museums
- Restaurants
- Historical sites

And saves the output to a custom directory.

### Example 4: Quick Restaurant Research

```bash
npx tsx .github/skills/city-research/scripts/research-city.ts "Barcelona" 3 ./data/scraped/barcelona-food restaurants,local-food,street-food,markets
```

Focuses on food-related categories:
- Restaurants
- Local food
- Street food
- Markets

## Category Combinations

### Tourist Planning
```bash
npx tsx .github/skills/city-research/scripts/research-city.ts "Rome" 3 ./data/scraped/rome tourist-attractions,museums,historical
```

### Food Tour
```bash
npx tsx .github/skills/city-research/scripts/research-city.ts "Bangkok" 5 ./data/scraped/bangkok-food restaurants,local-food,street-food,markets
```

### Nightlife Research
```bash
npx tsx .github/skills/city-research/scripts/research-city.ts "Amsterdam" 3 ./data/scraped/amsterdam-nightlife bars,restaurants,markets
```

### Tech Tourism
```bash
npx tsx .github/skills/city-research/scripts/research-city.ts "San Francisco" 3 ./data/scraped/sf-tech tech,museums,tourist-attractions
```

### Cultural Deep Dive
```bash
npx tsx .github/skills/city-research/scripts/research-city.ts "Kyoto" 5 ./data/scraped/kyoto-culture museums,historical,markets,local-food
```

## Expected Output

After running the script, you'll have:

```
./data/scraped/mexico-city-research/
├── museums/
│   ├── 1-best-museums-in-mexico-city/
│   │   ├── content.md
│   │   └── images/
│   │       ├── _attribution.yaml
│   │       ├── image-1.jpg
│   │       └── image-2.png
│   ├── 2-lonely-planet-museums/
│   │   └── content.md
│   └── 3-national-museum-guide/
│       └── content.md
├── restaurants/
│   ├── 1-eater-mexico-city/
│   │   └── content.md
│   └── 2-best-restaurants/
│       └── content.md
├── [... other categories ...]
└── _research_summary.md  # Overview of all research
```

## Research Summary Example

The `_research_summary.md` file will contain:

```markdown
# City Research: Mexico City

**Research Date:** February 12, 2026
**Categories Researched:** 9
**Total Sources Scraped:** 27

---

## Categories

### 🏛️ Museums (3 sources)

1. [Best Museums in Mexico City](./museums/1-best-museums-in-mexico-city/content.md)
2. [Lonely Planet Museums Guide](./museums/2-lonely-planet-museums/content.md) (5 images)
3. [National Museum of Anthropology](./museums/3-national-museum-guide/content.md) (12 images)

### 🍽️ Restaurants (3 sources)

1. [Eater Mexico City Guide](./restaurants/1-eater-mexico-city/content.md)
2. [Best Restaurants 2026](./restaurants/2-best-restaurants/content.md)
3. [Fine Dining Guide](./restaurants/3-fine-dining-guide/content.md) (8 images)

[... other categories ...]

---

## Research Statistics

- **Total queries performed:** 18
- **Sources scraped:** 27
- **Images downloaded:** 142

---

**Research powered by:**
- 🔍 Google Search (organic results only)
- 📰 Lonely Planet (travel expertise)
- 🍴 Eater (restaurant curation)
```

## Integration with Chat System

After researching a city, the scraped content will be available in the knowledge base:

```bash
# Start the chat server
npm start

# Ask about the city
# The system will automatically find relevant content from the research
```

Example queries:
- "What are the best museums in Mexico City?"
- "Where should I eat in Mexico City?"
- "Tell me about historical sites in Mexico City"

## Tips and Best Practices

### 1. Start Small
When researching a new city, start with a small number of categories to test:
```bash
npx tsx .github/skills/city-research/scripts/research-city.ts "NewCity" 2 ./test museums,restaurants
```

### 2. Use Focused Searches
For specific needs, select relevant categories:
```bash
# Planning a food trip
npx tsx .github/skills/city-research/scripts/research-city.ts "City" 5 ./output restaurants,local-food,street-food
```

### 3. Organize Output
Use descriptive output directories:
```bash
npx tsx .github/skills/city-research/scripts/research-city.ts "Paris" 3 ./data/destinations/paris-2026-research
```

### 4. Be Patient
The script includes delays between searches to be respectful to Google. A full research (9 categories) takes about 5-10 minutes.

### 5. Review Results
Always review the `_research_summary.md` first to understand what was found before diving into individual sources.

## Troubleshooting

### No Results for a Category

If a category returns no results:
- The city might not have content for that category
- Try different search terms by modifying the script
- Some categories like "tech" may not apply to all cities

### Too Many Ads

If you're getting mostly ads in results:
- The script automatically filters ads
- Check the verbose output to see what was skipped
- Consider using more specific search terms

### Rate Limiting

If you hit Google's rate limits:
- Wait 10-15 minutes before trying again
- Reduce the number of results per search
- Research fewer categories at once

## Advanced Usage

### Customizing Search Templates

Edit `research-city.ts` to modify search queries:

```typescript
const SEARCH_TEMPLATES: Record<string, string[]> = {
  museums: [
    'best museums in {city}',
    'lonely planet museums {city}',
    'top cultural museums {city}',  // Add custom query
  ],
  // ... other categories
};
```

### Adding New Categories

Add new activity types:

```typescript
const SEARCH_TEMPLATES: Record<string, string[]> = {
  // ... existing categories

  'coffee-shops': [
    'best coffee shops in {city}',
    '{city} specialty coffee guide'
  ],

  'bookstores': [
    'independent bookstores {city}',
    'best bookshops {city}'
  ],
};

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  // ... existing names
  'coffee-shops': '☕ Coffee Shops',
  'bookstores': '📚 Bookstores',
};
```

## See Also

- [City Research Skill Documentation](../SKILL.md) - Full skill documentation
- [Google Search Scraper](../../google-search-scraper/SKILL.md) - Underlying search tool
- [Data Organization Guidelines](../../../../data/AGENTS.md) - Knowledge base structure
