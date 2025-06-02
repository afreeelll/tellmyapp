import {
  generateStoryItemTemplate,
  generateStoriesListEmptyTemplate,
  generateLoaderTemplate,
  generateStoryDetailErrorTemplate,
} from '../../templates';
import BookmarkPresenter from './bookmark-presenter';
import BookmarkModel from './bookmark-model';
import Database from '../../database';

export default class BookmarkPage {
  #presenter;
  #bookmarksListContainer;
  #loadingContainer;

  constructor() {
    this.#presenter = new BookmarkPresenter({
      view: this,
      bookmarkModel: BookmarkModel,
    });
    this.setupBookmarkEvents = this.setupBookmarkEvents.bind(this);
    this._bookmarks = [];
  }

  async render() {
    return `
      <section class="container">
        <h2 class="section-title">Cerita Tersimpan</h2>
        <div id="bookmarks-list" class="story-grid"></div>
        <div id="loading-container"></div>
      </section>
    `;
  }

  async afterRender() {
    this.#bookmarksListContainer = document.getElementById('bookmarks-list');
    this.#loadingContainer = document.getElementById('loading-container');

    await this.#presenter.loadBookmarks();

    this.setupBookmarkEvents();
  }

  onBookmarkRemoved(id) {
    this.refreshBookmarks(); // Ini akan memicu presenter untuk memuat ulang
  }

  showLoading() {
    this.#loadingContainer.innerHTML = generateLoaderTemplate();
    this.#bookmarksListContainer.innerHTML = '';
  }

  hideLoading() {
    this.#loadingContainer.innerHTML = '';
  }

  displayBookmarkedStories(stories) {
    if (stories.length > 0) {
      this.#bookmarksListContainer.innerHTML = stories
        .map((story) =>
          generateStoryItemTemplate({
            id: story.id,
            description: story.description,
            evidenceImages: [story.photoUrl],
            authorName: story.author,
            createdAt: story.createdAt,
            location: {
              lat: story.lat,
              lon: story.lon,
            },
            isBookmarked: true,
            isBookmarkPage: true,
          })
        )
        .join('');
    } else {
      this.#bookmarksListContainer.innerHTML =
        generateStoriesListEmptyTemplate();
    }
  }

  displayEmptyBookmarks() {
    this.#bookmarksListContainer.innerHTML = generateStoriesListEmptyTemplate();
  }

  displayError(message) {
    this.#bookmarksListContainer.innerHTML =
      generateStoryDetailErrorTemplate(message);
  }

  showSuccessMessage(message) {
    alert(message);
  }

  showErrorMessage(message) {
    alert(message);
  }

  async refreshBookmarks() {
    await this.#presenter.loadBookmarks({
      getIds: BookmarkModel.getBookmarkedIds,
      getStoryDetail: BookmarkModel.getStoryDetail,
    });
  }

  setupBookmarkEvents() {
    if (!this.#bookmarksListContainer) return;

    this.#bookmarksListContainer.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-id].story-item__delete-bookmark');
      if (!btn) return;

      const storyId = btn.dataset.id;
      console.log('Try to deleting bookmark:', storyId);

      try {
        console.log('Calling removeBookmark...');
        await BookmarkModel.removeBookmark(storyId);
        console.log('Successfully removed');
        this.onBookmarkRemoved(storyId); // refresh list
      } catch (error) {
        console.error('Error deleting bookmark:', error);
        this.showErrorMessage('Gagal menghapus bookmark.');
      }
    });
  }
}
