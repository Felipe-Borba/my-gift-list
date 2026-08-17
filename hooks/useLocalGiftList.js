import { useSyncExternalStore } from "react";

import localList from "services/local-list.js";

function useLocalGiftList() {
  const list = useSyncExternalStore(
    localList.subscribe,
    localList.getSnapshot,
    localList.getServerSnapshot,
  );

  function createList(title) {
    return localList.createList({ title });
  }

  function addItem(itemInput) {
    return localList.addItem(itemInput);
  }

  function updateItem(itemId, patch) {
    return localList.updateItem(itemId, patch);
  }

  function removeItem(itemId) {
    localList.removeItem(itemId);
  }

  function clear() {
    localList.clear();
  }

  return { list, createList, addItem, updateItem, removeItem, clear };
}

export default useLocalGiftList;
