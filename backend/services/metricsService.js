/**
 * zkVerify — Moca Buildathon 2025 | Auditable Zero-Knowledge Verification Layer
 * 
 * Metrics Service: Collects and aggregates proof generation and verification metrics.
 * Tracks proof latency, gas usage, and success rates.
 */

const fs = require('fs');
const path = require('path');

const METRICS_PATH = path.join(__dirname, '..', 'metrics.json');

const metrics = {
  proofGeneration: [],
  proofVerification: [],
};

function ensureFile() {
  if (fs.existsSync(METRICS_PATH)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(METRICS_PATH, 'utf8'));
      if (Array.isArray(parsed.proofGeneration)) metrics.proofGeneration = parsed.proofGeneration;
      if (Array.isArray(parsed.proofVerification)) metrics.proofVerification = parsed.proofVerification;
    } catch (err) {
      // ignore malformed file and overwrite later
    }
  }
}

function persist() {
  fs.writeFileSync(METRICS_PATH, JSON.stringify(metrics, null, 2));
}

ensureFile();

function logProofGeneration(entry) {
  metrics.proofGeneration.push({
    ...entry,
    timestamp: new Date().toISOString(),
  });
  metrics.proofGeneration = metrics.proofGeneration.slice(-200);
  persist();
}

function logProofVerification(entry) {
  metrics.proofVerification.push({
    ...entry,
    timestamp: new Date().toISOString(),
  });
  metrics.proofVerification = metrics.proofVerification.slice(-200);
  persist();
}

function average(items, key) {
  if (!items.length) return 0;
  const filtered = items
    .map((item) => Number(item[key]))
    .filter((value) => Number.isFinite(value));
  if (!filtered.length) return 0;
  const total = filtered.reduce((acc, curr) => acc + curr, 0);
  return total / filtered.length;
}

function median(items, key) {
  if (!items.length) return 0;
  const filtered = items
    .map((item) => Number(item[key]))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  if (!filtered.length) return 0;
  const mid = Math.floor(filtered.length / 2);
  if (filtered.length % 2 === 0) {
    return (filtered[mid - 1] + filtered[mid]) / 2;
  }
  return filtered[mid];
}

function successRate(items) {
  if (!items.length) return 0;
  const successes = items.filter((item) => item.success === true).length;
  return (successes / items.length) * 100;
}

function latest(items) {
  return items.length ? items[items.length - 1] : null;
}

function getMetrics() {
  const proofGenAverage = average(metrics.proofGeneration, 'durationMs');
  const proofGenMedian = median(metrics.proofGeneration, 'durationMs');
  const verifyAverageGas = average(metrics.proofVerification, 'gasUsed');
  const verifyMedianGas = median(metrics.proofVerification, 'gasUsed');
  const verifyMedianLatency = median(metrics.proofVerification, 'latencyMs');

  const updatedAt = latest(
    metrics.proofVerification.length ? metrics.proofVerification : metrics.proofGeneration
  )?.timestamp || new Date().toISOString();

  return {
    proofGeneration: {
      count: metrics.proofGeneration.length,
      averageMs: Number(proofGenAverage.toFixed(2)),
      medianMs: Number(proofGenMedian.toFixed(2)),
      last: latest(metrics.proofGeneration),
      recent: metrics.proofGeneration.slice(-10)
    },
    proofVerification: {
      count: metrics.proofVerification.length,
      averageGas: Number(verifyAverageGas.toFixed(2)),
      medianGas: Number(verifyMedianGas.toFixed(2)),
      medianLatencyMs: Number(verifyMedianLatency.toFixed(2)),
      successRate: Number(successRate(metrics.proofVerification).toFixed(2)),
      last: latest(metrics.proofVerification),
      recent: metrics.proofVerification.slice(-10)
    },
    summary: {
      proof_time_ms: Number(proofGenMedian.toFixed(2)),
      verify_gas: Number(verifyMedianGas.toFixed(2)),
      success_rate: Number(successRate(metrics.proofVerification).toFixed(2)),
      updated_at: updatedAt
    }
  };
}

module.exports = {
  logProofGeneration,
  logProofVerification,
  getMetrics,
};

