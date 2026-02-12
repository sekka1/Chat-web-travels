# Agent Context for Data Directory

This file provides guidance for AI agents working with the Chat-web-travels knowledge base.

## Directory Structure

The `data/` directory contains the knowledge base files that are searched by `KnowledgeService` to provide context-aware AI responses:

```
data/
├── destinations/     # Destination guides and travel information
├── guides/          # Travel guides and how-to articles
├── tips/            # Quick travel tips and best practices
├── images/          # Image assets with attribution (optional)
│   └── scraped/     # Downloaded images from web scraping
│       └── _attribution.yaml  # Image source attribution manifest
└── scraped/         # Web-scraped content
    └── {topic-name}/
        ├── content.md           # Main article content
        └── images/              # Topic-specific images (optional)
            └── _attribution.yaml
```

## Content Organization

### File Naming Conventions

- **Markdown files**: Use lowercase with hyphens (e.g., `japan.md`, `budget-travel.md`, `packing-guide.md`)
- **Directories**: Use lowercase with hyphens (e.g., `solo-travel-tips/`)

### Content Format

All knowledge base content should follow these standards:

1. **Include source attribution**: Always cite the original source for scraped content
2. **Add scrape date**: Include the date content was added/scraped
3. **Use proper markdown**: Follow consistent heading hierarchy (H1 for title, H2 for sections)
4. **Add metadata**: Include tags and last updated date at the bottom

**Example header format for scraped content:**
```markdown
# Article Title

> Source: https://example.com/original-article
> Scraped: 2026-02-10

---

## Introduction

[Content here...]
```

**Example footer format:**
```markdown
---

Last updated: 2026-02-10
Tags: destination-guide, asia, culture, food, temples
```

## Web Scraping Guidelines

### IMPORTANT: Use the Web-Content-Scraper Skill

When scraping web content for the knowledge base, **ALWAYS use the web-content-scraper skill** located at `.github/skills/web-content-scraper/` (if available).

This skill provides:
- ✅ Automatic content extraction with noise filtering
- ✅ Image downloading with lazy-load support
- ✅ Source attribution and licensing metadata
- ✅ Clean markdown formatting
- ✅ Playwright-based JavaScript rendering

### How to Use the Skill

The skill is documented in `.github/skills/web-content-scraper/SKILL.md` (if available). Key points:

1. **For standard scraping** (no lazy-loaded images):
   - Use the `Skill` tool to invoke the web-content-scraper skill
   - Provide the URL to scrape
   - Skill will extract and format content automatically

2. **For complex scraping** (lazy-loaded images, JS-heavy sites):
   ```bash
   npx tsx .github/skills/web-content-scraper/scripts/scrape-lazy-images.ts <url> <output-dir>
   ```

3. **Output location**: Content goes to `data/scraped/{topic-name}/`
   - `content.md` - Main article content
   - `images/` - Downloaded images (if applicable)
   - `images/_attribution.yaml` - Image attribution manifest

### When to Scrape

Add scraped content when:
- User explicitly requests to scrape a URL
- Existing knowledge base lacks coverage on a topic
- Content complements existing destination guides or travel tips
- Images would enhance understanding of destinations or experiences

### Attribution Requirements

All scraped content MUST include:
- Source URL
- Scrape date
- Original author (if available)
- License information (if available)

For images, maintain attribution in `_attribution.yaml`:
```yaml
images:
  - filename: "image-name.jpg"
    source_page: "https://example.com/article"
    source_page_title: "Article Title"
    original_url: "https://example.com/images/photo.jpg"
    alt_text: "Description of image"
    caption: "Optional caption"
    detected_license: null
    attribution_text: "Image from example.com"
    downloaded_at: "2026-02-10T12:00:00Z"
```

## Content Types

### Destination Guides (`destinations/`)
- Country/city travel guides
- Best times to visit
- Top attractions and experiences
- Cultural highlights
- Food and dining recommendations
- Transportation options
- Accommodation suggestions

### Travel Guides (`guides/`)
- Packing guides
- Budget travel tips
- Travel planning advice
- Visa and documentation guides
- Health and safety information
- Transportation guides
- Itinerary planning

### Quick Tips (`tips/`)
- Short, actionable advice
- Best practices
- Common mistakes to avoid
- Quick reference guides
- Money-saving tips
- Safety tips
- Cultural etiquette

### Scraped Content (`scraped/`)
- Web articles
- Expert travel guides
- How-to tutorials
- Destination reviews
- Travel blogs
- **City research data** (from city-research skill)

## Searchability

All files in the `data/` directory are indexed by `KnowledgeService`:

- **Keyword search**: Searches file paths and content
- **Semantic search**: Uses GitHub Copilot SDK for relevance ranking
- **Context injection**: Relevant content is included in AI prompts

To improve searchability:
- Use descriptive filenames
- Include relevant keywords in content
- Add tags at the bottom of markdown files
- Use clear section headings

## Maintenance

### Adding New Content

1. Determine the appropriate subdirectory
2. Create a descriptive filename
3. Follow the markdown format conventions
4. Include source attribution and dates (for scraped content)
5. Add tags for discoverability

### Updating Existing Content

1. Update the "Last updated" date
2. Preserve source attribution
3. Add a note about what changed (if significant)
4. Keep original scraped content for reference

### Removing Content

- Generally avoid removing content
- If removal is necessary, document why
- Consider moving to an archive instead

## Examples

### Good Filename Examples
- ✅ `japan.md`
- ✅ `budget-travel.md`
- ✅ `packing-guide.md`
- ✅ `solo-travel.md`
- ✅ `iceland.md`

### Bad Filename Examples
- ❌ `guide.md` (too generic)
- ❌ `Travel_Guide.md` (wrong case/separator)
- ❌ `japan guide 2026.md` (spaces, no hyphens)

### Good Content Structure
```markdown
# How to Travel Southeast Asia on a Budget

> Source: https://example.com/budget-travel-asia
> Scraped: 2026-02-10

---

## Introduction

Southeast Asia is one of the most affordable travel destinations...

## Accommodation Tips

Budget accommodation options range from hostels to guesthouses...

## Transportation

Getting around Southeast Asia is affordable with...

---

Last updated: 2026-02-10
Tags: budget-travel, southeast-asia, backpacking, accommodation, transportation
```

## City Research Workflow

### Using the City Research Skill

When a user asks to research things to do in a city or opens an issue to research a destination, use the **city-research skill** located at `.github/skills/city-research/`.

#### How to Use

```bash
# Research all categories for a city
npx tsx .github/skills/city-research/scripts/research-city.ts "City Name"

# Research specific categories and save to data/destinations
npx tsx .github/skills/city-research/scripts/research-city.ts "Paris" 3 ./data/destinations/paris-research museums,restaurants,historical
```

#### Where to Save City Research Data

**IMPORTANT**: City research data should be organized in the `data/` directory based on the type of content:

1. **For comprehensive city research** → `data/destinations/{city-name}-research/`
   - Example: `data/destinations/tokyo-research/`
   - Contains: Multiple categories (museums, restaurants, attractions, etc.)
   - Use when: User requests full research of a new city

2. **For specific category research** → `data/scraped/{city-name}-{category}/`
   - Example: `data/scraped/paris-restaurants/`
   - Contains: Single category research (e.g., just restaurants)
   - Use when: User requests specific information about one aspect

3. **For general web scraping** → `data/scraped/{topic-name}/`
   - Example: `data/scraped/mexico-city-activities/`
   - Contains: General web content about a topic
   - Use when: Not using the city-research skill

#### After Research Completion

1. **Review the research summary** (`_research_summary.md`)
2. **Verify content quality** - Check scraped content for relevance
3. **Move to final location** - If needed, reorganize content to appropriate subdirectories
4. **Update knowledge base** - Ensure new content is searchable via KnowledgeService

#### City Research Output Structure

The city-research skill creates:
```
{output-dir}/
├── museums/1-result/, 2-result/...
├── restaurants/1-result/, 2-result/...
├── local-food/...
├── tourist-attractions/...
├── tech/...
├── bars/...
├── markets/...
├── street-food/...
├── historical/...
└── _research_summary.md
```

Each result directory contains:
- `content.md` - Scraped article content with source attribution
- `images/` - Downloaded images (if any)
- `images/_attribution.yaml` - Image source attribution

## Road Trip Research Workflow

### Using the Road Trip Research Skill

When a user asks to research things to do while driving from location A to location B, use the **road-trip-research skill** located at `.github/skills/road-trip-research/`.

#### How to Use

```bash
# Research all categories for a road trip route
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "San Francisco" "Los Angeles"

# Research specific categories with custom output
npx tsx .github/skills/road-trip-research/scripts/research-road-trip.ts "Austin" "Houston" 3 ./data/scraped/austin-houston-trip restaurants,local-food,points-of-interest
```

#### Where to Save Road Trip Research Data

**IMPORTANT**: Road trip research data should be organized in the `data/` directory based on the type of content:

1. **For comprehensive road trip research** → `data/scraped/{origin}-to-{destination}-road-trip/`
   - Example: `data/scraped/san-francisco-to-los-angeles-road-trip/`
   - Contains: Multiple categories (route overview, restaurants, points of interest, etc.)
   - Use when: User requests full road trip research

2. **For well-known routes** → `data/scraped/{route-name}/`
   - Example: `data/scraped/route-66/`, `data/scraped/pacific-coast-highway/`
   - Contains: Research for famous or named routes
   - Use when: Route has a well-known name

3. **For specific category research** → `data/scraped/{origin}-to-{destination}-{category}/`
   - Example: `data/scraped/portland-seattle-food/`
   - Contains: Single category research (e.g., just restaurants)
   - Use when: User requests specific information about one aspect

#### Research Categories

The road-trip-research skill searches for:
- **Route Overview**: General route information and cities along the way
- **Restaurants**: Notable restaurants along the route
- **Local Food**: Regional specialties and local dishes
- **Points of Interest**: Scenic viewpoints, roadside attractions
- **Historical Sites**: Historical landmarks and museums
- **National Parks**: National and state parks near the route
- **Local Experiences**: Unique local experiences and tours

#### After Research Completion

1. **Review the research summary** (`_road_trip_summary.md`)
2. **Verify content quality** - Check scraped content for relevance
3. **Note detour information** - Pay attention to distance/time for detours
4. **Identify key stops** - Look for frequently mentioned places across sources
5. **Update knowledge base** - Ensure new content is searchable via KnowledgeService

#### Road Trip Research Output Structure

The road-trip-research skill creates:
```
{output-dir}/
├── route-overview/1-result/, 2-result/...
├── restaurants/1-result/, 2-result/...
├── local-food/...
├── points-of-interest/...
├── historical-sites/...
├── national-parks/...
├── local-experiences/...
└── _road_trip_summary.md
```

Each result directory contains:
- `content.md` - Scraped article content with source attribution
- `images/` - Downloaded images (if any)
- `images/_attribution.yaml` - Image source attribution

## Notes for Future Agents

- **Always check existing content** before adding new files
- **Use the web-content-scraper skill** for all web scraping tasks (if available)
- **Use the city-research skill** when researching things to do in cities (if available)
- **Use the road-trip-research skill** when researching things to do along a driving route (if available)
- **Maintain attribution** for all external sources
- **Follow naming conventions** to keep the knowledge base organized
- **Test searchability** - ensure new content appears in search results
- **Place city research in appropriate data directories** - See "City Research Workflow" above
- **Place road trip research in appropriate data directories** - See "Road Trip Research Workflow" above

For questions or issues with the knowledge base structure, refer to the main `README.md` in the repository root.
