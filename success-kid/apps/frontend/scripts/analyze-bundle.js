#!/usr/bin/env node
/**
 * Bundle Analyzer Script
 * 
 * This script analyzes the Next.js bundle size and generates a report
 * for performance optimization.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const outputDir = path.join(__dirname, '../bundle-analysis');
const dateString = new Date().toISOString().replace(/[:.]/g, '-');
const reportFilename = `bundle-report-${dateString}.html`;

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Log starting message
console.log('\n🔍 Starting bundle analysis...\n');

try {
  // Set environment variables for webpack bundle analyzer
  process.env.ANALYZE = 'true';
  process.env.NEXT_BUNDLE_ANALYZER_OUTPUT_DIR = outputDir;
  
  // Build the Next.js app with bundle analyzer
  console.log('📦 Building application...');
  execSync('next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      ANALYZE: 'true',
    },
  });
  
  console.log('\n✅ Bundle analysis complete!');
  console.log(`📊 Reports saved to: ${outputDir}`);
  
  // Generate summary report
  generateSummaryReport();
  
  console.log('\n🔎 Bundle size optimization tips:');
  console.log(' - Review large dependencies and consider alternatives');
  console.log(' - Implement code splitting for large components');
  console.log(' - Analyze duplicate dependencies');
  console.log(' - Use dynamic imports for non-critical components');
  console.log(' - Optimize image and media assets');
  
} catch (error) {
  console.error('\n❌ Bundle analysis failed:');
  console.error(error);
  process.exit(1);
}

/**
 * Generate a summary report from the build stats
 */
function generateSummaryReport() {
  try {
    // Check if build stats file exists
    const buildDir = path.join(process.cwd(), '.next');
    const statsFile = path.join(buildDir, 'build-manifest.json');
    
    if (!fs.existsSync(statsFile)) {
      console.warn('⚠️ Build stats file not found, skipping summary report');
      return;
    }
    
    // Read and parse the stats
    const manifest = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
    
    // Create a summary report file
    const summaryPath = path.join(outputDir, 'bundle-summary.json');
    
    // Extract page data
    const pageData = {};
    const pages = Object.keys(manifest.pages || {});
    
    for (const page of pages) {
      if (page === '/') continue; // Skip root page
      
      const files = manifest.pages[page];
      pageData[page] = files.length;
    }
    
    // Sort pages by bundle size (number of files)
    const sortedPages = Object.entries(pageData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    // Create summary data
    const summary = {
      totalPages: pages.length,
      largestPages: sortedPages,
      totalScriptFiles: Object.keys(manifest.files || {}).length,
      dateGenerated: new Date().toISOString(),
    };
    
    // Write summary to file
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📝 Summary report saved to: ${summaryPath}`);
    
  } catch (error) {
    console.warn('⚠️ Error generating summary report:', error.message);
  }
}
