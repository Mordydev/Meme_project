/**
 * API Load Test Script
 * 
 * Simulates realistic user traffic patterns to verify performance and scalability
 * of the Success Kid Community Platform API.
 * 
 * Uses k6 (https://k6.io) for load testing.
 * 
 * Run with: k6 run load-test.js
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { scenario } from 'k6/execution';

// Custom metrics
const errorRate = new Rate('errors');
const contentLoadTimes = new Trend('content_load_times');
const profileLoadTimes = new Trend('profile_load_times');
const leaderboardLoadTimes = new Trend('leaderboard_load_times');
const searchLoadTimes = new Trend('search_load_times');
const commentPostTimes = new Trend('comment_post_times');

// Test configuration with staged load
export const options = {
  // Scenario to simulate normal daily traffic
  scenarios: {
    constant_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
    },
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },  // Ramp up to 100 VUs over 2 minutes
        { duration: '5m', target: 100 },  // Stay at 100 VUs for 5 minutes
        { duration: '2m', target: 200 },  // Ramp up to 200 VUs over 2 minutes
        { duration: '5m', target: 200 },  // Stay at 200 VUs for 5 minutes
        { duration: '2m', target: 0 },    // Ramp down to 0 VUs over 2 minutes
      ],
      startTime: '5m',  // Start after constant_load scenario
    },
    // Spike test to simulate sudden traffic surge
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 500 }, // Quick ramp up to 500 VUs
        { duration: '1m', target: 500 },  // Maintain for 1 minute
        { duration: '30s', target: 0 },   // Quick ramp down
      ],
      startTime: '20m', // Start after other scenarios
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests must complete within 500ms
    'content_load_times': ['p(95)<400'], // 95% of content load times under 400ms
    'profile_load_times': ['p(95)<300'], // 95% of profile load times under 300ms
    'errors': ['rate<0.01'],  // Error rate must be less than 1%
  },
};

// Simulated users - in production use actual data
const users = new SharedArray('users', function() {
  return Array.from({ length: 100 }, (_, i) => ({
    id: `user${i + 1}`,
    email: `user${i + 1}@example.com`,
    password: 'password123',
  }));
});

// Simulated content IDs - in production use actual data
const contentIds = new SharedArray('contentIds', function() {
  return Array.from({ length: 50 }, (_, i) => `content${i + 1}`);
});

// Tags for searching
const searchTerms = [
  'success', 'community', 'crypto', 'blockchain', 'token',
  'meme', 'achievement', 'points', 'rewards', 'wallet'
];

/**
 * Main test function - executed for each virtual user
 */
export default function() {
  // Get user context for this VU
  const user = users[Math.floor(Math.random() * users.length)];
  
  // Base URL for the API
  const baseUrl = 'http://localhost:3000/api/v1';
  
  // Headers for all requests
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  group('Authentication flow', function() {
    // Login user to get token
    const loginRes = http.post(`${baseUrl}/auth/login`, JSON.stringify({
      email: user.email,
      password: user.password,
    }), params);
    
    const checkLogin = check(loginRes, {
      'Login successful': (r) => r.status === 200,
      'Has token': (r) => r.json('data.token') !== undefined,
    });
    
    if (!checkLogin) {
      errorRate.add(1);
      return; // Skip rest of test if login fails
    }
    
    // Get auth token and set for future requests
    const authToken = loginRes.json('data.token');
    params.headers['Authorization'] = `Bearer ${authToken}`;
  });
  
  // Add slight delay to simulate user reading the login response
  sleep(0.5);
  
  group('Content feed', function() {
    const start = new Date();
    const feedRes = http.get(`${baseUrl}/content?sortBy=recent&limit=20`, params);
    const end = new Date();
    
    contentLoadTimes.add(end - start);
    
    check(feedRes, {
      'Content feed loads successfully': (r) => r.status === 200,
      'Content feed has items': (r) => r.json('data').length > 0,
      'Content feed loaded quickly': (r) => r.timings.duration < 400,
    }) || errorRate.add(1);
  });
  
  // Simulate user browsing behavior with random content selection
  sleep(Math.random() * 2 + 1); // Random sleep between 1-3 seconds
  
  group('Content detail', function() {
    // Select random content ID
    const contentId = contentIds[Math.floor(Math.random() * contentIds.length)];
    
    const contentRes = http.get(`${baseUrl}/content/${contentId}`, params);
    
    check(contentRes, {
      'Content detail loads successfully': (r) => r.status === 200,
      'Content has comments': (r) => r.json('data.comments') !== undefined,
    }) || errorRate.add(1);
    
    // 50% chance of posting a comment
    if (Math.random() > 0.5) {
      const start = new Date();
      const commentRes = http.post(`${baseUrl}/content/${contentId}/comments`, JSON.stringify({
        comment_text: `Test comment from load test at ${new Date().toISOString()}`,
      }), params);
      const end = new Date();
      
      commentPostTimes.add(end - start);
      
      check(commentRes, {
        'Comment posted successfully': (r) => r.status === 201 || r.status === 200,
      }) || errorRate.add(1);
    }
  });
  
  sleep(Math.random() * 2 + 1); // Random sleep between 1-3 seconds
  
  group('User profile', function() {
    const start = new Date();
    const profileRes = http.get(`${baseUrl}/users/me`, params);
    const end = new Date();
    
    profileLoadTimes.add(end - start);
    
    check(profileRes, {
      'Profile loads successfully': (r) => r.status === 200,
      'Profile has points': (r) => r.json('data.points') !== undefined,
    }) || errorRate.add(1);
  });
  
  sleep(Math.random() * 2 + 0.5); // Random sleep between 0.5-2.5 seconds
  
  // Not everyone visits leaderboards
  if (Math.random() > 0.3) {
    group('Leaderboards', function() {
      const start = new Date();
      const leaderboardRes = http.get(`${baseUrl}/leaderboards?type=points&limit=10`, params);
      const end = new Date();
      
      leaderboardLoadTimes.add(end - start);
      
      check(leaderboardRes, {
        'Leaderboard loads successfully': (r) => r.status === 200,
        'Leaderboard has entries': (r) => r.json('data').length > 0,
      }) || errorRate.add(1);
    });
  }
  
  sleep(Math.random() * 1.5 + 0.5); // Random sleep between 0.5-2 seconds
  
  // Only some users search
  if (Math.random() > 0.7) {
    group('Search', function() {
      // Pick a random search term
      const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
      
      const start = new Date();
      const searchRes = http.get(`${baseUrl}/content/search?query=${searchTerm}&limit=10`, params);
      const end = new Date();
      
      searchLoadTimes.add(end - start);
      
      check(searchRes, {
        'Search returns successfully': (r) => r.status === 200,
      }) || errorRate.add(1);
    });
  }
  
  // Final rest period before next iteration
  sleep(Math.random() * 3 + 2); // Random sleep between 2-5 seconds
}
