#!/usr/bin/env npx tsx
/**
 * Verify Google Maps API Key Access
 * 
 * This script verifies that the GOOGLE_MAPS_API_KEY environment variable is
 * properly set and accessible. This is useful for:
 * - Testing that AI agents can access GitHub secrets
 * - Verifying local development environment setup
 * - Debugging secret access issues
 * 
 * Usage:
 *   npx tsx .github/skills/road-trip-research/scripts/verify-api-key.ts
 * 
 * Exit codes:
 *   0 - API key is accessible
 *   1 - API key is not set or empty
 */

/**
 * Checks if the GOOGLE_MAPS_API_KEY environment variable is set
 * @returns true if the API key is set and not empty
 */
function checkApiKey(): boolean {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return false;
  }
  
  if (apiKey.trim() === '') {
    return false;
  }
  
  return true;
}

/**
 * Masks an API key for safe display
 * @param key - The API key to mask
 * @returns Masked version showing only first and last few characters
 */
function maskApiKey(key: string): string {
  if (key.length <= 8) {
    return '***';
  }
  
  const start = key.substring(0, 4);
  const end = key.substring(key.length - 4);
  const middle = '*'.repeat(Math.min(20, key.length - 8));
  
  return `${start}${middle}${end}`;
}

/**
 * Main function
 */
function main(): void {
  console.log('═'.repeat(70));
  console.log('🔑 GOOGLE MAPS API KEY VERIFICATION');
  console.log('═'.repeat(70));
  console.log('');
  
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!checkApiKey()) {
    console.log('❌ GOOGLE_MAPS_API_KEY is not set or is empty');
    console.log('');
    console.log('How to fix this:');
    console.log('');
    console.log('1. For AI agents (GitHub Copilot Workspace, CLI agents):');
    console.log('   - Ensure you are authenticated with GitHub: gh auth login');
    console.log('   - The secret should be automatically available from repository settings');
    console.log('');
    console.log('2. For local development:');
    console.log('   - Create a .env file: cp .env.example .env');
    console.log('   - Add your API key: GOOGLE_MAPS_API_KEY=your-key-here');
    console.log('   - Or export it: export GOOGLE_MAPS_API_KEY=your-key-here');
    console.log('');
    console.log('3. For GitHub Actions:');
    console.log('   - Add the secret in repository Settings → Secrets → Actions');
    console.log('   - Name: GOOGLE_MAPS_API_KEY');
    console.log('');
    console.log('See: .github/skills/road-trip-research/scripts/use-google-maps-secret.md');
    console.log('');
    process.exit(1);
  }
  
  console.log('✅ GOOGLE_MAPS_API_KEY is set and accessible');
  console.log('');
  console.log(`   Masked value: ${maskApiKey(apiKey!)}`);
  console.log(`   Length: ${apiKey!.length} characters`);
  console.log('');
  
  // Check for common issues
  const warnings: string[] = [];
  
  if (apiKey!.includes(' ')) {
    warnings.push('API key contains spaces - this may cause issues');
  }
  
  if (apiKey!.length < 20) {
    warnings.push('API key seems unusually short - verify it is correct');
  }
  
  if (apiKey!.startsWith('your-') || apiKey!.includes('example') || apiKey!.includes('placeholder')) {
    warnings.push('API key appears to be a placeholder - replace with actual key');
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach(warning => {
      console.log(`   - ${warning}`);
    });
    console.log('');
  }
  
  console.log('═'.repeat(70));
  console.log('✨ Verification Complete');
  console.log('═'.repeat(70));
  console.log('');
  console.log('Next steps:');
  console.log('  - Test the API: npx tsx .github/skills/road-trip-research/scripts/test-google-maps-api.ts "Portland, OR" "Seattle, WA"');
  console.log('  - Read docs: .github/skills/road-trip-research/scripts/README-google-maps.md');
  console.log('');
}

main();
