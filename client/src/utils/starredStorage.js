const STARRED_KEY = "drivea_starred_ids";
const UNSTARRED_KEY = "drivea_unstarred_ids";

export const getLocalStarredIds = () => {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STARRED_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getLocalUnstarredIds = () => {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(UNSTARRED_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const isItemStarredLocal = (item) => {
  if (!item) return false;
  const unstarredIds = getLocalUnstarredIds();
  if (unstarredIds.includes(item.id)) return false;
  if (item.is_starred === true) return true;
  const starredIds = getLocalStarredIds();
  return starredIds.includes(item.id);
};

export const toggleLocalStarredId = (itemId, willBeStarred) => {
  if (!itemId) return;
  try {
    const starredIds = new Set(getLocalStarredIds());
    const unstarredIds = new Set(getLocalUnstarredIds());
    if (willBeStarred) {
      starredIds.add(itemId);
      unstarredIds.delete(itemId);
    } else {
      starredIds.delete(itemId);
      unstarredIds.add(itemId);
    }
    localStorage.setItem(STARRED_KEY, JSON.stringify([...starredIds]));
    localStorage.setItem(UNSTARRED_KEY, JSON.stringify([...unstarredIds]));
  } catch (e) {
    console.warn("Could not save to localStorage", e);
  }
};
