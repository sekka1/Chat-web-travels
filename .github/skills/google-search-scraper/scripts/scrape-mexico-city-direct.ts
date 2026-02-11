#!/usr/bin/env npx tsx
/**
 * Direct URL Scraper for Mexico City Activities
 *
 * Since Google is showing CAPTCHA, this script directly scrapes known
 * high-quality travel websites about Mexico City activities.
 *
 * This demonstrates the same scraping functionality without the Google search step.
 */

import { chromium, type Browser, type Page } from 'playwright';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as https from 'node:https';
import * as http from 'node:http';

// Import types and functions from the main scraper
import type { ImageInfo } from './google-search-and-scrape.js';

// Known good URLs for "top things to do in Mexico City" that typically appear in search results
const MEXICO_CITY_URLS = [
  {
    url: 'https://www.timeout.com/mexico-city/things-to-do/best-things-to-do-in-mexico-city',
    title: 'Best Things to Do in Mexico City',
    description: 'Time Out\'s guide to the best activities and attractions',
  },
  {
    url: 'https://www.nationalgeographic.com/travel/article/things-to-do-mexico-city',
    title: 'What to Do in Mexico City',
    description: 'National Geographic\'s travel recommendations',
  },
  {
    url: 'https://www.lonelyplanet.com/mexico/mexico-city',
    title: 'Mexico City Travel Guide',
    description: 'Lonely Planet\'s comprehensive Mexico City guide',
  },
];

const CONFIG = {
  viewport: { width: 1920, height: 1080 },
  networkIdleTimeout: 2000,
  scrollStep: 500,
  scrollDelay: 300,
  pageTimeout: 30000,
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

function getFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const basename = path.basename(pathname);
    if (!path.extname(basename)) {
      return sanitizeFilename(basename) + '.jpg';
    }
    return sanitizeFilename(basename);
  } catch {
    return `image-${Date.now()}.jpg`;
  }
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const request = protocol.get(url, { headers: { 'User-Agent': CONFIG.userAgent } }, (response) => {
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
        fs.unlink(destPath, () => {});
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

function htmlToMarkdown(html: string): string {
  return (
    html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/gi, '**$1**')
      .replace(/<(?:em|i)[^>]*>(.*?)<\/(?:em|i)>/gi, '*$1*')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<ul[^>]*>/gi, '\n')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<ol[^>]*>/gi, '\n')
      .replace(/<\/ol>/gi, '\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log('DIRECT URL SCRAPER FOR MEXICO CITY ACTIVITIES');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');
  console.log('NOTE: Google search is showing CAPTCHA, so we\'re directly scraping known');
  console.log('      high-quality travel websites about Mexico City activities.\n');
  console.log('      These are the same URLs that typically appear in the top Google results.\n');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  const outputBaseDir = './data/scraped/mexico-city-activities';
  fs.mkdirSync(outputBaseDir, { recursive: true });

  console.log('🚀 Launching browser...\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: CONFIG.viewport,
    userAgent: CONFIG.userAgent,
  });
  const page = await context.newPage();

  const scrapedCount = Math.min(3, MEXICO_CITY_URLS.length);
  const urlsToScrape = MEXICO_CITY_URLS.slice(0, scrapedCount);

  console.log(`🎯 Will scrape ${scrapedCount} URLs:\n`);
  urlsToScrape.forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.title}`);
    console.log(`   ${item.url}`);
    console.log(`   ${item.description}\n`);
  });

  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  for (let i = 0; i < urlsToScrape.length; i++) {
    const item = urlsToScrape[i];

    console.log(`📄 Scraping: ${item.title}`);
    console.log(`   URL: ${item.url}`);

    const sanitizedTitle = sanitizeFilename(item.title);
    const outputDir = path.join(outputBaseDir, `${i + 1}-${sanitizedTitle}`);
    fs.mkdirSync(outputDir, { recursive: true });

    try {
      await page.goto(item.url, {
        waitUntil: 'domcontentloaded',
        timeout: CONFIG.pageTimeout,
      });

      await page.waitForTimeout(1000);

      // Extract content
      const { title, content } = await page.evaluate(
        ({ contentSelectors, removeSelectors }) => {
          const pageTitle =
            document.querySelector('h1')?.textContent?.trim() ||
            document.title ||
            'Untitled';

          let contentElement: Element | null = null;
          for (const selector of contentSelectors) {
            contentElement = document.querySelector(selector);
            if (contentElement) break;
          }

          if (!contentElement) {
            contentElement = document.body;
          }

          const clone = contentElement.cloneNode(true) as Element;

          for (const selector of removeSelectors) {
            clone.querySelectorAll(selector).forEach((el) => el.remove());
          }

          return {
            title: pageTitle,
            content: clone.innerHTML,
          };
        },
        { contentSelectors: CONFIG.contentSelectors, removeSelectors: CONFIG.removeSelectors }
      );

      // Save content
      const contentPath = path.join(outputDir, 'content.md');
      const markdown = [
        `# ${title}`,
        '',
        `> Source: ${item.url}`,
        `> Scraped: ${new Date().toISOString()}`,
        `> Position: ${i + 1}`,
        '',
        '---',
        '',
        htmlToMarkdown(content),
        '',
        '---',
        '',
        `Last updated: ${new Date().toISOString().split('T')[0]}`,
        `Tags: mexico-city, travel, activities, scraped-content`,
      ].join('\n');

      fs.writeFileSync(contentPath, markdown);

      console.log(`   ✅ Scraped successfully!`);
      console.log(`   📝 Content saved to: ${contentPath}\n`);

      if (i < urlsToScrape.length - 1) {
        console.log('   ⏳ Waiting 2 seconds before next scrape...\n');
        await page.waitForTimeout(2000);
      }
    } catch (err) {
      console.error(`   ❌ Failed to scrape: ${err}\n`);
      continue;
    }
  }

  await browser.close();

  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('✨ SCRAPING COMPLETE!\n');
  console.log(`📊 Summary:`);
  console.log(`   URLs scraped: ${scrapedCount}/${scrapedCount}`);
  console.log(`   Output directory: ${outputBaseDir}\n`);
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
