/**
 * API Performance Tests
 * 
 * This script tests the performance of critical API endpoints.
 * Run with: node src/testing/performance/api-performance.js
 * 
 * Dependencies:
 * - autocannon (npm install -g autocannon)
 */
const autocannon = require('autocannon');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3001';
const DURATION = 10; // seconds
const CONNECTIONS = 100;
const PIPELINING = 10;
const SCENARIOS = [
  {
    name: 'Health Check (Public)',
    url: `${BASE_URL}/health`,
    method: 'GET',
  },
  {
    name: 'Content Feed (Public)',
    url: `${BASE_URL}/api/v1/content`,
    method: 'GET',
  },
  {
    name: 'User Profile (Authenticated)',
    url: `${BASE_URL}/api/v1/users/me`,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test-token-12345',
    },
  },
  {
    name: 'Points Balance (Authenticated)',
    url: `${BASE_URL}/api/v1/points/balance`,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test-token-12345',
    },
  },
];

// Results storage
const results = [];
const resultsDir = path.join(__dirname, '../../../performance-reports');

// Create results directory if it doesn't exist
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Get system info
function getSystemInfo() {
  const cpuInfo = execSync('node -e "console.log(JSON.stringify(require(\'os\').cpus()))"')
    .toString('utf8');
  const cpus = JSON.parse(cpuInfo);
  
  return {
    platform: process.platform,
    arch: process.arch,
    cpus: cpus.length,
    cpuModel: cpus[0].model,
    memory: Math.round(require('os').totalmem() / (1024 * 1024 * 1024)) + 'GB',
    nodeVersion: process.version,
  };
}

// Format results
function formatResults(result) {
  return {
    url: result.url,
    method: result.method,
    statusCodeStats: result.statusCodeStats,
    latency: {
      min: result.latency.min,
      max: result.latency.max,
      average: Math.round(result.latency.average),
      p50: result.latency.p50,
      p90: result.latency.p90,
      p99: result.latency.p99,
    },
    throughput: {
      average: Math.round(result.throughput.average),
      max: Math.round(result.throughput.max),
    },
    errors: result.errors,
    timeouts: result.timeouts,
    duration: result.duration,
    connections: result.connections,
    pipelining: result.pipelining,
  };
}

// Run the tests sequentially
async function runTests() {
  console.log('Starting API performance tests...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Duration: ${DURATION}s per test`);
  console.log(`Connections: ${CONNECTIONS}`);
  console.log(`Pipelining: ${PIPELINING}`);
  console.log('-------------------------------------------');
  
  for (const scenario of SCENARIOS) {
    console.log(`Testing: ${scenario.name} (${scenario.method} ${scenario.url})`);
    
    // Define the test
    const test = autocannon({
      url: scenario.url,
      method: scenario.method,
      headers: scenario.headers || {},
      duration: DURATION,
      connections: CONNECTIONS,
      pipelining: PIPELINING,
      title: scenario.name,
    });
    
    // Collect results
    const result = await new Promise((resolve) => {
      autocannon.track(test, { renderProgressBar: true });
      
      test.on('done', (result) => {
        console.log(`Completed: ${scenario.name}`);
        console.log(`Requests/sec: ${Math.round(result.throughput.average)}`);
        console.log(`Latency (avg): ${Math.round(result.latency.average)}ms`);
        console.log(`Latency (p99): ${result.latency.p99}ms`);
        console.log('-------------------------------------------');
        
        resolve({
          ...formatResults(result),
          scenario: scenario.name,
          url: scenario.url,
          method: scenario.method,
        });
      });
    });
    
    results.push(result);
  }
  
  // Generate report
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(resultsDir, `performance-report-${timestamp}.json`);
  
  const report = {
    timestamp,
    systemInfo: getSystemInfo(),
    results,
    summary: {
      totalScenarios: SCENARIOS.length,
      averageRequestsPerSecond: Math.round(
        results.reduce((sum, r) => sum + r.throughput.average, 0) / results.length
      ),
      averageLatency: Math.round(
        results.reduce((sum, r) => sum + r.latency.average, 0) / results.length
      ),
      p99Latency: Math.round(
        results.reduce((sum, r) => sum + r.latency.p99, 0) / results.length
      ),
    },
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('Performance test complete!');
  console.log(`Report saved to: ${reportPath}`);
  console.log('\nSummary:');
  console.log(`Average requests/sec: ${report.summary.averageRequestsPerSecond}`);
  console.log(`Average latency: ${report.summary.averageLatency}ms`);
  console.log(`Average p99 latency: ${report.summary.p99Latency}ms`);
  
  // Check if any scenario failed performance thresholds
  const failedScenarios = results.filter(r => 
    r.latency.p99 > 500 || // p99 latency over 500ms
    r.throughput.average < 100 // less than 100 req/sec
  );
  
  if (failedScenarios.length > 0) {
    console.log('\nPerformance concerns detected:');
    failedScenarios.forEach(scenario => {
      console.log(`- ${scenario.scenario}: p99=${scenario.latency.p99}ms, throughput=${scenario.throughput.average}/sec`);
    });
  }
}

// Run the tests
runTests().catch(console.error);
