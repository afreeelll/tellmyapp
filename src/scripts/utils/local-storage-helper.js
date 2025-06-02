const BOOKMARK_KEY = "BOOKMARK_IDS";

const LocalStorageHelper = {
  get() {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    return raw ? JSON.parse(raw) : [];
  },
  addId(id) {
    const bookmarks = this.get();
    if (!bookmarks.includes(id)) {
      bookmarks.push(id);
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
    }
  },
  removeId(id) {
    const bookmarks = this.get().filter((storedId) => storedId !== id);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
  },
};

export default LocalStorageHelper;
