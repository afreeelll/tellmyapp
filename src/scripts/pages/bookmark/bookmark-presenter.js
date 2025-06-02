//bookmark-presenter.js

export default class BookmarkPresenter {
  #view;
  #bookmarkModel;

  constructor({ view, bookmarkModel }) {
    this.#view = view;
    this.#bookmarkModel = bookmarkModel;
  }

  async loadBookmarks() {
    this.#view.showLoading();
    try {
      // Panggil langsung getBookmarkedStories dari #bookmarkModel
      const stories = await this.#bookmarkModel.getBookmarkedStories(); // <--- Perubahan di sini

      if (stories.length === 0) {
        this.#view.displayEmptyBookmarks();
      } else {
        this.#view.displayBookmarkedStories(stories);
      }
    } catch (error) {
      console.error('Error loading bookmarked stories:', error);
      this.#view.displayError('Gagal memuat cerita tersimpan.');
    } finally {
      this.#view.hideLoading();
    }
  }

  async getBookmarkedStories({ getIds, getStoryDetail }) {
    return this.loadBookmarks({ getIds, getStoryDetail });
  }

  async removeBookmark(id) {
    try {
      await this.#bookmarkModel.removeBookmark(id);
      this.#view.showSuccessMessage('Bookmark berhasil dihapus.');
    } catch (error) {
      console.error('Error removing bookmark:', error);
      this.#view.showErrorMessage('Gagal menghapus bookmark.');
    } finally {
      this.loadBookmarks(); // Refresh bookmark list
    }
  }
}
