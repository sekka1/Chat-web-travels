#!/usr/bin/env npx tsx
/**
 * Debug Google Search - to see what HTML we're getting
 */

import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  console.log('🔍 Navigating to Google...');
  await page.goto('https://www.google.com/search?q=top+things+to+do+in+Mexico+City', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  await page.waitForTimeout(2000);

  console.log('\n📸 Taking screenshot...');
  await page.screenshot({ path: '/tmp/google-search.png', fullPage: true });
  console.log('Screenshot saved to /tmp/google-search.png');

  console.log('\n🔍 Checking for various selectors...');

  const selectors = [
    'div.g',
    'div[data-hveid]',
    'div.Gx5Zad',
    'div#search',
    'div#rso',
    'div.MjjYud',
    'a[href^="http"]',
  ];

  for (const selector of selectors) {
    const count = await page.locator(selector).count();
    console.log(`  ${selector}: ${count} elements`);
  }

  console.log('\n📋 Looking for links...');
  const links = await page.evaluate(() => {
    const results: string[] = [];
    const allLinks = Array.from(document.querySelectorAll('a[href^="http"]'));

    allLinks.slice(0, 10).forEach((link, idx) => {
      const href = (link as HTMLAnchorElement).href;
      const text = link.textContent?.trim() || '';
      results.push(`${idx + 1}. ${text.slice(0, 80)} -> ${href.slice(0, 100)}`);
    });

    return results;
  });

  links.forEach(link => console.log(link));

  console.log('\n📄 Saving page HTML...');
  const html = await page.content();
  const fs = await import('node:fs');
  fs.writeFileSync('/tmp/google-search.html', html);
  console.log('HTML saved to /tmp/google-search.html');

  await browser.close();
}

main().catch(console.error);
