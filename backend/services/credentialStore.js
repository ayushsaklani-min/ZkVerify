/**
 * zkVerify — Moca Buildathon 2025 | Auditable Zero-Knowledge Verification Layer
 * 
 * Credential Store: In-memory and file-based storage for issued credentials.
 * Manages credential metadata and on-chain ID mappings.
 */

const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', 'credentials.json');

function ensureStore() {
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify({ credentials: [] }, null, 2));
  }
}

function readStore() {
  ensureStore();
  const raw = fs.readFileSync(STORE_PATH, 'utf8');
  return JSON.parse(raw || '{"credentials":[]}');
}

function writeStore(store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function upsertCredential(credential) {
  const store = readStore();
  const existingIndex = store.credentials.findIndex((c) => c.id === credential.id);

  const payload = {
    ...credential,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    store.credentials[existingIndex] = payload;
  } else {
    store.credentials.push({ ...payload, createdAt: new Date().toISOString() });
  }

  writeStore(store);
  return payload;
}

function getCredential(id) {
  if (!id) return null;
  const store = readStore();
  return store.credentials.find((c) => c.id === id) || null;
}

function listCredentials(filter = {}) {
  const store = readStore();
  return store.credentials.filter((c) => {
    if (filter.issuer && c.issuer?.toLowerCase() !== filter.issuer.toLowerCase()) {
      return false;
    }
    if (filter.subject && c.subject?.toLowerCase() !== filter.subject.toLowerCase()) {
      return false;
    }
    return true;
  });
}

module.exports = {
  upsertCredential,
  getCredential,
  listCredentials,
};

