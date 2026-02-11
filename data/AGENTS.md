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

## Notes for Future Agents

- **Always check existing content** before adding new files
- **Use the web-content-scraper skill** for all web scraping tasks (if available)
- **Maintain attribution** for all external sources
- **Follow naming conventions** to keep the knowledge base organized
- **Test searchability** - ensure new content appears in search results

For questions or issues with the knowledge base structure, refer to the main `README.md` in the repository root.
