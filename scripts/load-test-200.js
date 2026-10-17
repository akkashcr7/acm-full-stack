/**
 * Team ACE Robotics Platform - 200 Concurrent Leaderboard Viewers Load Test
 *
 * Simulates 200 simultaneous spectators and hall projectors hitting the live leaderboard.
 *
 * Usage:
 *   node scripts/load-test-200.js [BASE_URL]
 * e.g. node scripts/load-test-200.js http://localhost:3000
 *   or node scripts/load-test-200.js https://your-app.vercel.app
 */

const http = require("http");
const https = require("https");

const targetUrl = process.argv[2] || "http://localhost:3000";
const CONCURRENT_CLIENTS = 200;
const DURATION_SECONDS = 5;

console.log(`=======================================================`);
console.log(`🚀 TEAM ACE LOAD TEST: 200 CONCURRENT VIEWERS`);
console.log(`🎯 Target Endpoint: ${targetUrl}/api/leaderboard`);
console.log(`👥 Concurrent Clients: ${CONCURRENT_CLIENTS}`);
console.log(`=======================================================\n`);

const latencies = [];
let successCount = 0;
let errorCount = 0;
const startTime = Date.now();

function fetchLeaderboard(clientId) {
  return new Promise((resolve) => {
    const reqStart = Date.now();
    const url = new URL(`${targetUrl}/api/leaderboard`);
    const protocol = url.protocol === "https:" ? https : http;

    const req = protocol.get(
      url,
      {
        headers: {
          "User-Agent": `AceLoadTester-Client-${clientId}`,
          Accept: "application/json",
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          const latency = Date.now() - reqStart;
          latencies.push(latency);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            successCount++;
          } else {
            errorCount++;
          }
          resolve(latency);
        });
      }
    );

    req.on("error", (err) => {
      errorCount++;
      resolve(null);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      errorCount++;
      resolve(null);
    });
  });
}

async function runLoadTest() {
  console.log(`[+] Launching 200 concurrent viewers...`);

  const clientPromises = [];
  for (let i = 1; i <= CONCURRENT_CLIENTS; i++) {
    clientPromises.push(fetchLeaderboard(i));
  }

  await Promise.all(clientPromises);

  const totalTimeSec = (Date.now() - startTime) / 1000;
  latencies.sort((a, b) => a - b);

  const min = latencies.length > 0 ? latencies[0] : 0;
  const max = latencies.length > 0 ? latencies[latencies.length - 1] : 0;
  const avg =
    latencies.length > 0
      ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1)
      : 0;
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

  console.log(`\n================== LOAD TEST RESULTS ==================`);
  console.log(`Total Requests Sent : ${CONCURRENT_CLIENTS}`);
  console.log(`Successful (200 OK) : ${successCount}`);
  console.log(`Failed / Timed Out  : ${errorCount}`);
  console.log(`Total Elapsed Time  : ${totalTimeSec.toFixed(2)}s`);
  console.log(`Throughput          : ${(successCount / totalTimeSec).toFixed(1)} req/sec`);
  console.log(`------------------ LATENCY METRICS --------------------`);
  console.log(`Min Latency         : ${min} ms`);
  console.log(`Average Latency     : ${avg} ms`);
  console.log(`p50 (Median)        : ${p50} ms`);
  console.log(`p95 Latency         : ${p95} ms`);
  console.log(`p99 Latency         : ${p99} ms`);
  console.log(`Max Latency         : ${max} ms`);
  console.log(`-------------------------------------------------------`);

  if (p95 < 2000 && errorCount === 0) {
    console.log(`✅ PASSED: 100% success rate with p95 < 2.0s requirement!`);
  } else if (errorCount === 0) {
    console.log(`⚠️ Completed with 0 errors.`);
  } else {
    console.log(`❌ Note: Some requests failed (Check if local server is running).`);
  }
  console.log(`=======================================================\n`);
}

runLoadTest();
