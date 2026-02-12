#!/usr/bin/env npx tsx
/**
 * Test script for road-trip-research skill
 *
 * Tests researching things to do on a drive from Portland to Seattle.
 * This is a simple integration test that verifies the script runs end-to-end.
 *
 * Usage:
 *   npx tsx test-portland-seattle.ts
 *
 * Note: This will perform actual Google searches and scraping, so it should
 * be run sparingly and respectfully.
 */

import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const ORIGIN = 'Portland';
const DESTINATION = 'Seattle';
const NUM_RESULTS = 2; // Use fewer results for testing
const OUTPUT_DIR = path.join(__dirname, '../../../tmp/test-portland-seattle-road-trip');

// Categories to test (subset for faster testing)
const TEST_CATEGORIES = 'route-overview,restaurants,points-of-interest';

async function runTest(): Promise<void> {
  console.log('═'.repeat(70));
  console.log('🧪 ROAD TRIP RESEARCH SKILL TEST');
  console.log('═'.repeat(70));
  console.log(`\n📊 Test Configuration:`);
  console.log(`   Route: ${ORIGIN} → ${DESTINATION}`);
  console.log(`   Results per search: ${NUM_RESULTS}`);
  console.log(`   Output directory: ${OUTPUT_DIR}`);
  console.log(`   Categories: ${TEST_CATEGORIES}\n`);

  // Clean up any previous test output
  if (fs.existsSync(OUTPUT_DIR)) {
    console.log('🧹 Cleaning up previous test output...\n');
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }

  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'research-road-trip.ts');

    const args = [
      scriptPath,
      ORIGIN,
      DESTINATION,
      NUM_RESULTS.toString(),
      OUTPUT_DIR,
      TEST_CATEGORIES
    ];

    console.log('🚀 Running road-trip-research script...\n');
    console.log(`Command: npx tsx ${args.join(' ')}\n`);
    console.log('═'.repeat(70));

    const child = spawn('npx', ['tsx', ...args], {
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      console.log('\n' + '═'.repeat(70));

      if (code === 0) {
        console.log('✅ TEST PASSED - Script completed successfully');
        console.log('═'.repeat(70));

        // Verify output
        console.log('\n📁 Verifying output...\n');

        const checks = [
          { path: OUTPUT_DIR, type: 'directory', name: 'Output directory' },
          { path: path.join(OUTPUT_DIR, '_road_trip_summary.md'), type: 'file', name: 'Summary file' },
          { path: path.join(OUTPUT_DIR, 'route-overview'), type: 'directory', name: 'Route overview category' },
          { path: path.join(OUTPUT_DIR, 'restaurants'), type: 'directory', name: 'Restaurants category' },
          { path: path.join(OUTPUT_DIR, 'points-of-interest'), type: 'directory', name: 'Points of interest category' },
        ];

        let allPassed = true;
        for (const check of checks) {
          const exists = fs.existsSync(check.path);
          const status = exists ? '✓' : '✗';
          const symbol = exists ? '✅' : '❌';
          console.log(`   ${symbol} ${check.name}: ${status}`);

          if (!exists) {
            allPassed = false;
          }
        }

        console.log('');

        if (allPassed) {
          // Show summary file content
          const summaryPath = path.join(OUTPUT_DIR, '_road_trip_summary.md');
          if (fs.existsSync(summaryPath)) {
            console.log('📄 Summary file preview:\n');
            const summary = fs.readFileSync(summaryPath, 'utf-8');
            const lines = summary.split('\n').slice(0, 20); // First 20 lines
            lines.forEach(line => console.log(`   ${line}`));
            if (summary.split('\n').length > 20) {
              console.log('   ...');
            }
            console.log('');
          }

          console.log('═'.repeat(70));
          console.log('✅ ALL CHECKS PASSED');
          console.log('═'.repeat(70));
          console.log(`\n💡 Test output saved to: ${OUTPUT_DIR}`);
          console.log('💡 Review the scraped content to verify quality\n');
          resolve();
        } else {
          console.log('═'.repeat(70));
          console.log('❌ SOME CHECKS FAILED');
          console.log('═'.repeat(70));
          reject(new Error('Output verification failed'));
        }
      } else {
        console.log(`❌ TEST FAILED - Script exited with code ${code}`);
        console.log('═'.repeat(70));
        reject(new Error(`Script failed with exit code ${code}`));
      }
    });

    child.on('error', (err) => {
      console.error('\n❌ TEST ERROR:', err.message);
      reject(err);
    });
  });
}

// Run the test
console.log('');
runTest()
  .then(() => {
    console.log('');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    console.log('');
    process.exit(1);
  });
