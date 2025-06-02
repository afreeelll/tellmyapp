//story-detail-page.js
import StoryDetailPresenter from './story-detail-presenter';
import StoryDetailModel from './story-detail-model';
import { generateLoaderTemplate } from '../templates';
import { generateStoryDetailTemplate } from '../templates';
import BookmarkModel from './bookmark/bookmark-model';
import Database from '../database';

export default class StoryDetailPage {
  #presenter;
  #storyId;

  constructor() {
    const model = new StoryDetailModel();
    this.#presenter = new StoryDetailPresenter({ view: this, model: model });
  }

  setPresenter(presenter) {
    this.#presenter = presenter;
  }

  setNotifyMeButtonHandler(handler) {
    const notifyMeButton = document.getElementById('story-detail-notify-me');
    if (notifyMeButton) {
      notifyMeButton.addEventListener('click', handler);
      console.log('Event listener for Notify Me button attached.');
    } else {
      console.warn('Notify Me button not found in DOM.');
    }
  }

  updateNotifyMeButton(text, disable = false) {
    const notifyMeButton = document.getElementById('story-detail-notify-me');
    this.#presenter.notifyMe();

    if (notifyMeButton) {
      notifyMeButton.textContent = text;
      notifyMeButton.disabled = disable;

      if (text === 'Notifikasi Dikirim!') {
        notifyMeButton.innerHTML = `Notifikasi Dikirim! <i class="fas fa-check"></i>`;
        notifyMeButton.disabled = true;
      } else if (text === 'Mengirim...') {
        notifyMeButton.innerHTML = `Mengirim... <i class="fas fa-spinner fa-spin"></i>`;
        notifyMeButton.disabled = true;
      } else {
        notifyMeButton.innerHTML = `Try Notify Me <i class="far fa-bell"></i>`;
        notifyMeButton.disabled = false;
      }
    }
  }

  async render() {
    return `
      <section class="story-detail">
        <div class="container">
          <div id="story-detail-loading" class="loading-container">
            ${generateLoaderTemplate()}
          </div>
          <div id="story-detail-content" class="story-detail-content" style="display: none;">
            <!-- Story content will be populated here -->
          </div>
          <div id="story-detail-error" class="error-container" style="display: none;">
            <!-- Error message will be populated here -->
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    try {
      this.#storyId = this.#extractStoryIdFromUrl();

      if (!this.#storyId) {
        this.displayError('ID cerita tidak valid.');
        return;
      }

      console.log('Loading story detail for ID:', this.#storyId);
      const story = await this.#presenter.loadStoryDetail(this.#storyId);

      const contentEl = document.getElementById('story-detail-content');
      const errorEl = document.getElementById('error-container');

      errorEl.style.display = 'none';
      contentEl.style.display = 'block';

      contentEl.innerHTML = generateStoryDetailTemplate(story);
      if (!this.#presenter) {
        throw new Error('Presenter not initialized');
      }

      await this.#presenter.loadStoryDetail(this.#storyId);
    } catch (error) {
      console.error('Error in afterRender:', error);
      this.displayError('Gagal memuat detail cerita.');
    }

    const content = document.getElementById('story-detail-content');
    content.style.display = 'block';
  }

  #extractStoryIdFromUrl() {
    const hash = window.location.hash;
    const patterns = [
      /^#\/story\/(.+)$/,
      /^#\/detail\/(.+)$/,
      /^#\/stories\/(.+)$/,
    ];

    for (const pattern of patterns) {
      const match = hash.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const idFromParam = urlParams.get('id');
    if (idFromParam) {
      return idFromParam;
    }

    console.warn('Story ID not found in URL:', hash);
    return null;
  }

  // Method yang dipanggil oleh presenter
  async displayStoryDetail(story) {
    try {
      this.hideLoading();

      const contentElement = document.getElementById('story-detail-content');
      const errorElement = document.getElementById('story-detail-error');

      if (!contentElement) {
        console.error('Story detail content element not found');
        return;
      }

      if (errorElement) {
        errorElement.style.display = 'none';
      }

      const createdAt = new Date(story.createdAt).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      contentElement.innerHTML = generateStoryDetailTemplate({
        description: story.description,
        evidenceImages:
          story.evidenceImages || (story.photoUrl ? [story.photoUrl] : []),
        latitudeLocation: story.lat,
        longitudeLocation: story.lon,
        authorName: story.name || 'Anonim',
        createdAt: story.createdAt,
      });

      if (story.lat && story.lon) {
        this.#initializeMap(story.lat, story.lon, story.name);
      }

      const bookmarkBtn = document.getElementById('story-detail-bookmark');
      if (bookmarkBtn) {
        try {
          const isBookmarked = await BookmarkModel.isBookmarked(this.#storyId);

          bookmarkBtn.innerHTML = isBookmarked
            ? 'Tersimpan <i class="fas fa-bookmark"></i>'
            : 'Bookmark Cerita <i class="far fa-bookmark"></i>';

          bookmarkBtn.onclick = async () => {
            const currentlyBookmarked = await BookmarkModel.isBookmarked(
              this.#storyId
            );

            if (currentlyBookmarked) {
              await BookmarkModel.removeBookmark(this.#storyId);
            } else {
              // kamu perlu akses detail cerita lengkap (bukan cuma ID)
              const story = this.#presenter.getCurrentStory(); // pastikan ada getter ini
              await BookmarkModel.saveBookmark(story);
            }

            const updated = await BookmarkModel.isBookmarked(this.#storyId);
            bookmarkBtn.innerHTML = updated
              ? 'Tersimpan <i class="fas fa-bookmark"></i>'
              : 'Bookmark Cerita <i class="far fa-bookmark"></i>';
          };
        } catch (error) {
          console.error('Bookmark check failed:', error);
        }
      }
    } catch (error) {
      console.error('Error displaying story detail:', error);
      this.displayError('Gagal menampilkan detail cerita.');
    }
  }

  displayError(message) {
    try {
      this.hideLoading();

      const contentElement = document.getElementById('story-detail-content');
      const errorElement = document.getElementById('story-detail-error');

      if (contentElement) {
        contentElement.style.display = 'none';
      }

      if (errorElement) {
        errorElement.innerHTML = `
          <div class="error-message">
            <h2>Oops! Terjadi Kesalahan</h2>
            <p>${message}</p>
            <div class="error-actions">
              <button onclick="window.location.reload()" class="btn">Coba Lagi</button>
              <a href="#/home" class="btn btn-outline">Kembali ke Beranda</a>
            </div>
          </div>
        `;
        errorElement.style.display = 'block';
      } else {
        alert(message);
      }
    } catch (error) {
      console.error('Error displaying error message:', error);
      alert(message);
    }
  }

  showLoading() {
    const loadingElement = document.getElementById('story-detail-loading');
    const contentElement = document.getElementById('story-detail-content');
    const errorElement = document.getElementById('story-detail-error');

    if (loadingElement) {
      loadingElement.style.display = 'block';
    }

    if (contentElement) {
      contentElement.style.display = 'none';
    }

    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }

  hideLoading() {
    const loadingElement = document.getElementById('story-detail-loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    } else {
      console.warn('Loading element not found');
    }
  }

  #initializeMap(lat, lon, storyName) {
    try {
      if (typeof L === 'undefined') {
        console.warn('Leaflet library not loaded, skipping map initialization');
        return;
      }

      const mapElement = document.getElementById('story-map');
      if (!mapElement) {
        console.warn('Map element not found');
        return;
      }

      const isValidLocation =
        typeof lat === 'number' &&
        typeof lon === 'number' &&
        lat !== 0 &&
        lon !== 0;

      let map;
      if (isValidLocation) {
        map = L.map('story-map').setView([lat, lon], 15);

        const marker = L.marker([lat, lon]).addTo(map);

        if (storyName) {
          marker.bindPopup(`<b>${storyName}</b>`).openPopup();
        } else {
          marker.bindPopup('Lokasi Cerita').openPopup();
        }

        if (mapElement.parentElement) {
          mapElement.parentElement.style.display = 'block';
        }
      } else {
        console.warn(
          'Story location is invalid or not provided. Displaying default map or hiding.'
        );

        const defaultLat = -6.2;
        const defaultLon = 106.816666;

        map = L.map('story-map').setView([defaultLat, defaultLon], 10);
        L.marker([defaultLat, defaultLon])
          .addTo(map)
          .bindPopup('Lokasi tidak tersedia. Default: Jakarta')
          .openPopup();

        if (mapElement.parentElement) {
          mapElement.parentElement.style.display = 'block';
        }
      }

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
    } catch (error) {
      console.error('Error initializing map:', error);
      const mapElement = document.getElementById('story-map');
      if (mapElement && mapElement.parentElement) {
        mapElement.parentElement.style.display = 'none';
        mapElement.innerHTML =
          '<div class="error-message">Gagal memuat peta lokasi.</div>';
      }
    }
  }

  destroy() {
    this.#presenter = null;
    this.#storyId = null;
  }
}
