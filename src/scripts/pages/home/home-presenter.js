import Database from '../../database';

export default class HomePresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async showStoriesListMap() {
    this.#view.showMapLoading();
    try {
    await this.#view.initialMap();

    } catch (error) {
      console.error("showStoriesListMap: error:", error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async initialGalleryAndMap() {
    try {
      await this.showStoriesListMap();
      await this.loadStories();
    } catch (error) {
      this.#view.populateStoriesListError(error.message);
    } finally {
      this.#view.hideLoading();
    }
  }

  async loadStories() {
  try {
    // Coba ambil data dari API
    const response = await this.#model.getAllStories();
    console.log("getAllStories response:", response);

    if (!response.ok || !response.listStory) {
      throw new Error(response.message || "Gagal memuat cerita dari server.");
    }

    const stories = response.listStory;

    for (const story of stories) {
      try {
        await Database.putSavedStory(story); 
      } catch (e) {
        console.warn("Gagal menyimpan ke IndexedDB:", e);
      }
    }

    this.#view.populateStoriesList(null, stories);
  } catch (err) {
    console.error("loadStories error, mencoba fallback offline:", err);

    try {
      const cachedStories = await Database.getAllCachedStories();

      if (cachedStories.length === 0) {
        this.#view.populateStoriesListError("Tidak ada data offline yang tersedia.");
        return;
      }

      this.#view.populateStoriesList(null, cachedStories);
    } catch (offlineErr) {
      console.error("loadStories fallback error:", offlineErr);
      this.#view.populateStoriesListError("Gagal mengambil data cerita.");
    }
  }
}

}
