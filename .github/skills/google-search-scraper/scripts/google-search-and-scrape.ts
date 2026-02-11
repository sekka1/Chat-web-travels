#!/usr/bin/env npx tsx
/**
 * Google Search and Scrape Tool
 *
 * This script performs a Google search, identifies real results (skipping ads),
 * and scrapes the top N results to extract their content.
 *
 * Usage:
 *   npx tsx scripts/google-search-and-scrape.ts <search-query> [num-results] [output-base-dir]
 *
 * Examples:
 *   npx tsx scripts/google-search-and-scrape.ts "top things to do in Mexico City" 3
 *   npx tsx scripts/google-search-and-scrape.ts "best restaurants in Paris" 5 ./data/scraped
 *
 * Output:
 *   - Creates subdirectories for each scraped result in output-base-dir
 *   - Each subdirectory contains content.md and images/ (if images are found)
 *   - Verbose output shows which results were selected and why
 *
 * Prerequisites:
 *   npm install playwright
 *   npx playwright install chromium
 */

import { chromium, type Browser, type Page } from 'playwright';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as https from 'node:https';
import * as http from 'node:http';

// ============================================================================
// Types
// ============================================================================

interface SearchResult {
  /** Position in search results (0-based) */
  position: number;
  /** Result title */
  title: string;
  /** Result URL */
  url: string;
  /** Result snippet/description */
  snippet: string;
  /** Whether this is an ad */
  isAd: boolean;
  /** Reason for inclusion/exclusion */
  reason?: string;
}

interface ScrapedContent {
  /** Page title */
  title: string;
  /** Page URL */
  url: string;
  /** Extracted main content as markdown */
  content: string;
  /** All extracted images */
  images: ImageInfo[];
  /** Scrape timestamp */
  scrapedAt: string;
  /** Source search result */
  searchResult: SearchResult;
}

interface ImageInfo {
  /** Original URL of the image */
  url: string;
  /** Alt text from the image element */
  alt: string;
  /** Title attribute if present */
  title?: string;
  /** Caption from figcaption or nearby text */
  caption?: string;
  /** Local filename after download */
  localFilename?: string;
  /** Whether the image was successfully downloaded */
  downloaded: boolean;
  /** Error message if download failed */
  error?: string;
  /** Extraction method used */
  extractionMethod: 'src' | 'data-src' | 'data-lazy-src' | 'srcset' | 'noscript';
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  /** Viewport dimensions for rendering */
  viewport: { width: 1920, height: 1080 },
  /** How long to wait for network idle after scroll (ms) */
  networkIdleTimeout: 2000,
  /** How many pixels to scroll each step */
  scrollStep: 500,
  /** Delay between scroll steps (ms) */
  scrollDelay: 300,
  /** Maximum time to wait for page load (ms) */
  pageTimeout: 30000,
  /** User agent string */
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  /** Selectors for main content areas */
  contentSelectors: [
    'article',
    'main',
    '.post-content',
    '.entry-content',
    '.article-content',
    '.blog-content',
    '#content',
    '.content',
  ],
  /** Selectors to remove from content */
  removeSelectors: [
    'script',
    'style',
    'nav',
    'header',
    'footer',
    '.sidebar',
    '.comments',
    '.related-posts',
    '.share-buttons',
    '.advertisement',
    '.ad',
    'iframe',
  ],
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Sanitize a string for use as a filename or directory name
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

/**
 * Extract filename from URL
 */
function getFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const basename = path.basename(pathname);

    // If no extension, try to determine from URL
    if (!path.extname(basename)) {
      return sanitizeFilename(basename) + '.jpg';
    }

    return sanitizeFilename(basename);
  } catch {
    return `image-${Date.now()}.jpg`;
  }
}

/**
 * Download a file from URL to local path
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, { headers: { 'User-Agent': CONFIG.userAgent } }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => {}); // Clean up partial file
        reject(err);
      });
    });

    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

/**
 * Convert HTML to simple markdown
 */
function htmlToMarkdown(html: string): string {
  return (
    html
      // Headers
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
      // Paragraphs
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      // Line breaks
      .replace(/<br\s*\/?>/gi, '\n')
      // Bold
      .replace(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/gi, '**$1**')
      // Italic
      .replace(/<(?:em|i)[^>]*>(.*?)<\/(?:em|i)>/gi, '*$1*')
      // Links
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      // Lists
      .replace(/<ul[^>]*>/gi, '\n')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<ol[^>]*>/gi, '\n')
      .replace(/<\/ol>/gi, '\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      // Blockquotes
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
      // Code
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```\n\n')
      // Remove remaining tags
      .replace(/<[^>]+>/g, '')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

// ============================================================================
// Google Search and Scraper Class
// ============================================================================

class GoogleSearchScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

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
   * Perform a Google search and extract results
   */
  async searchGoogle(query: string): Promise<SearchResult[]> {
    if (!this.page) throw new Error('Page not initialized');

    console.log(`\n🔍 Searching Google for: "${query}"\n`);

    // Navigate to Google search
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    await this.page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.pageTimeout,
    });

    // Wait for results to load
    await this.page.waitForTimeout(2000);

    // Extract search results
    const results = await this.page.evaluate(() => {
      const searchResults: Array<{
        position: number;
        title: string;
        url: string;
        snippet: string;
        isAd: boolean;
      }> = [];

      // Find all search result containers
      // Google uses different selectors, we'll try multiple patterns
      const resultSelectors = [
        'div.g',           // Standard result
        'div[data-hveid]', // Result with tracking
        'div.Gx5Zad',      // Alternative result container
      ];

      let allResults: Element[] = [];
      for (const selector of resultSelectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        allResults = allResults.concat(elements);
      }

      // Deduplicate by checking for unique links
      const seen = new Set<string>();
      let position = 0;

      for (const result of allResults) {
        // Check if this is an ad
        // Ads typically have specific markers
        const isAd = !!(
          result.querySelector('[data-text-ad]') ||
          result.querySelector('.ads-ad') ||
          result.querySelector('.ad_cclk') ||
          result.querySelector('span:has-text("Ad")') ||
          result.textContent?.includes('·Ad·') ||
          result.textContent?.includes('Sponsored')
        );

        // Find the link
        const link = result.querySelector('a[href^="http"]') as HTMLAnchorElement;
        if (!link) continue;

        const url = link.href;

        // Skip if we've seen this URL
        if (seen.has(url)) continue;
        seen.add(url);

        // Skip Google's own pages and non-http links
        if (
          url.includes('google.com/search') ||
          url.includes('google.com/url?') ||
          url.includes('webcache.googleusercontent.com') ||
          url.includes('translate.google.com')
        ) {
          continue;
        }

        // Extract title
        const titleElement =
          result.querySelector('h3') ||
          result.querySelector('[role="heading"]') ||
          link.querySelector('h3');
        const title = titleElement?.textContent?.trim() || link.textContent?.trim() || 'Untitled';

        // Extract snippet
        const snippetElement =
          result.querySelector('[data-content-feature="1"]') ||
          result.querySelector('.VwiC3b') ||
          result.querySelector('[style*="-webkit-line-clamp"]');
        const snippet = snippetElement?.textContent?.trim() || '';

        searchResults.push({
          position: position++,
          title,
          url,
          snippet,
          isAd,
        });
      }

      return searchResults;
    });

    // Log results
    console.log('📋 Google Search Results:\n');
    console.log('═'.repeat(80));

    const ads = results.filter(r => r.isAd);
    const organicResults = results.filter(r => !r.isAd);

    if (ads.length > 0) {
      console.log(`\n🚫 SKIPPED ADS (${ads.length}):\n`);
      ads.forEach((result, idx) => {
        console.log(`${idx + 1}. [AD] ${result.title}`);
        console.log(`   URL: ${result.url}`);
        console.log(`   Reason: Marked as advertisement\n`);
      });
    }

    console.log(`\n✅ ORGANIC RESULTS (${organicResults.length}):\n`);
    organicResults.forEach((result, idx) => {
      console.log(`${idx + 1}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Snippet: ${result.snippet.slice(0, 150)}${result.snippet.length > 150 ? '...' : ''}\n`);
    });

    console.log('═'.repeat(80));

    return organicResults;
  }

  /**
   * Scroll through the entire page to trigger lazy loading
   */
  private async scrollToLoadImages(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    console.log('   📜 Scrolling to trigger lazy-loaded images...');

    // Get page height
    const pageHeight = await this.page.evaluate(() => document.body.scrollHeight);
    let currentPosition = 0;

    while (currentPosition < pageHeight) {
      await this.page.evaluate((y) => window.scrollTo(0, y), currentPosition);
      await this.page.waitForTimeout(CONFIG.scrollDelay);
      currentPosition += CONFIG.scrollStep;
    }

    // Scroll back to top
    await this.page.evaluate(() => window.scrollTo(0, 0));

    // Wait for any final image loads
    await this.page.waitForTimeout(CONFIG.networkIdleTimeout);
  }

  /**
   * Extract all images from the page
   */
  private async extractImages(): Promise<ImageInfo[]> {
    if (!this.page) throw new Error('Page not initialized');

    const images = await this.page.evaluate(() => {
      const results: Array<{
        url: string;
        alt: string;
        title?: string;
        caption?: string;
        extractionMethod: string;
      }> = [];

      // Helper to get best URL from an image element
      const getBestImageUrl = (
        img: HTMLImageElement
      ): { url: string; method: string } | null => {
        // Check data-lazy-src (WordPress)
        const lazyDataSrc = img.getAttribute('data-lazy-src');
        if (lazyDataSrc && !lazyDataSrc.startsWith('data:')) {
          return { url: lazyDataSrc, method: 'data-lazy-src' };
        }

        // Check data-src (common lazy-load)
        const dataSrc = img.getAttribute('data-src');
        if (dataSrc && !dataSrc.startsWith('data:')) {
          return { url: dataSrc, method: 'data-src' };
        }

        // Check srcset for highest resolution
        const srcset = img.getAttribute('data-lazy-srcset') || img.getAttribute('srcset');
        if (srcset) {
          const entries = srcset.split(',').map((s) => s.trim());
          let bestUrl = '';
          let bestWidth = 0;

          for (const entry of entries) {
            const parts = entry.split(/\s+/);
            if (parts.length >= 1) {
              const url = parts[0];
              const descriptor = parts[1] || '1x';
              const width = descriptor.endsWith('w') ? parseInt(descriptor, 10) : 1000;

              if (width > bestWidth && !url.startsWith('data:')) {
                bestWidth = width;
                bestUrl = url;
              }
            }
          }

          if (bestUrl) {
            return { url: bestUrl, method: 'srcset' };
          }
        }

        // Check regular src (if not a placeholder)
        const src = img.src || img.getAttribute('src');
        if (src && !src.startsWith('data:') && !src.includes('placeholder')) {
          return { url: src, method: 'src' };
        }

        return null;
      };

      // Helper to find caption near an image
      const findCaption = (img: HTMLImageElement): string | undefined => {
        const figure = img.closest('figure');
        if (figure) {
          const figcaption = figure.querySelector('figcaption');
          if (figcaption) {
            return figcaption.textContent?.trim();
          }
        }
        return undefined;
      };

      // Process all img elements
      const imgElements = Array.from(document.querySelectorAll('img'));
      for (const img of imgElements) {
        const urlInfo = getBestImageUrl(img);
        if (!urlInfo) continue;

        // Skip tiny images (likely icons)
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        if ((width > 0 && width < 50) || (height > 0 && height < 50)) {
          continue;
        }

        results.push({
          url: urlInfo.url,
          alt: img.alt || '',
          title: img.title || undefined,
          caption: findCaption(img),
          extractionMethod: urlInfo.method,
        });
      }

      return results;
    });

    // Deduplicate by URL and resolve relative URLs
    const seen = new Set<string>();
    const uniqueImages: ImageInfo[] = [];

    for (const img of images) {
      let fullUrl = img.url;
      if (!fullUrl.startsWith('http')) {
        try {
          fullUrl = new URL(img.url, this.page!.url()).href;
        } catch {
          continue;
        }
      }

      if (!seen.has(fullUrl)) {
        seen.add(fullUrl);
        uniqueImages.push({
          ...img,
          url: fullUrl,
          downloaded: false,
          extractionMethod: img.extractionMethod as ImageInfo['extractionMethod'],
        });
      }
    }

    return uniqueImages;
  }

  /**
   * Extract main text content from the page
   */
  private async extractContent(): Promise<{ title: string; content: string }> {
    if (!this.page) throw new Error('Page not initialized');

    const result = await this.page.evaluate(
      ({ contentSelectors, removeSelectors }) => {
        // Get page title
        const title =
          document.querySelector('h1')?.textContent?.trim() ||
          document.title ||
          'Untitled';

        // Find main content area
        let contentElement: Element | null = null;
        for (const selector of contentSelectors) {
          contentElement = document.querySelector(selector);
          if (contentElement) break;
        }

        if (!contentElement) {
          contentElement = document.body;
        }

        // Clone to avoid modifying the page
        const clone = contentElement.cloneNode(true) as Element;

        // Remove unwanted elements
        for (const selector of removeSelectors) {
          clone.querySelectorAll(selector).forEach((el) => el.remove());
        }

        return {
          title,
          content: clone.innerHTML,
        };
      },
      { contentSelectors: CONFIG.contentSelectors, removeSelectors: CONFIG.removeSelectors }
    );

    return {
      title: result.title,
      content: htmlToMarkdown(result.content),
    };
  }

  /**
   * Download all images to a directory
   */
  private async downloadImages(
    images: ImageInfo[],
    outputDir: string
  ): Promise<ImageInfo[]> {
    if (images.length === 0) return [];

    console.log(`   📥 Downloading ${images.length} images...`);

    const imagesDir = path.join(outputDir, 'images');
    fs.mkdirSync(imagesDir, { recursive: true });

    const results: ImageInfo[] = [];

    for (const img of images) {
      const filename = getFilenameFromUrl(img.url);

      // Avoid duplicates
      let finalFilename = filename;
      let counter = 1;
      while (fs.existsSync(path.join(imagesDir, finalFilename))) {
        const ext = path.extname(filename);
        const base = path.basename(filename, ext);
        finalFilename = `${base}-${counter}${ext}`;
        counter++;
      }

      const finalPath = path.join(imagesDir, finalFilename);

      try {
        await downloadFile(img.url, finalPath);
        results.push({
          ...img,
          localFilename: finalFilename,
          downloaded: true,
        });
        console.log(`      ✅ ${finalFilename}`);
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        results.push({
          ...img,
          localFilename: finalFilename,
          downloaded: false,
          error,
        });
        console.log(`      ❌ ${finalFilename}: ${error}`);
      }
    }

    return results;
  }

  /**
   * Generate attribution manifest
   */
  private generateAttributionManifest(
    images: ImageInfo[],
    pageUrl: string,
    pageTitle: string
  ): string {
    const lines: string[] = [
      '# Image Attribution Manifest',
      '# Auto-generated by google-search-and-scrape.ts',
      `# Source: ${pageUrl}`,
      `# Page Title: ${pageTitle}`,
      `# Generated: ${new Date().toISOString()}`,
      '',
      'images:',
    ];

    for (const img of images) {
      lines.push(`  - filename: "${img.localFilename || 'unknown'}"`);
      lines.push(`    source_url: "${img.url}"`);
      lines.push(`    source_page: "${pageUrl}"`);
      lines.push(`    alt_text: "${(img.alt || '').replace(/"/g, '\\"')}"`);

      if (img.title) {
        lines.push(`    title: "${img.title.replace(/"/g, '\\"')}"`);
      }
      if (img.caption) {
        lines.push(`    caption: "${img.caption.replace(/"/g, '\\"')}"`);
      }

      lines.push(`    extraction_method: "${img.extractionMethod}"`);
      lines.push(`    downloaded: ${img.downloaded}`);

      if (img.error) {
        lines.push(`    error: "${img.error.replace(/"/g, '\\"')}"`);
      }

      lines.push(`    license: "unknown - verify before use"`);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Scrape a single URL
   */
  async scrapePage(result: SearchResult, outputDir: string): Promise<ScrapedContent> {
    if (!this.page) throw new Error('Browser not initialized');

    console.log(`\n📄 Scraping: ${result.title}`);
    console.log(`   URL: ${result.url}`);

    try {
      // Navigate to page
      await this.page.goto(result.url, {
        waitUntil: 'domcontentloaded',
        timeout: CONFIG.pageTimeout,
      });

      // Wait for initial render
      await this.page.waitForTimeout(1000);

      // Scroll to trigger lazy loading
      await this.scrollToLoadImages();

      // Extract content
      const { title, content } = await this.extractContent();

      // Extract images
      let images = await this.extractImages();

      // Download images
      images = await this.downloadImages(images, outputDir);

      // Generate attribution manifest if images exist
      if (images.length > 0) {
        const attribution = this.generateAttributionManifest(images, result.url, title);
        const attributionPath = path.join(outputDir, 'images', '_attribution.yaml');
        fs.writeFileSync(attributionPath, attribution);
      }

      // Save content
      const contentPath = path.join(outputDir, 'content.md');
      const markdown = [
        `# ${title}`,
        '',
        `> Source: ${result.url}`,
        `> Scraped: ${new Date().toISOString()}`,
        `> Search Position: ${result.position + 1}`,
        '',
        '---',
        '',
        content,
        '',
        '---',
        '',
        `Last updated: ${new Date().toISOString().split('T')[0]}`,
        `Tags: travel, scraped-content`,
      ].join('\n');
      fs.writeFileSync(contentPath, markdown);

      const scrapedContent: ScrapedContent = {
        title,
        url: result.url,
        content,
        images,
        scrapedAt: new Date().toISOString(),
        searchResult: result,
      };

      const downloaded = images.filter((i) => i.downloaded).length;
      console.log(`   ✅ Scraped successfully!`);
      console.log(`   📝 Content saved to: ${contentPath}`);
      console.log(`   🖼️  Images: ${downloaded}/${images.length} downloaded`);

      return scrapedContent;
    } catch (err) {
      console.error(`   ❌ Failed to scrape: ${err}`);
      throw err;
    }
  }

  /**
   * Main search and scrape method
   */
  async searchAndScrape(
    query: string,
    numResults: number,
    outputBaseDir: string
  ): Promise<ScrapedContent[]> {
    // Perform search
    const searchResults = await this.searchGoogle(query);

    // Filter to get top N organic results
    const topResults = searchResults.slice(0, numResults);

    if (topResults.length === 0) {
      console.log('\n❌ No organic search results found!');
      return [];
    }

    console.log(`\n🎯 Will scrape top ${topResults.length} results:\n`);
    topResults.forEach((result, idx) => {
      console.log(`${idx + 1}. ${result.title}`);
      console.log(`   ${result.url}\n`);
    });

    // Scrape each result
    const scrapedContents: ScrapedContent[] = [];

    for (let i = 0; i < topResults.length; i++) {
      const result = topResults[i];

      // Create output directory for this result
      const sanitizedTitle = sanitizeFilename(result.title);
      const outputDir = path.join(outputBaseDir, `${i + 1}-${sanitizedTitle}`);
      fs.mkdirSync(outputDir, { recursive: true });

      try {
        const scraped = await this.scrapePage(result, outputDir);
        scrapedContents.push(scraped);

        // Small delay between scrapes to be respectful
        if (i < topResults.length - 1) {
          console.log('\n   ⏳ Waiting 2 seconds before next scrape...');
          await this.page!.waitForTimeout(2000);
        }
      } catch (err) {
        console.error(`   ❌ Skipping due to error`);
        continue;
      }
    }

    return scrapedContents;
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: npx tsx google-search-and-scrape.ts <search-query> [num-results] [output-base-dir]

Arguments:
  search-query     The Google search query (required)
  num-results      Number of results to scrape (default: 3)
  output-base-dir  Base directory for output (default: ./data/scraped)

Examples:
  npx tsx google-search-and-scrape.ts "top things to do in Mexico City"
  npx tsx google-search-and-scrape.ts "best restaurants in Paris" 5
  npx tsx google-search-and-scrape.ts "travel tips Tokyo" 3 ./data/destinations
`);
    process.exit(1);
  }

  const query = args[0];
  const numResults = args[1] ? parseInt(args[1], 10) : 3;
  const outputBaseDir = args[2] || './data/scraped';

  // Validate num results
  if (isNaN(numResults) || numResults < 1) {
    console.error(`❌ Invalid number of results: ${args[1]}`);
    process.exit(1);
  }

  // Create base output directory
  fs.mkdirSync(outputBaseDir, { recursive: true });

  const scraper = new GoogleSearchScraper();

  try {
    await scraper.init();
    const results = await scraper.searchAndScrape(query, numResults, outputBaseDir);

    console.log('\n' + '═'.repeat(80));
    console.log('✨ SCRAPING COMPLETE!\n');
    console.log(`📊 Summary:`);
    console.log(`   Query: "${query}"`);
    console.log(`   Results scraped: ${results.length}/${numResults}`);
    console.log(`   Output directory: ${outputBaseDir}\n`);

    results.forEach((result, idx) => {
      console.log(`${idx + 1}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Images: ${result.images.filter(i => i.downloaded).length}/${result.images.length}`);
    });

    console.log('\n' + '═'.repeat(80));
  } catch (err) {
    console.error('❌ Scraping failed:', err);
    process.exit(1);
  } finally {
    await scraper.close();
  }
}

main();
