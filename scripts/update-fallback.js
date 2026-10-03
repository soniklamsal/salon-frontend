#!/usr/bin/env node

/**
 * Update fallback data files from the live backend
 * 
 * This script fetches the latest content from the backend API and saves it
 * as static JSON files for use when the backend is unavailable.
 * 
 * Usage:
 *   node scripts/update-fallback.js
 *   npm run update-fallback
 */

const fs = require('fs');
const path = require('path');

const API_BASE = process.env.NEXT_PUBLIC_SALON_API_URL || 'http://127.0.0.1:8000/api/v1';
const DATA_DIR = path.join(__dirname, '..', 'src', 'lib', 'data');

const endpoints = [
  { name: 'homepage', url: `${API_BASE}/homepage/`, file: 'fallback-homepage.json' },
  { name: 'about', url: `${API_BASE}/about/`, file: 'fallback-about.json' },
  { name: 'booking-config', url: `${API_BASE}/booking-config/`, file: 'fallback-booking.json' },
];

async function fetchEndpoint(endpoint) {
  console.log(`Fetching ${endpoint.name} from ${endpoint.url}...`);
  
  try {
    const response = await fetch(endpoint.url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const filePath = path.join(DATA_DIR, endpoint.file);
    
    // Pretty print JSON for better diffs in git
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    
    console.log(`✓ Saved ${endpoint.name} to ${endpoint.file}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to fetch ${endpoint.name}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Updating fallback data files...\n');
  console.log(`API Base URL: ${API_BASE}\n`);

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Created directory: ${DATA_DIR}\n`);
  }

  const results = await Promise.all(endpoints.map(fetchEndpoint));
  
  const successCount = results.filter(Boolean).length;
  const totalCount = results.length;

  console.log(`\nCompleted: ${successCount}/${totalCount} files updated successfully`);

  if (successCount === totalCount) {
    console.log('\n✓ All fallback data files are up to date!');
    process.exit(0);
  } else {
    console.log('\n⚠ Some files failed to update. Check the backend is running and accessible.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
