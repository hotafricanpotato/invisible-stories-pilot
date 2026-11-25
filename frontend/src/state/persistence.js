import { initialState, restore, STORAGE_KEY } from "./model.js";
import { exhibitionConfig } from "../content/exhibitionConfig.js";
export const RESET_KEY = `${STORAGE_KEY}:reset`;
const browserStores = { local: () => window.localStorage, session: () => window.sessionStorage };
function read(getStore, key) {
  try { return { ok: true, value: getStore().getItem(key) }; }
  catch { return { ok: false, value: null }; }
}
function remove(getStore, key) {
  try { getStore().removeItem(key); return true; } catch { return false; }
}
const epochOf = stores => read(stores.local, RESET_KEY).value ?? "0";
function compatible(raw) {
  try { const s = JSON.parse(raw); return [1,2,3,4,5,6].includes(s?.version) && s.contentVersion === exhibitionConfig.contentVersion; }
  catch { return false; }
}
export function loadProgress(stores = browserStores) {
  const saved = read(stores.local, STORAGE_KEY);
  const epoch = epochOf(stores);
  if (saved.ok && saved.value !== null) {
    // An existing local record is authoritative, including a clean reset record.
    remove(stores.session, STORAGE_KEY);
    return { state: restore(saved.value), epoch, available: true };
  }
  const legacy = read(stores.session, STORAGE_KEY);
  const state = epoch === "0" && compatible(legacy.value) ? restore(legacy.value) : initialState();
  if (!saved.ok) return { state, epoch, available: false };
  try {
    stores.local().setItem(STORAGE_KEY, JSON.stringify(state));
    remove(stores.session, STORAGE_KEY);
    return { state, epoch, available: true };
  } catch { return { state, epoch, available: false }; }
}
export function saveProgress(state, epoch, stores = browserStores) {
  try {
    if ((stores.local().getItem(RESET_KEY) ?? "0") !== epoch)
      return { ...loadProgress(stores), conflict: true };
    stores.local().setItem(STORAGE_KEY, JSON.stringify(state));
    remove(stores.session, STORAGE_KEY);
    return { available: true, conflict: false };
  } catch { return { available: false, conflict: false }; }
}
export function resetProgress(stores = browserStores) {
  const state = initialState();
  const epoch = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  remove(stores.session, STORAGE_KEY);
  remove(stores.local, STORAGE_KEY);
  try {
    stores.local().setItem(RESET_KEY, epoch);
    // A blank record prevents stale legacy session data from being migrated again.
    stores.local().setItem(STORAGE_KEY, JSON.stringify(state));
    return { state, epoch, available: true };
  } catch { return { state, epoch: epochOf(stores), available: false }; }
}
