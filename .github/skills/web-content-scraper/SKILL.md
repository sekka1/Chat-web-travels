---
name: web-content-scraper
description: Scrape and extract main content from webpages, including images with source attribution. Use when a user asks to scrape, fetch, extract, or grab content from a website URL. Extracts the primary article or page content while filtering out ads, headers, footers, navigation, sidebars, and site maps. Downloads relevant images and preserves their source URLs for copyright compliance. Preserves all important details and formatting from the main content.
---

# Web Content Scraper Skill

Extract meaningful content from webpages, filtering out noise like ads, navigation, and boilerplate.

## Overview

This skill fetches webpage content and extracts only the main article or informational content. It automatically filters out:
- Advertisements and promotional content
- Headers and footers
- Navigation menus and sidebars
- Site maps and link directories
- Cookie notices and popups
- Social media widgets

## When to Use

Use this skill when a user:
- Asks to "scrape" a website
- Wants to "grab content" from a URL
- Needs to "extract information" from a webpage
- Asks to "fetch" or "get" the content of a website
- Wants to copy text from a webpage

## Instructions

### Step 1: Validate the URL

Before scraping, verify the URL is valid and accessible. Ensure it starts with `http://` or `https://`.

### Step 2: Fetch the Webpage

Use the `fetch_webpage` tool to retrieve the page content. Set the query to focus on extracting the main article or informational content.

### Step 3: Extract Main Content

Parse the content and filter out noise. The goal is to capture ALL the meaningful information while excluding structural/promotional elements.

**Always Remove:**
- Scripts and style blocks
- Elements with classes containing: ad, ads, advertisement, banner, promo, sponsor
- Navigation elements: `<nav>`, `.nav`, `.menu`, `.navigation`
- Header and footer: `<header>`, `<footer>`, `.header`, `.footer`
- Sidebars: `<aside>`, `.sidebar`, `.side-bar`
- Cookie notices and popups
- Social sharing widgets
- Comment sections
- Related/recommended article sections
- Site maps and link directories
- "Subscribe" or "Sign up" callouts

**Always Preserve (Copy Exactly - Details Matter):**
- Main article/page content - every word
- Headings (h1-h6) with their hierarchy
- All paragraphs in full
- Lists (ordered and unordered) with all items
- Tables with all data
- Code blocks and inline code
- Blockquotes
- Important metadata (author, date, if visible in content)
- **Images with alt text and captions** (see Image Extraction section)
- **Image source URLs for attribution**
- Any data, statistics, or specific details

### Step 4: Format and Return Results

Present the extracted content in clean markdown format:

1. **Title**: Use the page's main heading as an H1
2. **Source**: Include the original URL for reference
3. **Content**: Full extracted content with preserved structure

## Example Output Format

```markdown
# [Page Title]

**Source:** [URL]

---

[Full extracted content preserving all headings, paragraphs, 
lists, tables, code blocks, and formatting exactly as they 
appear in the original]
```

## Content Extraction Priority

When identifying main content, look for these elements in order:

1. `<main>` element
2. `<article>` element
3. `[role="main"]` attribute
4. `.content`, `.main-content`, `.article-content`, `.post-content` classes
5. `#content`, `#main`, `#article` IDs
6. The largest text block in `<body>`

## Handling Different Page Types

### Article/Blog Posts
- Extract the full article text
- Include author and publication date if present
- Preserve all paragraphs and sections

### Documentation Pages
- Extract all documentation content
- Preserve code examples exactly
- Maintain heading hierarchy

### Product Pages
- Extract product descriptions
- Include specifications and features
- Preserve pricing information if present

### Data/Reference Pages
- Extract all tables and data
- Preserve numerical precision
- Include any footnotes or annotations

## Error Handling

| Error | Response |
|-------|----------|
| Invalid URL | "Please provide a valid URL starting with http:// or https://" |
| Connection failed | "Could not connect to [URL]. Please check the URL is correct and accessible." |
| 403/401 errors | "Access denied. This page may require authentication." |
| No content found | "Could not extract main content. The page may be JavaScript-rendered or have an unusual structure." |
| Timeout | "Request timed out. The server may be slow or unavailable." |

## Important Guidelines

1. **Copy everything exactly** - Details matter. Don't summarize or truncate.
2. **Preserve formatting** - Keep headings, lists, tables, and code blocks intact.
3. **Be thorough** - Extract ALL relevant content, not just the first few paragraphs.
4. **Note limitations** - If content appears incomplete, inform the user.
5. **Include source** - Always reference the original URL.

## Image Extraction

Images provide valuable visual context for moss wall care and installation. This skill supports downloading images while preserving attribution for copyright compliance.

### When to Download Images

**Download images that are:**
- Part of the main article/page content (inside `<main>`, `<article>`, `.content`)
- Illustrative or instructional (diagrams, how-to photos, examples)
- Relevant to the user's query topic
- Reasonably sized (width ≥ 100px, height ≥ 100px)

**Skip images that are:**
- Icons, logos, or UI elements (< 50px in either dimension)
- Tracking pixels (1x1 images)
- Advertisement banners
- Social media buttons or share icons
- Decorative backgrounds
- Author avatars or profile pictures
- Navigation or menu images

### Image Detection

Look for images in these elements within the main content area:

```html
<!-- Standard images -->
<img src="..." alt="...">

<!-- Responsive images -->
<img srcset="..." sizes="...">
<picture>
  <source srcset="...">
  <img src="...">
</picture>

<!-- Figure elements with captions -->
<figure>
  <img src="...">
  <figcaption>Image caption</figcaption>
</figure>
```

### Handling Lazy-Loaded Images

Many websites use lazy-loading to defer image loading until they're visible. These images often show SVG placeholders or low-resolution previews initially. To extract the real image URLs:

#### Step 1: Check Data Attributes

Lazy-loaded images store the real URL in data attributes. Check these in order:

| Attribute | Usage |
|-----------|-------|
| `data-src` | Most common lazy-load attribute |
| `data-lazy-src` | WordPress lazy loading |
| `data-original` | Older lazy-load libraries |
| `data-srcset` | Responsive lazy-loaded images |
| `data-lazy-srcset` | WordPress responsive lazy loading |
| `data-full-url` | Full resolution URL |
| `data-large-file` | WordPress large image |
| `data-medium-file` | WordPress medium image |

**Example: Extracting from data attributes**
```html
<!-- What you see in the HTML -->
<img src="data:image/svg+xml,..." 
     data-src="https://example.com/real-image.jpg"
     data-srcset="https://example.com/image-800.jpg 800w,
                  https://example.com/image-1200.jpg 1200w"
     alt="Moss wall installation">

<!-- Extract: data-src or largest from data-srcset -->
```

#### Step 2: Check `<noscript>` Fallbacks

Many lazy-load implementations include a `<noscript>` tag with the real image for users without JavaScript:

```html
<img src="placeholder.svg" data-src="real-image.jpg">
<noscript>
  <img src="https://example.com/real-image.jpg" alt="Moss wall">
</noscript>
```

**Always check for `<noscript>` siblings** of lazy-loaded images.

#### Step 3: Parse `srcset` for Best Quality

When `srcset` or `data-srcset` is available, extract the highest resolution:

```html
<img srcset="image-400.jpg 400w,
             image-800.jpg 800w,
             image-1200.jpg 1200w"
     sizes="(max-width: 600px) 400px, 800px"
     src="image-800.jpg">
```

**Resolution priority:**
1. Select the largest `w` (width) descriptor
2. Or the highest `x` (pixel density) descriptor
3. Fall back to the `src` attribute

#### Step 4: Check `<picture>` Sources

Modern responsive images use `<picture>` elements with multiple sources:

```html
<picture>
  <source srcset="image.webp" type="image/webp">
  <source srcset="image.jpg" type="image/jpeg">
  <img src="fallback.jpg" alt="...">
</picture>
```

**Prefer formats in this order:** WebP > JPEG > PNG (for photos)

#### Step 5: Identify Placeholder Patterns

Skip or replace these placeholder patterns:

| Pattern | Description |
|---------|-------------|
| `data:image/svg+xml,...` | Inline SVG placeholder |
| `data:image/gif;base64,R0lGOD...` | 1x1 transparent GIF |
| `about:blank` | Empty placeholder |
| URLs containing `placeholder` | Placeholder images |
| URLs containing `lazy` or `loading` | Loading indicators |
| Base64 strings < 1KB | Tiny placeholder images |

#### Step 6: WordPress-Specific Handling

WordPress sites often use this pattern:

```html
<img src="data:image/svg+xml,%3Csvg%20..."
     data-lazy-src="https://example.com/wp-content/uploads/2026/01/moss.jpg"
     data-lazy-srcset="https://example.com/.../moss-300x200.jpg 300w,
                       https://example.com/.../moss-768x512.jpg 768w,
                       https://example.com/.../moss-1024x683.jpg 1024w"
     class="lazyload">
```

**WordPress URL pattern:** `/wp-content/uploads/YYYY/MM/filename.ext`

Extract the largest size from `data-lazy-srcset` or use `data-lazy-src`.

#### Step 7: JavaScript-Rendered Images (Advanced)

For images that require JavaScript execution:

1. **Check for JSON-LD data** - Some sites embed image URLs in structured data:
   ```html
   <script type="application/ld+json">
   {
     "@type": "Article",
     "image": "https://example.com/article-image.jpg"
   }
   </script>
   ```

2. **Check Open Graph meta tags:**
   ```html
   <meta property="og:image" content="https://example.com/share-image.jpg">
   ```

3. **If images are truly JS-rendered**, note the limitation and suggest the user:
   - Try the page's "Print" or "Reader" view
   - Check if the site has an RSS feed with full images
   - Use a headless browser tool if available

### Lazy-Load Detection Summary

```
For each <img> in main content:
  1. Is src a placeholder? (SVG data URI, tiny base64, blank)
     → YES: Look for real URL in data attributes
     → NO: Use src directly
  
  2. Check data-src, data-lazy-src, data-original
     → Found: Use this URL
  
  3. Check data-srcset, data-lazy-srcset, srcset
     → Found: Extract highest resolution URL
  
  4. Check sibling <noscript> tag
     → Found: Extract img src from noscript
  
  5. Check <picture> parent for <source> elements
     → Found: Use best format source
  
  6. Still no real URL?
     → Check JSON-LD and og:image meta tags
     → Note as "lazy-loaded, URL not extractable"
```

### Using the Playwright Script

For pages with JavaScript-rendered lazy-loaded images that cannot be extracted via static HTML parsing, use the Playwright-based scraper script:

#### Prerequisites

Install Playwright in the project:

```bash
npm install playwright
npx playwright install chromium
```

#### Usage

```bash
# Basic usage - scrapes URL and saves to timestamped directory
npx ts-node .github/skills/web-content-scraper/scripts/scrape-lazy-images.ts <url>

# Specify output directory
npx ts-node .github/skills/web-content-scraper/scripts/scrape-lazy-images.ts <url> <output-dir>
```

**Examples:**

```bash
# Scrape a moss care guide
npx ts-node .github/skills/web-content-scraper/scripts/scrape-lazy-images.ts \
  https://mossandstonegardens.com/blog/how-to-care-for-moss/ \
  ./data/scraped/moss-care

# Scrape with default output location
npx ts-node .github/skills/web-content-scraper/scripts/scrape-lazy-images.ts \
  https://example.com/article-with-images
```

#### Output Structure

The script creates the following output:

```
<output-dir>/
├── content.md           # Extracted page content as markdown
└── images/
    ├── _attribution.yaml  # Image attribution manifest
    ├── image-1.jpg
    ├── image-2.png
    └── ...
```

#### How It Works

1. **Launches headless browser** - Uses Chromium via Playwright
2. **Scrolls entire page** - Triggers lazy-load for all images
3. **Extracts image URLs** - Checks `data-src`, `data-lazy-src`, `srcset`, and `<noscript>` fallbacks
4. **Downloads images** - Saves to output directory with deduplication
5. **Generates attribution** - Creates YAML manifest with source URLs and metadata
6. **Extracts content** - Converts main content to clean markdown

#### Script Options

The script automatically handles:

| Feature | Description |
|---------|-------------|
| **Scroll triggering** | Scrolls page in 500px increments to trigger lazy loading |
| **Placeholder detection** | Skips SVG data URIs and tiny base64 placeholders |
| **srcset parsing** | Extracts highest resolution from responsive images |
| **noscript fallback** | Checks `<noscript>` tags for non-JS image URLs |
| **URL resolution** | Converts relative URLs to absolute |
| **Deduplication** | Avoids downloading the same image twice |
| **Attribution** | Records source URL, alt text, caption, and dimensions |

#### When to Use the Script

| Scenario | Use Script? |
|----------|-------------|
| WordPress sites with `data-lazy-src` | ✅ Yes |
| Images visible only after scroll | ✅ Yes |
| SVG placeholder visible in `src` | ✅ Yes |
| Regular `<img src="...">` tags | ❌ No - use `fetch_webpage` |
| Images behind authentication | ❌ No - requires login handling |

### URL Resolution

Convert relative URLs to absolute URLs before downloading:

| Original | Page URL | Resolved |
|----------|----------|----------|
| `/images/moss.jpg` | `https://example.com/article` | `https://example.com/images/moss.jpg` |
| `../photos/wall.png` | `https://example.com/guides/care` | `https://example.com/photos/wall.png` |
| `//cdn.example.com/img.webp` | `https://example.com/page` | `https://cdn.example.com/img.webp` |

### Supported Formats

| Format | Extension | Notes |
|--------|-----------|-------|
| JPEG | `.jpg`, `.jpeg` | Photos, most common |
| PNG | `.png` | Diagrams, screenshots |
| WebP | `.webp` | Modern format, good compression |
| GIF | `.gif` | Animations, simple graphics |
| SVG | `.svg` | Vector diagrams, icons |

### File Naming Convention

Downloaded images use this naming pattern:

```
{source-domain}_{content-hash}_{original-name}.{ext}
```

**Examples:**
- `example-com_a1b2c3_moss-wall-care.jpg`
- `gardening-guide_d4e5f6_installation-step-3.png`

### Storage Location

Save downloaded images to:

```
data/images/scraped/
├── {domain}/
│   ├── {image-file}
│   └── {image-file}
└── _attribution.yaml
```

## Image Attribution

**All downloaded images MUST have attribution metadata.** This preserves copyright information and source references.

### Attribution Manifest

Maintain a single attribution file at `data/images/scraped/_attribution.yaml`:

```yaml
# Image Attribution Manifest
# Auto-generated by web-content-scraper skill
# DO NOT manually edit source URLs

images:
  - filename: "example-com_a1b2c3_moss-wall-care.jpg"
    source_page: "https://example.com/moss-wall-guide"
    source_page_title: "Complete Moss Wall Care Guide"
    original_url: "https://example.com/images/moss-wall-care.jpg"
    alt_text: "Living moss wall in a modern office space"
    caption: "A thriving sheet moss installation after 6 months"
    detected_license: null  # null if not detected
    attribution_text: "Image from example.com"
    downloaded_at: "2026-02-03T10:30:00Z"
    dimensions:
      width: 1200
      height: 800

  - filename: "garden-blog_x7y8z9_humidity-chart.png"
    source_page: "https://garden-blog.com/moss-humidity"
    source_page_title: "Humidity Requirements for Indoor Moss"
    original_url: "https://cdn.garden-blog.com/charts/humidity.png"
    alt_text: "Chart showing optimal humidity ranges for different moss types"
    caption: null
    detected_license: "CC BY 4.0"
    attribution_text: "© Garden Blog, licensed under CC BY 4.0"
    downloaded_at: "2026-02-03T11:15:00Z"
    dimensions:
      width: 800
      height: 600
```

### License Detection

When scraping, look for license information in:

1. **Image metadata** - EXIF/XMP data containing copyright
2. **Nearby text** - Captions mentioning "©", "CC", "Creative Commons"
3. **Page footer** - Site-wide license declarations
4. **Schema.org markup** - `"license"` property in JSON-LD
5. **rel="license"** - Links near images

**Common licenses to detect:**
- `CC0` - Public domain
- `CC BY` - Attribution required
- `CC BY-SA` - Attribution + ShareAlike
- `CC BY-NC` - Attribution + NonCommercial
- `All rights reserved` - Standard copyright

### Displaying Images with Attribution

When including images in responses, ALWAYS cite the source:

**Inline format:**
```markdown
![Alt text](data/images/scraped/example-com_a1b2c3_moss.jpg)

*📷 Image source: [example.com](https://example.com/original-page)*
```

**With caption:**
```markdown
![Sheet moss wall installation](data/images/scraped/example-com_a1b2c3_moss.jpg)

*A thriving sheet moss wall after proper installation*
*📷 Source: [Example Garden Guide](https://example.com/moss-guide) • © example.com*
```

**For Creative Commons:**
```markdown
![Humidity chart for moss care](data/images/scraped/garden-blog_x7y8z9_chart.png)

*📷 Source: [Garden Blog](https://garden-blog.com/moss-humidity) • CC BY 4.0*
```

### Attribution Requirements by License

| License | Requirements |
|---------|--------------|
| `CC0` / Public Domain | Attribution appreciated but not required |
| `CC BY` | Must credit author/source, link to license |
| `CC BY-SA` | Credit + link + share derivatives under same license |
| `CC BY-NC` | Credit + link + non-commercial use only |
| `All rights reserved` | Link to source, use for reference/educational purposes |
| `Unknown` | Always link to source page, note "© original author" |

## Example Output with Images

When scraping a page with images, include them in the output:

```markdown
# Complete Moss Wall Care Guide

**Source:** [https://example.com/moss-wall-guide](https://example.com/moss-wall-guide)

---

## Introduction

Living moss walls bring natural beauty to indoor spaces...

![Living moss wall installation](data/images/scraped/example-com_a1b2c3_moss-wall.jpg)

*A mature sheet moss wall displaying optimal growth*
*📷 Source: [example.com](https://example.com/moss-wall-guide)*

## Humidity Requirements

Moss thrives in humidity between 40-60%...

![Humidity chart](data/images/scraped/example-com_d4e5f6_humidity-chart.png)

*Optimal humidity ranges by moss type*
*📷 Source: [example.com](https://example.com/moss-wall-guide)*

---

### Images Downloaded

| Image | Source | License |
|-------|--------|---------|
| moss-wall.jpg | example.com | © All rights reserved |
| humidity-chart.png | example.com | © All rights reserved |
```

## Tour Listings Scraper

For scraping tour and event listings from websites like GuruWalk, GetYourGuide, Viator, and similar platforms, use the specialized tour listings scraper script.

### Prerequisites

```bash
npm install playwright
npx playwright install chromium
```

### Usage

```bash
# Basic usage - scrapes URL and saves to specified directory
npx tsx .github/skills/web-content-scraper/scripts/scrape-tour-listings.ts <url> <output-dir>
```

**Examples:**

```bash
# Scrape walking tours from GuruWalk
npx tsx .github/skills/web-content-scraper/scripts/scrape-tour-listings.ts \
  https://www.guruwalk.com/walks/mexico-city \
  ./data/scraped/mexico-city-tours

# Scrape with file:// URL for testing
npx tsx .github/skills/web-content-scraper/scripts/scrape-tour-listings.ts \
  file:///path/to/test-tours.html \
  ./data/scraped/test-tours
```

### What It Extracts

The scraper extracts structured tour information:

| Field | Description |
|-------|-------------|
| `title` | Tour name/title |
| `guide` | Guide or host name |
| `description` | **Full tour description** (not truncated) |
| `url` | Link to tour details |
| `datetime` | Tour date and time (if available) |
| `duration` | Tour length (if available) |
| `location` | Meeting point or area (if available) |
| `language` | Available languages (if available) |
| `rating` | User rating/reviews (if available) |
| `price` | Cost or pricing info (if available) |
| `imageUrl` | Tour image (if available) |

### Features

#### Multi-Strategy Extraction

The scraper uses multiple strategies to extract data across different website structures:

**Title extraction:**
- Look for `<h1>`, `<h2>`, `<h3>` elements with tour-related classes
- Check `[data-testid*="title"]`, `[class*="title"]`, `[class*="name"]`

**Guide extraction:**
- Look for elements with classes: `guide`, `host`, `organizer`
- Parse text patterns like "Guide: Name" or "By Name"

**Description extraction (3 strategies):**
1. **Strategy 1:** Look for elements with `description` in class/id
   - Prefer **visible** elements over hidden ones
   - Sort by text length (longest first)

2. **Strategy 2:** Find standalone `<p>` tags outside metadata containers
   - Only include **visible** paragraphs
   - Skip metadata sections (`.meta`, `.info`, `.details`)
   - Exclude text matching patterns like "Guide:", "Date:", etc.
   - Sort by length (longest first)

3. **Strategy 3:** Extract long sentences from all text (fallback)

#### Description Quality Validation

The scraper validates that extracted descriptions contain meaningful tour information:

**✅ Valid Description:**
- Contains actual tour content (places, activities, what you'll see)
- More than 100 characters
- Not just a repetition of the tour title

**❌ Invalid Description (will attempt to expand):**
- Description is just the tour title repeated
- More than 70% of title words appear in a short description
- Description is just guide name or metadata

#### Truncated Description Detection & Expansion

The scraper automatically detects and expands truncated descriptions:

**Truncation indicators:**
- Text ending with `...` (three periods)
- Text ending with `…` (ellipsis character)
- Text ending with `..` (two periods)

**Expansion process:**
1. Find all truncated descriptions in tour listings
2. Look for expand/show more buttons near truncated text:
   - Button text patterns: "more", "expand", "show", "read", "ver más", "leer más"
   - Case-insensitive matching
3. Click buttons to reveal full content
4. Wait for content to animate/display
5. Re-extract descriptions (now using visible full content)

**Button detection:**
```html
<!-- Detects buttons like these: -->
<button>Show More</button>
<button>Read More</button>
<button>Ver más</button>
<a href="#">Expand</a>
<span onclick="...">Show full description</span>
```

#### Detail Page Description Fetching

**Important:** Most tour listing pages don't show full descriptions—they only display titles and metadata. To get actual tour descriptions, the scraper automatically:

1. Extracts tour URLs from the listing page
2. Visits each tour's individual detail page
3. Extracts the full description using multiple strategies:
   - Elements with "description", "about", "overview" in class/ID
   - Long paragraphs in main content areas
4. Merges descriptions back into the tour data

**Progress reporting:**
```
🔗 Fetching full descriptions from 30 tour detail pages...
  ✅ [1/30] Fetched description (1163 chars)
  ✅ [2/30] Fetched description (987 chars)
  ...
📊 Successfully fetched 28 out of 30 descriptions
```

**Configuration:**
- Set `maxDetailPages: 0` for unlimited (fetches all tours)
- Set `maxDetailPages: 10` to limit (useful for testing or faster runs)

**Result:** Instead of truncated metadata like:
```
Description: "Historic Center Walking Tour...4.79(2011)2 hours..."
```

You get full, detailed descriptions:
```
Description: "If you're planning your first visit to the vibrant Mexico City,
this is the perfect tour for you! Designed for travelers looking to explore the
historical and cultural richness of this metropolis in a short time, our tour
will take you on a fascinating journey through time. Complete Exploration:
Discover the three great eras of Mexico: pre-Hispanic Mexico, the viceroyalty,
and the Republic. Local Flavors: Learn how to identify the best places to eat..."
```

#### "Load More" Button Handling

The scraper automatically clicks "load more" buttons to retrieve all tours:

1. Counts initial visible tours
2. Searches for "load more" buttons using multiple strategies:
   - Data attributes: `[data-testid*="load-more"]`
   - Class names: `[class*="load-more"]`, `[class*="loadMore"]`
   - Button text containing "more" or "más"
3. Clicks button and waits for new content to load
4. Repeats until no more tours are loaded
5. Tracks total clicks and tours loaded

### Output Structure

```
<output-dir>/
├── tours.json           # Structured JSON with all tour data
├── tours.md            # Human-readable markdown format
└── _metadata.json      # Scraping metadata (counts, timestamps)
```

#### tours.json

```json
[
  {
    "title": "Historic Center Walking Tour",
    "guide": "Carlos Mendez",
    "description": "Discover the heart of Mexico City with this comprehensive walking tour. We'll visit the majestic Metropolitan Cathedral, explore the National Palace with Diego Rivera's famous murals, and walk through the ancient Templo Mayor ruins. You'll learn about the fascinating history from the Aztec Empire to modern times.",
    "url": "https://www.guruwalk.com/walks/12345",
    "datetime": "February 25, 2026 at 10:00 AM",
    "duration": "2.5 hours",
    "location": "Palacio de Bellas Artes",
    "language": "English, Spanish",
    "rating": "⭐ 4.9 (245 reviews)",
    "price": "Free (tips appreciated)"
  }
]
```

#### tours.md

```markdown
# Walking Tours

> Source: https://www.guruwalk.com/walks/mexico-city
> Scraped: 2026-02-11T10:30:00.000Z
> Initial tours visible: 8
> "Load more" clicks: 2
> Additional tours loaded: 12
> Total tours: 20

---

## 1. Historic Center Walking Tour

**Guide:** Carlos Mendez

**Description:** Discover the heart of Mexico City with this comprehensive walking tour...

**More Info:** [View Tour](https://www.guruwalk.com/walks/12345)

---
```

#### _metadata.json

```json
{
  "sourceUrl": "https://www.guruwalk.com/walks/mexico-city",
  "scrapedAt": "2026-02-11T10:30:00.000Z",
  "initialCount": 8,
  "loadMoreClicks": 2,
  "finalCount": 20,
  "additionalLoaded": 12,
  "outputDir": "./data/scraped/mexico-city-tours"
}
```

### Description Quality Guidelines

When validating scraped tour descriptions for current and future iterations:

#### ❌ Invalid Descriptions - Keep Looking

**Description is just repeating the title:**
```
Title: "Historic Center Walking Tour"
Description: "Historic Center Walking Tour"  ← Invalid, just the title
```

**Description is guide name or metadata:**
```
Title: "Roma Norte Street Art Tour"
Description: "Maria Rodriguez"  ← Invalid, this is the guide name
```

**Description is too generic:**
```
Title: "Food Market Tour"
Description: "A tour of the market"  ← Invalid, no useful information
```

#### ✅ Valid Descriptions - What We Want

**Describes what you'll see and do:**
```
Title: "Historic Center Walking Tour"
Description: "Discover the heart of Mexico City with this comprehensive
walking tour of the historic center. We'll visit the majestic Metropolitan
Cathedral, explore the National Palace with Diego Rivera's famous murals,
and walk through the ancient Templo Mayor ruins. You'll learn about the
fascinating history from the Aztec Empire to modern times, see the vibrant
Zócalo plaza where cultural events take place, and discover hidden
architectural gems in the surrounding colonial buildings."
```

**Contains specific places, activities, and details:**
- ✅ Mentions specific locations (Metropolitan Cathedral, National Palace)
- ✅ Describes activities (explore, walk through, learn about)
- ✅ Includes details (Diego Rivera murals, Aztec Empire history)
- ✅ Full sentences with context

#### Detecting Truncation

**If description ends with these patterns, it's truncated:**
- `...` (three periods)
- `…` (ellipsis character)
- `..` (two periods)
- Any variation in different languages

**Example truncated description:**
```
"Discover the heart of Mexico City with this comprehensive walking tour..."
```

**When truncation is detected:**
1. Look for expand/show more buttons nearby
2. Click button to reveal full content
3. Re-extract the now-visible full description
4. Verify the "..." is gone and content is complete

### Generic Design for Multiple Tour Sites

This scraper is designed to work across different tour listing websites:

**Supported site types:**
- GuruWalk-style listings
- GetYourGuide tour pages
- Viator experiences
- Local tour company websites
- Event listing pages

**How it adapts:**
- Multiple CSS selector strategies for each data field
- Pattern matching for different HTML structures
- Text pattern recognition (e.g., "Guide: Name")
- Flexible button detection for different UI implementations
- Visibility-aware extraction (prefers visible over hidden content)

**Adding new extraction techniques:**

As you encounter new website variations:
1. The multi-strategy pattern makes it easy to add new selectors
2. Add new strategies to the extraction arrays
3. Test with the new site structure
4. Strategies are tried in order until one succeeds

## Limitations

- **JavaScript-rendered pages**: Content loaded via JavaScript may not be captured
- **Authentication required**: Cannot access login-protected content
- **Rate limiting**: Some sites may block repeated requests
- **Very large pages**: May need to extract in sections
- **Image hotlink protection**: Some sites block direct image downloads
- **Dynamic image URLs**: URLs with tokens/signatures may expire
- **Large images**: Files over 10MB should be skipped to conserve storage
- **Lazy-loaded images without data attributes**: Some implementations require JavaScript execution to reveal URLs (see "Handling Lazy-Loaded Images" for workarounds)
