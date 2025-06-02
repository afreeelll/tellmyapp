//story-detail-presenter.js
import Database from '../database';

export default class StoryDetailPresenter {
  #view;
  #model;
  #storyId;
  #dbModel;
  #currentStory;

  constructor({ view, model, dbModel }) {
    if (!view) throw new Error('View is required');
    if (!model || typeof model.fetchStoryDetail !== 'function')
      throw new Error('Model must have fetchStoryDetail method');

    this.#view = view;
    this.#model = model;
    this.#dbModel = dbModel;
  }

  async loadStoryDetail(storyId) {
    this.#storyId = storyId;
    console.log('Memuat story detail untuk ID:', storyId);
    try {
      this.#view.showLoading();
      let story;
      const offline = await Database.isOffline();
      console.log('Is Offline?', offline);

      if (offline) {
        story = await Database.getCachedStory(storyId);
        story = await Database.getCachedStory(storyId);
        console.log('[OFFLINE] Mencari story ID:', storyId, '→', story);

        if (!story) throw new Error('Cerita tidak tersedia secara offline.');
      } else {
        const response = await this.#model.fetchStoryDetail(storyId);
        if (!response.ok)
          throw new Error(response.message || 'Gagal memuat detail.');
        story = response.story;
        await Database.putCachedStory(story);
        console.log('[CACHE] Menyimpan story ID:', story.id, story);
      }
      this.#currentStory = story; 
      this.#view.displayStoryDetail(story);
    } catch (error) {
      console.error('Error in Presenter loadStoryDetail:', error);
      this.#view.displayError(
        error.message || 'Terjadi kesalahan saat memuat cerita.'
      );
    } finally {
      this.#view.hideLoading();
    }
  }

  getCurrentStory() {
    return this.#currentStory;
  }

  async notifyMe() {
    try {
      const response = await this.#model.sendStoryToMeViaNotification(
        this.#storyId
      );
      if (!response.ok) {
        console.error('notifyMe: response:', response);
        return;
      }
      console.log('notifyMe:', response.message);
    } catch (error) {
      console.error('notifyMe: error:', error);
    }
  }

  async saveStory() {
    try {
      const story = await this.#model.getStoryById(this.#storyId);
      await this.#dbModel.putStory(story.data);
      this.#view.saveToBookmarkSuccessfully('Success to save to bookmark');
    } catch (error) {
      console.error('saveStory: error:', error);
      this.#view.saveToBookmarkFailed(error.message);
    }
  }

  async removeStory() {
    try {
      await this.#dbModel.removeStory(this.#storyId);
      this.#view.removeFromBookmarkSuccessfully(
        'Success to remove from bookmark'
      );
    } catch (error) {
      console.error('removeStory: error:', error);
      this.#view.removeFromBookmarkFailed(error.message);
    }
  }
}
