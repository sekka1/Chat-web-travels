#!/usr/bin/env npx tsx
/**
 * Improved scraper that extracts ALL recommendations from each page
 */

import { chromium } from 'playwright';
import * as fs from 'node:fs';
import * as path from 'node:path';

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

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  const outputBaseDir = './data/scraped/mexico-city-activities';

  for (let i = 0; i < MEXICO_CITY_URLS.length; i++) {
    const item = MEXICO_CITY_URLS[i];
    console.log(`\n📄 Scraping: ${item.title}`);
    console.log(`   URL: ${item.url}\n`);

    const outputDir = path.join(outputBaseDir, `${i + 1}-${item.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
    fs.mkdirSync(outputDir, { recursive: true });

    await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Scroll to load lazy content
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 500;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve(undefined);
          }
        }, 100);
      });
    });

    await page.waitForTimeout(1000);

    // Extract full content
    const result = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent?.trim() || document.title;

      // Try to find the main content area
      let mainContent = document.querySelector('article') ||
                        document.querySelector('main') ||
                        document.querySelector('[role="main"]') ||
                        document.querySelector('.content') ||
                        document.querySelector('#content') ||
                        document.body;

      // Clone and clean
      const clone = mainContent.cloneNode(true) as Element;

      // Remove unwanted elements
      const removeSelectors = [
        'script', 'style', 'nav', 'header', 'footer',
        '.sidebar', '.ad', '.advertisement', 'iframe',
        '.cookie-banner', '.newsletter', '.social-share'
      ];

      removeSelectors.forEach(selector => {
        clone.querySelectorAll(selector).forEach(el => el.remove());
      });

      return {
        title,
        html: clone.innerHTML,
        textLength: clone.textContent?.length || 0
      };
    });

    console.log(`   📊 Title: ${result.title}`);
    console.log(`   📝 Content length: ${result.textLength} characters`);
    console.log(`   📄 HTML length: ${result.html.length} characters\n`);

    // Save raw HTML for inspection
    const htmlPath = path.join(outputDir, 'raw-content.html');
    fs.writeFileSync(htmlPath, result.html);
    console.log(`   💾 Raw HTML saved to: ${htmlPath}\n`);

    await page.waitForTimeout(1000);
  }

  await browser.close();
}

main().catch(console.error);
