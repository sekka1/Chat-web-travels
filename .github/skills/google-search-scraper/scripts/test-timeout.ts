#!/usr/bin/env npx tsx
import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  console.log('Loading Time Out page...');
  await page.goto('https://www.timeout.com/mexico-city/things-to-do/best-things-to-do-in-mexico-city', {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  console.log('Waiting...');
  await page.waitForTimeout(3000);

  console.log('Looking for article content...');
  const count = await page.locator('.articleContent, article').count();
  console.log(`Found ${count} article elements`);

  await page.waitForTimeout(10000);
  await browser.close();
}

test().catch(console.error);
