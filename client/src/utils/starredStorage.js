const STARRED_KEY = "drivea_starred_ids";

export const getLocalStarredIds = () => {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STARRED_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const isItemStarredLocal = (item) => {
  if (!item) return false;
  if (item.is_starred === true) return true;
  const ids = getLocalStarredIds();
  return ids.includes(item.id);
};

export const toggleLocalStarredId = (itemId, willBeStarred) => {
  if (!itemId) return;
  try {
    const ids = new Set(getLocalStarredIds());
    if (willBeStarred) {
      ids.add(itemId);
    } else {
      ids.delete(itemId);
    }
    localStorage.setItem(STARRED_KEY, JSON.stringify([...ids]));
  } catch (e) {
    console.warn("Could not save to localStorage", e);
  }
};

