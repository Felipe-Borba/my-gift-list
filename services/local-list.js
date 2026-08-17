// Único módulo que conhece o localStorage para a lista anônima (sem conta).
// Mesma forma de dados de gift_lists/gift_items (data-model.md), sem os campos
// que só existem depois de compartilhada (owner_user_id, share_slug, etc.).
//
// Expõe subscribe/getSnapshot/getServerSnapshot para uso com
// useSyncExternalStore (hooks/useLocalGiftList.js): o snapshot é cacheado e só
// muda de referência quando o dado muda de fato, evitando loops de render.

const STORAGE_KEY = "gift-list-suggestions:local-list";
const listeners = new Set();
let cachedSnapshot = null;
let cachedSnapshotRead = false;

function isBrowser() {
  return typeof window !== "undefined" && window.localStorage;
}

function generateId() {
  return crypto.randomUUID();
}

function readFromStorage() {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function commit(list) {
  cachedSnapshot = list;
  cachedSnapshotRead = true;

  if (isBrowser()) {
    if (list) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  listeners.forEach((listener) => listener());
  return list;
}

function getSnapshot() {
  if (!cachedSnapshotRead) {
    cachedSnapshot = readFromStorage();
    cachedSnapshotRead = true;
  }

  return cachedSnapshot;
}

function getServerSnapshot() {
  return null;
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getList() {
  return getSnapshot();
}

function createList({ title }) {
  return commit({ id: generateId(), title, items: [] });
}

function addItem({
  marketplaceUrl,
  title = null,
  imageUrl = null,
  priceCents = null,
  manualOverride = false,
}) {
  const list = getSnapshot();

  if (!list) {
    throw new Error("Nenhuma lista local encontrada.");
  }

  const item = {
    id: generateId(),
    marketplace_url: marketplaceUrl,
    title,
    image_url: imageUrl,
    price_cents: priceCents,
    manual_override: manualOverride,
    status: "available",
  };

  commit({ ...list, items: [...list.items, item] });
  return item;
}

function updateItem(itemId, patch) {
  const list = getSnapshot();

  if (!list) {
    throw new Error("Nenhuma lista local encontrada.");
  }

  let updatedItem = null;
  const items = list.items.map((item) => {
    if (item.id !== itemId) {
      return item;
    }
    updatedItem = { ...item, ...patch };
    return updatedItem;
  });

  if (!updatedItem) {
    throw new Error("Item não encontrado na lista local.");
  }

  commit({ ...list, items });
  return updatedItem;
}

function removeItem(itemId) {
  const list = getSnapshot();

  if (!list) {
    throw new Error("Nenhuma lista local encontrada.");
  }

  const items = list.items.filter((item) => item.id !== itemId);
  return commit({ ...list, items });
}

function clear() {
  commit(null);
}

const localList = {
  getList,
  createList,
  addItem,
  updateItem,
  removeItem,
  clear,
  subscribe,
  getSnapshot,
  getServerSnapshot,
};

export default localList;
