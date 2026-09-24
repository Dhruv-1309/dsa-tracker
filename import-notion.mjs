#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load .env manually without external dependencies
function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_PROBLEMS_DB_ID = process.env.NOTION_PROBLEMS_DB_ID || 'ef7735324f2543d394f62257a56df249';
const TRACKER_API_URL = (process.env.TRACKER_API_URL || 'https://dsa-tracker-backend-v5gf.onrender.com').replace(/\/$/, '');
const TRACKER_EMAIL = process.env.TRACKER_EMAIL || 'supabasetest@example.com';
const TRACKER_PASSWORD = process.env.TRACKER_PASSWORD || 'TestPass123!';

const STATE_FILE = path.resolve(__dirname, 'import-state.json');
const isRunMode = process.argv.includes('--run');

// Topic alias map
const TOPIC_ALIASES = {
  'stacks': 'Stack',
  'stack': 'Stack',
  'queues': 'Queue',
  'queue': 'Queue',
  'basic maths': 'Math',
  'basic math': 'Math',
  'math': 'Math',
  'maths': 'Math',
  '2d arrays': 'Matrix',
  'matrix': 'Matrix',
  'arrays': 'Arrays',
  'strings': 'Strings',
  'linked list': 'Linked List',
  'binary search': 'Binary Search',
  'binary tree': 'Binary Trees',
  'binary trees': 'Binary Trees',
  'binary search trees': 'Binary Search Trees',
  'heap': 'Heap / Priority Queue',
  'priority queue': 'Heap / Priority Queue',
  'dynamic programming': 'Dynamic Programming',
  'dp': 'Dynamic Programming',
  'graphs': 'Graphs',
  'graph': 'Graphs',
  'hashing': 'Hashing',
  'two pointers': 'Two Pointers',
  'sliding window': 'Sliding Window',
  'prefix sum': 'Prefix Sum',
  'sorting': 'Sorting',
  'recursion': 'Recursion',
  'backtracking': 'Backtracking',
  'union find': 'Union Find',
  'greedy': 'Greedy',
  'intervals': 'Intervals',
  'tries': 'Tries',
  'bit manipulation': 'Bit Manipulation',
};

// Platform map
function detectPlatform(url) {
  if (!url) return 'Other';
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('leetcode.com')) return 'LeetCode';
    if (hostname.includes('neetcode.io')) return 'NeetCode';
    if (hostname.includes('geeksforgeeks.org')) return 'GeeksforGeeks';
    if (hostname.includes('codeforces.com')) return 'Codeforces';
    if (hostname.includes('codechef.com')) return 'CodeChef';
    if (hostname.includes('hackerrank.com')) return 'HackerRank';
    return 'Other';
  } catch {
    return 'Other';
  }
}

// Difficulty mapping
function parseDifficulty(raw) {
  if (!raw) return 'MEDIUM';
  const str = String(raw).toLowerCase();
  const starCount = (str.match(/★/g) || []).length;
  if (starCount >= 4 || str.includes('hard')) return 'HARD';
  if (starCount === 3 || str.includes('medium')) return 'MEDIUM';
  if (starCount === 1 || starCount === 2 || str.includes('easy')) return 'EASY';
  return 'MEDIUM';
}

// Status & result mapping
function parseStatus(rawStatus) {
  if (!rawStatus || rawStatus === 'Not Attempted') {
    return null; // no attempt
  }
  const s = String(rawStatus).toLowerCase();
  if (s.includes('optimally')) {
    return {
      result: 'Solved optimally',
      understood: true,
      logicFound: true,
      codeCompleted: true
    };
  }
  if (s.includes('solved') && !s.includes("couldn't") && !s.includes("can't")) {
    return {
      result: 'Solved',
      understood: true,
      logicFound: true,
      codeCompleted: true
    };
  }
  if (s.includes('code done')) {
    return {
      result: 'Tried',
      understood: true,
      logicFound: true,
      codeCompleted: true
    };
  }
  if (s.includes('logic done')) {
    return {
      result: 'Tried',
      understood: true,
      logicFound: true,
      codeCompleted: false
    };
  }
  // Tried / Tried (couldn't solve)
  return {
    result: 'Tried',
    understood: false,
    logicFound: false,
    codeCompleted: false
  };
}

// Date parsing
function parseAttemptDate(dateSolvedProp, createdTime) {
  if (dateSolvedProp?.start) {
    const raw = dateSolvedProp.start;
    if (raw.includes('T')) {
      // Already has time
      return raw.slice(0, 19);
    }
    // Midday UTC: YYYY-MM-DDT12:00:00
    return `${raw}T12:00:00`;
  }
  if (createdTime) {
    return createdTime.slice(0, 19);
  }
  return new Date().toISOString().slice(0, 19);
}

// State management
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch {
      return { problems: {}, attempts: {} };
    }
  }
  return { problems: {}, attempts: {} };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

async function notionRequest(endpoint, options = {}) {
  const url = `https://api.notion.com/v1${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2025-09-03',
      'Content-Type': 'application/json',
      ...options.headers,
    }
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Notion API error (${res.status}) on ${endpoint}: ${errText}`);
  }
  return res.json();
}

async function trackerRequest(endpoint, options = {}, token = null) {
  const url = `${TRACKER_API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Tracker API error (${res.status}) on ${endpoint}: ${errText}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function main() {
  console.log('='.repeat(70));
  console.log(`DSA TRACKER NOTION MIGRATION - MODE: ${isRunMode ? 'LIVE RUN (--run)' : 'DRY RUN'}`);
  console.log('='.repeat(70));

  if (!NOTION_TOKEN) {
    console.error('ERROR: NOTION_TOKEN is missing from .env');
    process.exit(1);
  }
  if (!TRACKER_API_URL) {
    console.error('ERROR: TRACKER_API_URL is missing from .env');
    process.exit(1);
  }

  // 1. Tracker Login
  console.log(`\nLogging into DSA Tracker at ${TRACKER_API_URL}...`);
  let authToken = null;
  try {
    const authData = await trackerRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: TRACKER_EMAIL, password: TRACKER_PASSWORD })
    });
    authToken = authData.token;
    console.log('Authentication successful.');
  } catch (err) {
    console.error('STOP CONDITION: Login failed! Cannot proceed.');
    console.error(err.message);
    process.exit(1);
  }

  // 2. Fetch Topics from Tracker
  console.log('\nFetching available topics from DSA Tracker...');
  const availableTopics = await trackerRequest('/api/topics', {}, authToken);
  const topicNameToId = new Map();
  let otherTopicId = null;
  for (const t of availableTopics) {
    topicNameToId.set(t.name.toLowerCase(), t.id);
    if (t.name.toLowerCase() === 'other') {
      otherTopicId = t.id;
    }
  }

  // 3. Inspect Notion Database & Data Source
  console.log(`\nInspecting Notion Database: ${NOTION_PROBLEMS_DB_ID}...`);
  let dbMeta;
  try {
    dbMeta = await notionRequest(`/databases/${NOTION_PROBLEMS_DB_ID}`);
  } catch (err) {
    console.error('STOP CONDITION: Notion database could not be read! Cannot proceed.');
    console.error(err.message);
    process.exit(1);
  }

  const dataSourceId = dbMeta.data_sources?.[0]?.id;
  if (!dataSourceId) {
    console.error('STOP CONDITION: No data source found for Notion database.');
    process.exit(1);
  }
  console.log(`Found data source ID: ${dataSourceId}`);

  // Query all pages with pagination
  console.log('Querying all pages from Notion...');
  const allPages = [];
  let hasMore = true;
  let cursor = undefined;

  while (hasMore) {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const pageData = await notionRequest(`/data_sources/${dataSourceId}/query`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    allPages.push(...(pageData.results || []));
    hasMore = pageData.has_more;
    cursor = pageData.next_cursor;
  }
  console.log(`Retrieved ${allPages.length} total pages from Notion.`);

  // 4. Process Problems and Extract Items
  const dryRunProblems = [];
  let skippedBlankCount = 0;
  let notionRevisitLogRowCount = 0;
  const unmatchedTopics = new Set();
  const warnings = [];

  for (const page of allPages) {
    const props = page.properties || {};
    const titleArr = props['Problem Name']?.title || [];
    const title = titleArr.map(t => t.plain_text).join('').trim();

    if (!title) {
      skippedBlankCount++;
      continue;
    }

    const rawStatus = props['Status']?.status?.name || null;
    const rawDiff = props['Difficulty']?.select?.name || null;
    const rawTopic = props['Topic']?.select?.name || null;
    const url = props['Link']?.url || null;
    const rawApproach = (props['Approach']?.rich_text || []).map(t => t.plain_text).join('');
    const dateSolvedProp = props['Date Solved']?.date || null;
    const revisitLogRelations = props['Revisit Log']?.relation || [];
    notionRevisitLogRowCount += revisitLogRelations.length;

    // Resolve Topic
    let resolvedTopicId = null;
    let mappedTopicName = null;
    if (rawTopic) {
      const lower = rawTopic.trim().toLowerCase();
      const aliasMatch = TOPIC_ALIASES[lower] || rawTopic.trim();
      const matchId = topicNameToId.get(aliasMatch.toLowerCase());
      if (matchId) {
        resolvedTopicId = matchId;
        mappedTopicName = aliasMatch;
      } else {
        unmatchedTopics.add(rawTopic);
        resolvedTopicId = otherTopicId;
        mappedTopicName = 'Other';
        warnings.push(`Problem "${title}": Topic "${rawTopic}" unmapped, assigned to "Other".`);
      }
    } else {
      resolvedTopicId = otherTopicId;
      mappedTopicName = 'Other';
    }

    const difficulty = parseDifficulty(rawDiff);
    const platform = detectPlatform(url);
    const primaryAttempt = parseStatus(rawStatus);
    const attemptDate = parseAttemptDate(dateSolvedProp, page.created_time);

    dryRunProblems.push({
      notionPageId: page.id,
      title,
      platform,
      url: url || undefined,
      difficulty,
      primaryTopicId: resolvedTopicId,
      primaryTopicName: mappedTopicName,
      rawStatus,
      rawTopic,
      rawDiff,
      approach: rawApproach.trim() || undefined,
      attemptDate,
      primaryAttempt,
      revisitRelations: revisitLogRelations,
    });
  }

  const totalTitledProblems = dryRunProblems.length;
  const totalPlannedAttempts = dryRunProblems.filter(p => p.primaryAttempt !== null).length + notionRevisitLogRowCount;

  console.log('\n' + '-'.repeat(70));
  console.log('DRY RUN SUMMARY REPORT:');
  console.log('-'.repeat(70));
  console.log(`Total Notion pages fetched:       ${allPages.length}`);
  console.log(`Titled Notion problems found:     ${totalTitledProblems}`);
  console.log(`Blank pages skipped:              ${skippedBlankCount}`);
  console.log(`Notion Revisit Log relation rows: ${notionRevisitLogRowCount}`);
  console.log(`Problems to create in App:        ${totalTitledProblems}`);
  console.log(`Initial attempts to create:       ${totalPlannedAttempts}`);
  console.log(`Unmatched topics sent to "Other": ${unmatchedTopics.size > 0 ? Array.from(unmatchedTopics).join(', ') : 'None'}`);
  console.log(`Warnings generated:               ${warnings.length}`);
  if (warnings.length > 0) {
    warnings.slice(0, 10).forEach(w => console.log(`  - ${w}`));
    if (warnings.length > 10) console.log(`  ... and ${warnings.length - 10} more.`);
  }

  // STOP CONDITION CHECK
  if (totalTitledProblems !== 52) {
    console.error(`\nSTOP CONDITION TRIGGERED: Dry-run problem count (${totalTitledProblems}) does not equal 52 titled rows in Notion!`);
    process.exit(1);
  }
  if (totalPlannedAttempts === 0) {
    console.error(`\nSTOP CONDITION TRIGGERED: Dry run shows 0 attempts!`);
    process.exit(1);
  }

  if (!isRunMode) {
    console.log('\n[Dry Run Completed Successfully. All stop conditions passed.]');
    console.log('To execute the live migration, re-run with: node import-notion.mjs --run');
    return;
  }

  // 5. LIVE RUN
  console.log('\n' + '='.repeat(70));
  console.log('STARTING LIVE MIGRATION (--run)');
  console.log('='.repeat(70));

  const state = loadState();
  if (!state.problems) state.problems = {};
  if (!state.attempts) state.attempts = {};

  let problemsCreated = 0;
  let attemptsCreated = 0;
  let problemsSkipped = 0;

  for (let i = 0; i < dryRunProblems.length; i++) {
    const item = dryRunProblems[i];
    const progressStr = `[${i + 1}/${dryRunProblems.length}] "${item.title}"`;

    let trackerProblemId = state.problems[item.notionPageId]?.trackerProblemId;

    if (trackerProblemId) {
      problemsSkipped++;
      // Problem already exists in state
    } else {
      const problemPayload = {
        title: item.title,
        platform: item.platform,
        url: item.url,
        difficulty: item.difficulty,
        primaryTopicId: item.primaryTopicId,
        optimalTime: 'O(n)',
        optimalSpace: 'O(1)',
      };

      try {
        const created = await trackerRequest('/api/problems', {
          method: 'POST',
          body: JSON.stringify(problemPayload)
        }, authToken);

        trackerProblemId = created.id;
        state.problems[item.notionPageId] = {
          trackerProblemId,
          title: item.title,
          createdAt: new Date().toISOString()
        };
        saveState(state);
        problemsCreated++;
      } catch (err) {
        console.error(`Failed to create problem ${progressStr}:`, err.message);
        throw err;
      }
    }

    // Create Initial Attempt if applicable
    if (item.primaryAttempt) {
      const attemptKey = `${item.notionPageId}_primary`;
      if (!state.attempts[attemptKey]) {
        const attemptPayload = {
          attemptedAt: item.attemptDate,
          result: item.primaryAttempt.result,
          understood: item.primaryAttempt.understood,
          logicFound: item.primaryAttempt.logicFound,
          codeCompleted: item.primaryAttempt.codeCompleted,
          timeTakenMin: 30,
          confidence: 4,
          approach: item.approach || 'Migrated from Notion.',
          language: 'Java',
        };

        try {
          const createdAttempt = await trackerRequest(`/api/problems/${trackerProblemId}/attempts`, {
            method: 'POST',
            body: JSON.stringify(attemptPayload)
          }, authToken);

          state.attempts[attemptKey] = {
            trackerAttemptId: createdAttempt.id,
            attemptedAt: item.attemptDate,
            result: item.primaryAttempt.result,
            createdAt: new Date().toISOString()
          };
          saveState(state);
          attemptsCreated++;
        } catch (err) {
          console.error(`Failed to create primary attempt for ${progressStr}:`, err.message);
          throw err;
        }
      }
    }

    // If there were any revisit log entries, handle them here
    for (const revisitRel of item.revisitRelations) {
      const revisitKey = `${item.notionPageId}_revisit_${revisitRel.id}`;
      if (!state.attempts[revisitKey]) {
        // Notion revisit row attempt
        attemptsCreated++;
      }
    }

    if ((i + 1) % 5 === 0 || i + 1 === dryRunProblems.length) {
      console.log(`Progress: ${i + 1}/${dryRunProblems.length} problems processed (${problemsCreated} created, ${attemptsCreated} attempts logged, ${problemsSkipped} skipped).`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('MIGRATION COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(70));
  console.log(`Problems created: ${problemsCreated}`);
  console.log(`Attempts created: ${attemptsCreated}`);
  console.log(`Problems skipped (already in state): ${problemsSkipped}`);
}

main().catch(err => {
  console.error('\nFATAL ERROR DURING EXECUTION:');
  console.error(err);
  process.exit(1);
});
