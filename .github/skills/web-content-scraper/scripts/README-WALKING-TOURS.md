# GuruWalk Walking Tours Scraper

## Overview

This scraper extracts walking tour listings from GuruWalk.com, with support for handling "load more" buttons to retrieve all available tours.

## Features

- ✅ Automated Playwright-based scraping
- ✅ Handles "load more" button clicks to load additional content
- ✅ Tracks initial count vs. final count after loading
- ✅ Reports how many additional items were loaded
- ✅ Extracts comprehensive tour information
- ✅ Saves data in multiple formats (JSON, Markdown)
- ✅ Preserves metadata about the scraping process

## Installation

1. Install Playwright (if not already installed):
```bash
npm install playwright
npx playwright install chromium
```

## Usage

### Basic Usage

```bash
npx tsx .github/skills/web-content-scraper/scripts/scrape-walking-tours.ts "<url>" [output-dir]
```

### Example with GuruWalk

```bash
npx tsx .github/skills/web-content-scraper/scripts/scrape-walking-tours.ts \
  "https://www.guruwalk.com/a/search?beginsAt=2026-02-25&endsAt=2026-02-25&vertical=free-tour&hub=mexico-city" \
  ./data/scraped/mexico-city-walking-tours
```

### Example with Default Output Directory

```bash
npx tsx .github/skills/web-content-scraper/scripts/scrape-walking-tours.ts \
  "https://www.guruwalk.com/a/search?hub=paris&beginsAt=2026-03-01"
```

## Output Structure

The scraper creates the following files:

```
<output-dir>/
├── tours.json          # Structured tour data in JSON format
├── tours.md            # Human-readable markdown with all tour info
└── _metadata.json      # Scraping metadata and statistics
```

### tours.json

Contains an array of tour objects with the following structure:

```json
[
  {
    "title": "Historic Center Walking Tour",
    "guide": "Carlos Mendez",
    "description": "Discover the heart of the city...",
    "datetime": "February 25, 2026 at 10:00 AM",
    "duration": "2.5 hours",
    "location": "Palacio de Bellas Artes",
    "language": "English, Spanish",
    "rating": "⭐ 4.9 (245 reviews)",
    "price": "Free (tips appreciated)",
    "url": "https://www.guruwalk.com/walks/12345",
    "imageUrl": "https://..."
  }
]
```

### _metadata.json

Tracking information about the scraping process:

```json
{
  "sourceUrl": "https://www.guruwalk.com/...",
  "scrapedAt": "2026-02-11T23:00:00.000Z",
  "initialCount": 5,
  "loadMoreClicks": 2,
  "finalCount": 15,
  "additionalLoaded": 10,
  "outputDir": "./data/scraped/..."
}
```

### tours.md

Formatted markdown with all tour information, suitable for viewing in a markdown reader or including in documentation.

## How It Works

1. **Initial Load**: Navigates to the URL and waits for content to load
2. **Count Initial Tours**: Counts how many tour items are visible
3. **Click "Load More"**: Searches for and clicks "load more" button
4. **Wait for New Content**: Waits for additional tours to load
5. **Track New Count**: Counts total tours after loading
6. **Report Difference**: Calculates and reports additional items loaded
7. **Repeat**: Continues clicking "load more" until no more content loads or max clicks reached
8. **Extract Data**: Scrapes all tour information from the page
9. **Save Results**: Exports data in JSON and Markdown formats

## "Load More" Button Detection

The scraper looks for "load more" buttons using multiple strategies:

### 1. Common Attributes
- `[data-testid*="load-more"]`
- `[class*="load-more"]`
- `[class*="loadMore"]`
- `[class*="show-more"]`
- `[id*="load-more"]`

### 2. Text Content
Searches all `<button>` and `<a>` elements for text containing:
- "load more" (English)
- "show more" (English)
- "ver más" (Spanish)
- Any variation with "more" or "más"

## Configuration

You can modify the configuration in `scrape-walking-tours.ts`:

```typescript
const CONFIG = {
  viewport: { width: 1920, height: 1080 },      // Browser viewport size
  pageTimeout: 60000,                            // Page load timeout (60s)
  loadMoreWaitTime: 3000,                        // Wait after clicking (3s)
  maxLoadMoreClicks: 10,                         // Max "load more" clicks
  userAgent: '...',                              // Browser user agent
};
```

## Tour Data Extraction

The scraper attempts to extract the following information for each tour:

| Field | Description | Selectors Used |
|-------|-------------|----------------|
| `title` | Tour name | `h2`, `h3`, `h4`, `[class*="title"]` |
| `guide` | Guide/organizer name | `[class*="guide"]`, `[class*="host"]` |
| `description` | Tour description | `p`, `[class*="description"]` |
| `datetime` | Date and time | `[class*="date"]`, `time` |
| `duration` | Tour length | `[class*="duration"]` |
| `location` | Meeting point | `[class*="location"]`, `[class*="place"]` |
| `language` | Tour language(s) | `[class*="language"]`, `[class*="lang"]` |
| `rating` | Reviews/rating | `[class*="rating"]`, `[class*="review"]` |
| `price` | Cost information | `[class*="price"]`, `[class*="cost"]` |
| `url` | Link to tour page | First `<a>` element in tour card |
| `imageUrl` | Tour image | First `<img>` element |

## Troubleshooting

### Network Access Issues

If you get `ERR_BLOCKED_BY_CLIENT` or `ERR_NAME_NOT_RESOLVED`:

- The domain may be blocked in your environment
- Check network connectivity and firewall settings
- Try using a VPN or different network
- Test with the local HTML file first to verify the scraper works

### No Tours Found

If the scraper completes but finds 0 tours:

- The website structure may have changed
- Tour selectors may need updating
- Try inspecting the page HTML to identify tour elements
- Update the `countTourItems()` and `extractTours()` methods with new selectors

### "Load More" Button Not Found

If the button isn't detected:

- Inspect the page source to find the button's class/id
- Add new selectors to the `clickLoadMore()` method
- The button may be dynamically loaded after a delay
- Try increasing `loadMoreWaitTime` in config

## Example Output

When running successfully, you'll see output like this:

```
🚀 Launching browser...

🌐 Scraping: https://www.guruwalk.com/a/search?hub=mexico-city...

📄 Loading page...

📊 Initial tour count: 12

🔍 Looking for "load more" button...
  ✅ Found and clicked "load more" button

📊 After clicking "load more" (click #1):
   • Previous count: 12
   • New count: 24
   • Additional items loaded: 12

🔍 Looking for "load more" button...
  ✅ Found and clicked "load more" button

📊 After clicking "load more" (click #2):
   • Previous count: 24
   • New count: 30
   • Additional items loaded: 6

🔍 Looking for "load more" button...
  ℹ️  No more "load more" buttons found

📊 Final Statistics:
   • Initial tours visible: 12
   • "Load more" clicks: 2
   • Additional tours loaded: 18
   • Total tours: 30

📋 Extracting tour information...
  ✅ Extracted 30 tours

💾 Saved tours data: ./data/scraped/mexico-city/tours.json
💾 Saved metadata: ./data/scraped/mexico-city/_metadata.json
💾 Saved markdown: ./data/scraped/mexico-city/tours.md

✨ Scraping complete!
   📂 Output directory: ./data/scraped/mexico-city
```

## Testing

A test HTML file is provided for verifying the scraper works:

```bash
npx tsx .github/skills/web-content-scraper/scripts/scrape-walking-tours.ts \
  "file:///path/to/test-walking-tours.html" \
  ./data/scraped/test
```

## Integration with Chat-web-travels

Scraped tour data can be used as knowledge base content for the AI travel assistant:

1. Run the scraper to fetch current tours
2. Data is saved to `data/scraped/`
3. `KnowledgeService` indexes markdown files
4. AI can reference tour information in responses

## Limitations

- Requires network access to GuruWalk.com
- May not work if website structure changes significantly
- Rate limiting may occur with excessive requests
- JavaScript-heavy sites may require additional wait times
- Maximum 10 "load more" clicks by default (configurable)

## Future Enhancements

Potential improvements for this scraper:

- [ ] Support for filtering tours by date range
- [ ] Download and save tour images locally
- [ ] Extract tour availability and booking status
- [ ] Support for multiple cities in batch
- [ ] Retry logic for transient network errors
- [ ] Headless browser with stealth mode for better compatibility
- [ ] Export to additional formats (CSV, XML)
- [ ] Incremental updates (only scrape new/changed tours)

## License

This scraper is part of the Chat-web-travels project and follows the same MIT license.

## Support

For issues or questions:
- Check the main project README
- Review GuruWalk's terms of service before scraping
- Ensure you comply with robots.txt and rate limiting
- Report bugs via GitHub issues
