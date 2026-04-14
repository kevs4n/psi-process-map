import { generateId, createEmptyProcess } from './schema';
import { sampleO2C } from './sampleData';

const STORAGE_KEY = 'process-map:diagrams';

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // corrupted storage, reset
  }
  return null;
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function ensureStore() {
  let store = readStore();
  if (!store) {
    // First-ever load — seed with sample O2C
    const id = generateId('d');
    store = {
      diagrams: {
        [id]: {
          id,
          name: sampleO2C.title,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          process: sampleO2C,
        },
      },
    };
    writeStore(store);
  }
  return store;
}

export function listDiagrams() {
  const store = ensureStore();
  return Object.values(store.diagrams)
    .map(({ id, name, updatedAt }) => ({ id, name, updatedAt }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export function loadDiagram(id) {
  const store = ensureStore();
  const d = store.diagrams[id];
  if (!d) return null;
  return { id: d.id, name: d.name, process: d.process };
}

export function saveDiagram(id, process) {
  const store = ensureStore();
  const existing = store.diagrams[id];
  store.diagrams[id] = {
    id,
    name: process.title,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    process,
  };
  writeStore(store);
}

export function deleteDiagram(id) {
  const store = ensureStore();
  delete store.diagrams[id];
  writeStore(store);
}

export function duplicateDiagram(id) {
  const store = ensureStore();
  const original = store.diagrams[id];
  if (!original) return null;
  const newId = generateId('d');
  store.diagrams[newId] = {
    id: newId,
    name: original.name + ' (copy)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    process: { ...original.process, title: original.process.title + ' (copy)' },
  };
  writeStore(store);
  return newId;
}

export function createDiagram() {
  const store = ensureStore();
  const id = generateId('d');
  const process = createEmptyProcess();
  store.diagrams[id] = {
    id,
    name: process.title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    process,
  };
  writeStore(store);
  return id;
}
