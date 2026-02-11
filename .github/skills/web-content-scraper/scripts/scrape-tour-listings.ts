#!/usr/bin/env npx tsx
/**
 * Generic Tour Listings Scraper
 *
 * This script scrapes tour listings from various tour websites, handling
 * dynamic content loading via "load more" buttons.
 *
 * Supports multiple extraction strategies to work with different website structures.
 *
 * Usage:
 *   npx tsx scripts/scrape-tour-listings.ts <url> [output-dir]
 *
 * Examples:
 *   npx tsx scripts/scrape-tour-listings.ts "https://www.guruwalk.com/a/search?beginsAt=2026-02-25&endsAt=2026-02-25&vertical=free-tour&hub=mexico-city"
 *   npx tsx scripts/scrape-tour-listings.ts "https://www.getyourguide.com/..." ./data/scraped/paris-tours
 *   npx tsx scripts/scrape-tour-listings.ts "https://www.viator.com/..." ./data/scraped/london-tours
 *
 * Output:
 *   - tours.json: Structured tour data
 *   - tours.md: Formatted markdown with all tour information
 *   - _metadata.json: Scraping metadata (timestamp, counts, etc.)
 */

import { chromium, type Browser, type Page } from 'playwright';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ============================================================================
// Types
// ============================================================================

interface Tour {
  /** Tour title */
  title: string;
  /** Tour guide/organizer name */
  guide?: string;
  /** Tour description */
  description?: string;
  /** Tour date and time */
  datetime?: string;
  /** Tour duration */
  duration?: string;
  /** Meeting point/location */
  location?: string;
  /** Tour language */
  language?: string;
  /** Number of reviews/rating */
  rating?: string;
  /** Price information */
  price?: string;
  /** Link to tour details page */
  url?: string;
  /** Tour image URL */
  imageUrl?: string;
}

interface ScrapingMetadata {
  /** Source URL */
  sourceUrl: string;
  /** Timestamp when scraping started */
  scrapedAt: string;
  /** Number of tours initially visible */
  initialCount: number;
  /** Number of times "load more" was clicked */
  loadMoreClicks: number;
  /** Total tours loaded after all "load more" clicks */
  finalCount: number;
  /** Additional tours loaded via "load more" */
  additionalLoaded: number;
  /** Output directory */
  outputDir: string;
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  /** Viewport dimensions */
  viewport: { width: 1920, height: 1080 },
  /** Maximum time to wait for page load (ms) */
  pageTimeout: 60000,
  /** Wait time after clicking load more (ms) */
  loadMoreWaitTime: 3000,
  /** Maximum number of "load more" clicks */
  maxLoadMoreClicks: 10,
  /** User agent string */
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

// ============================================================================
// Main Scraper Class
// ============================================================================

class TourListingScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private metadata: ScrapingMetadata;

  constructor(sourceUrl: string, outputDir: string) {
    this.metadata = {
      sourceUrl,
      scrapedAt: new Date().toISOString(),
      initialCount: 0,
      loadMoreClicks: 0,
      finalCount: 0,
      additionalLoaded: 0,
      outputDir,
    };
  }

  /**
   * Initialize the browser
   */
  async init(): Promise<void> {
    console.log('🚀 Launching browser...');
    this.browser = await chromium.launch({
      headless: true,
    });

    const context = await this.browser.newContext({
      viewport: CONFIG.viewport,
      userAgent: CONFIG.userAgent,
    });

    this.page = await context.newPage();
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  /**
   * Count the number of tour items currently visible
   */
  private async countTourItems(): Promise<number> {
    if (!this.page) throw new Error('Page not initialized');

    // Try multiple selectors that might contain tour items
    const count = await this.page.evaluate(() => {
      // Try common selectors for tour listings
      const selectors = [
        '[data-testid*="tour"]',
        '.tour-item',
        '.tour-card',
        '[class*="tour-"]',
        '[class*="Tour"]',
        'article',
        '[role="article"]',
        '.card',
        '[class*="card"]',
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          return elements.length;
        }
      }

      // Fallback: count any significant content blocks
      const genericCards = document.querySelectorAll('[class*="card"], [class*="item"]');
      return genericCards.length;
    });

    return count;
  }

  /**
   * Click "load more" button if it exists
   * Returns true if button was found and clicked, false otherwise
   */
  private async clickLoadMore(): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized');

    console.log('🔍 Looking for "load more" button...');

    // Try to find and click the load more button
    const clicked = await this.page.evaluate(() => {
      // Try various selectors for load more buttons
      const selectors = [
        '[data-testid*="load-more"]',
        '[class*="load-more"]',
        '[class*="loadMore"]',
        '[class*="show-more"]',
        '[id*="load-more"]',
        '[id*="loadMore"]',
        'button[class*="more"]',
        'a[class*="more"]',
      ];

      for (const selector of selectors) {
        const button = document.querySelector(selector) as HTMLElement;
        if (button && button.offsetParent !== null) {
          // Check if button is visible
          button.click();
          return true;
        }
      }

      // Try to find any button with text containing "more" or "más"
      const allButtons = Array.from(document.querySelectorAll('button, a'));
      for (const btn of allButtons) {
        const text = btn.textContent?.toLowerCase() || '';
        if (
          (text.includes('more') || text.includes('más')) &&
          (btn as HTMLElement).offsetParent !== null
        ) {
          (btn as HTMLElement).click();
          return true;
        }
      }

      return false;
    });

    if (clicked) {
      console.log('  ✅ Found and clicked "load more" button');
      // Wait for new content to load
      await this.page.waitForTimeout(CONFIG.loadMoreWaitTime);
      return true;
    } else {
      console.log('  ℹ️  No "load more" button found');
      return false;
    }
  }

  /**
   * Expand truncated descriptions by clicking "show more" buttons
   */
  private async expandDescriptions(): Promise<number> {
    if (!this.page) throw new Error('Page not initialized');

    console.log('🔍 Looking for truncated descriptions to expand...');

    const expandedCount = await this.page.evaluate(() => {
      let count = 0;

      // Find all tour containers
      const selectors = [
        '[data-testid*="tour"]',
        '.tour-item',
        '.tour-card',
        '[class*="tour-"]',
        '[class*="Tour"]',
        'article',
        '[role="article"]',
      ];

      let tourElements: Element[] = [];
      for (const selector of selectors) {
        tourElements = Array.from(document.querySelectorAll(selector));
        if (tourElements.length > 0) {
          break;
        }
      }

      for (const element of tourElements) {
        // Look for description text ending with "..." or similar truncation indicators
        const paragraphs = Array.from(element.querySelectorAll('p'));
        for (const p of paragraphs) {
          const text = p.textContent?.trim() || '';

          // Check if text appears truncated
          const isTruncated = text.endsWith('...') ||
                             text.endsWith('…') ||
                             text.endsWith('..') ||
                             text.match(/\.{2,}$/);

          if (isTruncated) {
            // Look for expand/show more buttons near this paragraph
            const expandSelectors = [
              'button[class*="expand"]',
              'button[class*="more"]',
              'button[class*="show"]',
              'a[class*="expand"]',
              'a[class*="more"]',
              'a[class*="show-more"]',
              'span[class*="expand"]',
              'div[class*="expand"]',
            ];

            for (const btnSelector of expandSelectors) {
              // Look within the same element or nearby siblings
              const btn = element.querySelector(btnSelector) as HTMLElement;
              if (btn && btn.offsetParent !== null) {
                // Check if button text suggests it's for expanding
                const btnText = btn.textContent?.toLowerCase() || '';
                if (btnText.includes('more') ||
                    btnText.includes('expand') ||
                    btnText.includes('show') ||
                    btnText.includes('read') ||
                    btnText.includes('ver más') ||
                    btnText.includes('leer más')) {
                  btn.click();
                  count++;
                  break;
                }
              }
            }
          }
        }
      }

      return count;
    });

    if (expandedCount > 0) {
      console.log(`  ✅ Expanded ${expandedCount} truncated descriptions`);
      // Wait for content to load after expansion
      await this.page.waitForTimeout(1000);
    } else {
      console.log('  ℹ️  No truncated descriptions found');
    }

    return expandedCount;
  }

  /**
   * Extract tour information from the page
   */
  private async extractTours(): Promise<Tour[]> {
    if (!this.page) throw new Error('Page not initialized');

    console.log('📋 Extracting tour information...');

    const tours = await this.page.evaluate(() => {
      const results: Tour[] = [];

      // Try to find tour containers
      const selectors = [
        '[data-testid*="tour"]',
        '.tour-item',
        '.tour-card',
        '[class*="tour-"]',
        '[class*="Tour"]',
        'article',
        '[role="article"]',
        '.card',
        '[class*="card"]',
      ];

      let tourElements: Element[] = [];
      for (const selector of selectors) {
        tourElements = Array.from(document.querySelectorAll(selector));
        if (tourElements.length > 0) {
          break;
        }
      }

      for (const element of tourElements) {
        const tour: Tour = {
          title: '',
        };

        // Extract title - try various selectors
        const titleSelectors = ['h2', 'h3', 'h4', '[class*="title"]', '[class*="Title"]'];
        for (const sel of titleSelectors) {
          const titleEl = element.querySelector(sel);
          if (titleEl && titleEl.textContent?.trim()) {
            tour.title = titleEl.textContent.trim();
            break;
          }
        }

        // Skip if no title found
        if (!tour.title) {
          tour.title = element.textContent?.trim().slice(0, 100) || 'Untitled Tour';
        }

        // Extract guide name - try multiple strategies
        // Strategy 1: Look for elements with "guide" in class/id
        let guideEl = element.querySelector('[class*="guide"], [id*="guide"], [class*="host"], [class*="organizer"]');
        if (guideEl) {
          tour.guide = guideEl.textContent?.trim();
        }

        // Strategy 2: Look for text patterns like "Guide: Name" or "By Name"
        if (!tour.guide) {
          const textContent = element.textContent || '';
          const guideMatch = textContent.match(/(?:Guide|Host|By|Organizer):\s*([^\n]+)/i);
          if (guideMatch) {
            tour.guide = guideMatch[1].trim();
          }
        }

        // Extract description - try multiple strategies
        // Strategy 1: Look for elements with "description" in class/id (prefer visible, longer content)
        const descElements = Array.from(element.querySelectorAll('[class*="description"], [class*="Description"], [id*="description"]'));
        if (descElements.length > 0) {
          // Filter to visible elements and sort by text length (longest first)
          const visibleDesc = descElements
            .filter((el: Element) => {
              const htmlEl = el as HTMLElement;
              return htmlEl.offsetParent !== null && // Element is visible
                     getComputedStyle(htmlEl).display !== 'none' &&
                     getComputedStyle(htmlEl).visibility !== 'hidden';
            })
            .map((el: Element) => ({
              element: el,
              text: el.textContent?.trim() || ''
            }))
            .filter(item => item.text.length > 20)
            .sort((a, b) => b.text.length - a.text.length);

          if (visibleDesc.length > 0) {
            tour.description = visibleDesc[0].text;
          }
        }

        // Strategy 2: Find standalone <p> tags that are NOT inside metadata containers (prefer visible, longer content)
        if (!tour.description) {
          const paragraphs = Array.from(element.querySelectorAll('p'))
            .filter((p: Element) => {
              const htmlP = p as HTMLElement;
              // Only include visible paragraphs
              return htmlP.offsetParent !== null &&
                     getComputedStyle(htmlP).display !== 'none' &&
                     getComputedStyle(htmlP).visibility !== 'hidden';
            })
            .map((p: Element) => ({
              element: p,
              text: p.textContent?.trim() || '',
              parent: (p as HTMLElement).parentElement
            }))
            .filter(item => {
              // Skip if it's inside a metadata container or if it looks like metadata
              const isInMeta = item.parent?.className?.includes('meta') ||
                             item.parent?.className?.includes('info') ||
                             item.parent?.className?.includes('details');
              const looksLikeMetadata = /^(Guide|Host|Date|Time|Duration|Location|Language|Rating|Price|By):/i.test(item.text);
              return !isInMeta && !looksLikeMetadata && item.text.length > 20;
            })
            .sort((a, b) => b.text.length - a.text.length); // Sort by length, longest first

          if (paragraphs.length > 0) {
            tour.description = paragraphs[0].text;
          }
        }

        // Strategy 3: If still no description, look for any text node that's long enough
        if (!tour.description) {
          const allText = element.textContent || '';
          // Try to extract a sentence that's not the title
          const sentences = allText.split(/[.!?]\s+/).filter(s =>
            s.trim().length > 30 &&
            s.trim() !== tour.title &&
            !/^(Guide|Host|Date|Time|Duration|Location|Language|Rating|Price)/i.test(s)
          );
          if (sentences.length > 0) {
            tour.description = sentences[0].trim();
          }
        }

        // Validate description quality
        if (tour.description) {
          // Check if description is just a repetition of the title
          const titleWords = tour.title.toLowerCase().split(/\s+/);
          const descWords = tour.description.toLowerCase().split(/\s+/);
          const matchingWords = titleWords.filter(w => descWords.includes(w) && w.length > 3);

          // If more than 70% of title words are in description and description is short, it's likely just repeating the title
          if (matchingWords.length / titleWords.length > 0.7 && tour.description.length < 100) {
            tour.description = undefined; // Mark as invalid, will try to expand
          }
        }

        // Extract datetime
        const dateEl = element.querySelector('[class*="date"], [class*="time"], time');
        if (dateEl) {
          tour.datetime = dateEl.textContent?.trim() || dateEl.getAttribute('datetime') || undefined;
        }

        // Extract duration
        const durationEl = element.querySelector('[class*="duration"]');
        if (durationEl) {
          tour.duration = durationEl.textContent?.trim();
        }

        // Extract location
        const locationEl = element.querySelector('[class*="location"], [class*="place"], [class*="address"]');
        if (locationEl) {
          tour.location = locationEl.textContent?.trim();
        }

        // Extract language
        const langEl = element.querySelector('[class*="language"], [class*="lang"]');
        if (langEl) {
          tour.language = langEl.textContent?.trim();
        }

        // Extract rating
        const ratingEl = element.querySelector('[class*="rating"], [class*="review"], [class*="star"]');
        if (ratingEl) {
          tour.rating = ratingEl.textContent?.trim();
        }

        // Extract price
        const priceEl = element.querySelector('[class*="price"], [class*="cost"]');
        if (priceEl) {
          tour.price = priceEl.textContent?.trim();
        }

        // Extract URL
        const linkEl = element.querySelector('a[href]') as HTMLAnchorElement;
        if (linkEl) {
          tour.url = linkEl.href;
        }

        // Extract image
        const imgEl = element.querySelector('img') as HTMLImageElement;
        if (imgEl) {
          tour.imageUrl = imgEl.src || imgEl.getAttribute('data-src') || undefined;
        }

        results.push(tour);
      }

      return results;
    });

    console.log(`  ✅ Extracted ${tours.length} tours`);
    return tours;
  }

  /**
   * Main scrape method
   */
  async scrape(url: string, outputDir: string): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    console.log(`\n🌐 Scraping: ${url}\n`);

    // Navigate to page
    console.log('📄 Loading page...');
    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.pageTimeout,
    });

    // Wait for initial content to load
    await this.page.waitForTimeout(3000);

    // Count initial tours
    this.metadata.initialCount = await this.countTourItems();
    console.log(`\n📊 Initial tour count: ${this.metadata.initialCount}`);

    // Click "load more" until no more content loads
    let previousCount = this.metadata.initialCount;
    for (let i = 0; i < CONFIG.maxLoadMoreClicks; i++) {
      const clicked = await this.clickLoadMore();
      if (!clicked) {
        console.log('  ℹ️  No more "load more" buttons found');
        break;
      }

      this.metadata.loadMoreClicks++;
      const newCount = await this.countTourItems();
      const additionalItems = newCount - previousCount;

      console.log(`\n📊 After clicking "load more" (click #${this.metadata.loadMoreClicks}):`);
      console.log(`   • Previous count: ${previousCount}`);
      console.log(`   • New count: ${newCount}`);
      console.log(`   • Additional items loaded: ${additionalItems}`);

      if (newCount === previousCount) {
        console.log('  ℹ️  No additional content loaded, stopping');
        break;
      }

      previousCount = newCount;
    }

    this.metadata.finalCount = await this.countTourItems();
    this.metadata.additionalLoaded = this.metadata.finalCount - this.metadata.initialCount;

    console.log(`\n📊 Final Statistics:`);
    console.log(`   • Initial tours visible: ${this.metadata.initialCount}`);
    console.log(`   • "Load more" clicks: ${this.metadata.loadMoreClicks}`);
    console.log(`   • Additional tours loaded: ${this.metadata.additionalLoaded}`);
    console.log(`   • Total tours: ${this.metadata.finalCount}`);

    // Expand any truncated descriptions
    console.log('');
    await this.expandDescriptions();

    // Extract all tour data
    const tours = await this.extractTours();

    // Create output directory
    fs.mkdirSync(outputDir, { recursive: true });

    // Save tours as JSON
    const toursJsonPath = path.join(outputDir, 'tours.json');
    fs.writeFileSync(toursJsonPath, JSON.stringify(tours, null, 2));
    console.log(`\n💾 Saved tours data: ${toursJsonPath}`);

    // Save metadata
    const metadataPath = path.join(outputDir, '_metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(this.metadata, null, 2));
    console.log(`💾 Saved metadata: ${metadataPath}`);

    // Generate markdown
    const markdown = this.generateMarkdown(tours);
    const markdownPath = path.join(outputDir, 'tours.md');
    fs.writeFileSync(markdownPath, markdown);
    console.log(`💾 Saved markdown: ${markdownPath}`);

    console.log(`\n✨ Scraping complete!`);
    console.log(`   📂 Output directory: ${outputDir}`);
  }

  /**
   * Generate markdown from tours
   */
  private generateMarkdown(tours: Tour[]): string {
    const lines: string[] = [
      '# Walking Tours',
      '',
      `> Source: ${this.metadata.sourceUrl}`,
      `> Scraped: ${this.metadata.scrapedAt}`,
      `> Initial tours visible: ${this.metadata.initialCount}`,
      `> "Load more" clicks: ${this.metadata.loadMoreClicks}`,
      `> Additional tours loaded: ${this.metadata.additionalLoaded}`,
      `> Total tours: ${this.metadata.finalCount}`,
      '',
      '---',
      '',
    ];

    for (let i = 0; i < tours.length; i++) {
      const tour = tours[i];
      lines.push(`## ${i + 1}. ${tour.title}`);
      lines.push('');

      if (tour.guide) {
        lines.push(`**Guide:** ${tour.guide}`);
        lines.push('');
      }

      if (tour.datetime) {
        lines.push(`**Date & Time:** ${tour.datetime}`);
        lines.push('');
      }

      if (tour.duration) {
        lines.push(`**Duration:** ${tour.duration}`);
        lines.push('');
      }

      if (tour.location) {
        lines.push(`**Meeting Point:** ${tour.location}`);
        lines.push('');
      }

      if (tour.language) {
        lines.push(`**Language:** ${tour.language}`);
        lines.push('');
      }

      if (tour.rating) {
        lines.push(`**Rating:** ${tour.rating}`);
        lines.push('');
      }

      if (tour.price) {
        lines.push(`**Price:** ${tour.price}`);
        lines.push('');
      }

      if (tour.description) {
        lines.push(`**Description:** ${tour.description}`);
        lines.push('');
      }

      if (tour.url) {
        lines.push(`**More Info:** [View Tour](${tour.url})`);
        lines.push('');
      }

      if (tour.imageUrl) {
        lines.push(`![${tour.title}](${tour.imageUrl})`);
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }

    lines.push('');
    lines.push(`*Scraped on ${new Date(this.metadata.scrapedAt).toLocaleString()}*`);

    return lines.join('\n');
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: npx tsx scrape-tour-listings.ts <url> [output-dir]

Arguments:
  url         The tour website URL to scrape
  output-dir  Output directory (default: ./data/scraped/tour-listings-<timestamp>)

Examples:
  npx tsx scrape-tour-listings.ts "https://www.guruwalk.com/a/search?beginsAt=2026-02-25&endsAt=2026-02-25&vertical=free-tour&hub=mexico-city"
  npx tsx scrape-tour-listings.ts "https://www.getyourguide.com/..." ./data/scraped/paris-tours
  npx tsx scrape-tour-listings.ts "https://www.viator.com/..." ./data/scraped/london-tours
`);
    process.exit(1);
  }

  const url = args[0];
  const outputDir = args[1] || `./data/scraped/tour-listings-${Date.now()}`;

  // Validate URL
  try {
    new URL(url);
  } catch {
    console.error(`❌ Invalid URL: ${url}`);
    process.exit(1);
  }

  const scraper = new TourListingScraper(url, outputDir);

  try {
    await scraper.init();
    await scraper.scrape(url, outputDir);
  } catch (err) {
    console.error('❌ Scraping failed:', err);
    process.exit(1);
  } finally {
    await scraper.close();
  }
}

main();
