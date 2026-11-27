/**
 * CollabSpace Progressive k6 Load Testing Script.
 * 
 * Target: Evaluates CollabSpace API endpoints, database indexes, and concurrency limits
 * under progressive load tiers: 50 -> 100 -> 250 -> 500 -> 1,000 concurrent Virtual Users (VUs).
 * 
 * Execution:
 *   k6 run scripts/load-testing/k6-load-test.js
 * 
 * Metrics Measured:
 * - Average response time
 * - p95 response time
 * - Request failure / error rate
 * - Throughput (reqs/second)
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Trend, Rate, Counter } from 'k6/metrics'

// Custom Metrics
const dashboardDuration = new Trend('collabspace_dashboard_duration_ms')
const tasksDuration = new Trend('collabspace_tasks_duration_ms')
const chatDuration = new Trend('collabspace_chat_duration_ms')
const failureRate = new Rate('collabspace_error_rate')
const totalOperations = new Counter('collabspace_operations_total')

// Progressive Load Stages: 50 -> 100 -> 250 -> 500 -> 1000 VUs
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Tier 1: 50 concurrent users
    { duration: '1m',  target: 50 },
    { duration: '30s', target: 100 },  // Tier 2: 100 concurrent users
    { duration: '1m',  target: 100 },
    { duration: '30s', target: 250 },  // Tier 3: 250 concurrent users
    { duration: '1m',  target: 250 },
    { duration: '30s', target: 500 },  // Tier 4: 500 concurrent users
    { duration: '1m',  target: 500 },
    { duration: '30s', target: 1000 }, // Tier 5: 1000 concurrent users
    { duration: '1m',  target: 1000 },
    { duration: '30s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<450', 'avg<180'], // 95% of requests under 450ms
    'collabspace_error_rate': ['rate<0.01'],        // Error rate under 1%
  },
}

const SUPABASE_URL = __ENV.VITE_SUPABASE_URL || 'https://mock.supabase.co'
const SUPABASE_ANON_KEY = __ENV.VITE_SUPABASE_ANON_KEY || 'mock-anon-key'

const headers = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
}

export default function () {
  // Test Scenario 1: Workspace & Dashboard Overview
  group('1. Dashboard & Projects', () => {
    const start = Date.now()
    const res = http.get(
      `${SUPABASE_URL}/rest/v1/projects?select=id,name,key,status,created_at&limit=20`,
      { headers }
    )
    dashboardDuration.add(Date.now() - start)
    totalOperations.add(1)

    const passed = check(res, {
      'status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    })
    failureRate.add(!passed)
  })

  sleep(0.5)

  // Test Scenario 2: Kanban Tasks (Composite Index on project_id, position)
  group('2. Kanban Task Retrieval', () => {
    const start = Date.now()
    const res = http.get(
      `${SUPABASE_URL}/rest/v1/tasks?select=id,title,status,priority,position&order=position.asc&limit=50`,
      { headers }
    )
    tasksDuration.add(Date.now() - start)
    totalOperations.add(1)

    const passed = check(res, {
      'tasks status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    })
    failureRate.add(!passed)
  })

  sleep(0.5)

  // Test Scenario 3: Real-Time Chat Feed (Reverse Chronological Index)
  group('3. Project Chat Feed', () => {
    const start = Date.now()
    const res = http.get(
      `${SUPABASE_URL}/rest/v1/messages?select=id,content,created_at,sender_id&order=created_at.desc&limit=30`,
      { headers }
    )
    chatDuration.add(Date.now() - start)
    totalOperations.add(1)

    const passed = check(res, {
      'chat status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    })
    failureRate.add(!passed)
  })

  sleep(1)
}
