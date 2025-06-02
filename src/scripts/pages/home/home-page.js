import {
  generateLoaderAbsoluteTemplate,
  generateStoryItemTemplate,
  generateStoriesListEmptyTemplate,
  generateStoriesListErrorTemplate,
} from '../../templates';
import HomePresenter from './home-presenter';
import * as TellmyAPI from '../../data/api';
import L from 'leaflet';

export default class HomePage {
  #presenter = null;

  async render() {
    return `
      <section>
        <div class="stories-list__map__container">
          <div id="map" class="stories-list__map"></div>
          <div id="map-loading-container"></div>
        </div>
      </section>

      <section class="container">
        <h1 class="section-title">Daftar Cerita</h1>
        <div id="stories-list-container">
        <div id="stories-list" class="story-grid"></div>
        <div id="stories-list-loading-container"></div>
      </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new HomePresenter({
      view: this,
      model: TellmyAPI,
    });

    await this.#presenter.initialGalleryAndMap();

    await this.initialMap();
  }

  populateStoriesList(message, stories) {
    if (message) {
      return this.populateStoriesListError(message);
    }

    if (!stories || stories.length <= 0) {
      return this.populateStoriesListEmpty();
    }

    const container = document.getElementById('stories-list');
    if (!container) {
      console.error('Container untuk daftar cerita tidak ditemukan.');
      return;
    }

    container.innerHTML = '';

    stories.forEach((storyRaw) => {
      const story = {
        id: storyRaw.id,
        description: storyRaw.description || '',
        evidenceImages: [storyRaw.photoUrl || ''],
        authorName: storyRaw.name || 'Anonim',
        createdAt: storyRaw.createdAt,
        location: {
          lat: storyRaw.lat || '',
          lon: storyRaw.lon || '',
        },
      };

      const card = document.createElement('div');
      card.classList.add('story-card');
      card.innerHTML = generateStoryItemTemplate(story);
      container.appendChild(card);
    });
  }

  populateStoriesListError(message) {
    const container = document.getElementById('stories-list-container');
    if (container) {
      container.innerHTML = generateStoriesListErrorTemplate(message);
    } else {
      console.error('Container untuk daftar cerita tidak ditemukan.');
    }
  }

  populateStoriesListEmpty() {
    const container = document.getElementById('stories-list');
    if (container) {
      container.innerHTML = generateStoriesListEmptyTemplate();
    } else {
      console.error('Container untuk daftar cerita tidak ditemukan.');
    }
  }

  async initialMap() {
    const mapContainer = document.getElementById('map');
    if (mapContainer && mapContainer._leaflet_id) {
      // Leaflet menyimpan ID internal di elemen DOM
      mapContainer._leaflet_id = null;
    }

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    L.Icon.Default.imagePath = 'https://unpkg.com/leaflet@1.7.1/dist/images/';

    const defaultLat = -6.2;
    const defaultLng = 106.816666;
    const defaultZoom = 11;
    let map = null;

    if ('geolocation' in navigator) {
      console.log('geolocation ada, mencoba meminta izin lokasi...');
      try {
        // Mencoba mendapatkan lokasi terkini pengguna
        const position = await new Promise((resolve, reject) => {
          const geoOptions = {
            enableHighAccuracy: true, 
            timeout: 15000, 
            maximumAge: 0, 
          };
          navigator.geolocation.getCurrentPosition(resolve, reject, geoOptions);
        });

        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const userAccuracy = position.coords.accuracy; 

        console.log(
          `Lokasi pengguna ditemukan: Lat ${userLat}, Lng ${userLng}, Akurasi ${userAccuracy}m`
        );

        // Inisialisasi peta di lokasi pengguna
        map = L.map('map').setView([userLat, userLng], 15); // Zoom lebih dekat ke lokasi pengguna

        // Tambahkan marker di lokasi pengguna
        L.marker([userLat, userLng])
          .addTo(map)
          .bindPopup('Lokasi Anda')
          .openPopup();

        // Tambahkan lingkaran akurasi (opsional, untuk visualisasi akurasi GPS)
        L.circle([userLat, userLng], {
          radius: userAccuracy,
          color: 'blue',
          fillColor: '#30f',
          fillOpacity: 0.2,
          weight: 1,
        }).addTo(map);
      } catch (error) {
        console.error('Gagal mendapatkan lokasi pengguna:', error);
        let errorMessage = 'Terjadi kesalahan saat mendapatkan lokasi.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage =
            'Izin lokasi ditolak. Menampilkan peta di lokasi default.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage =
            'Informasi lokasi tidak tersedia. Menampilkan peta di lokasi default.';
        } else if (error.code === error.TIMEOUT) {
          errorMessage =
            'Waktu habis saat mencoba mendapatkan lokasi. Menampilkan peta di lokasi default.';
        }
        alert(errorMessage);

        // Jika gagal, inisialisasi peta di lokasi default
        map = L.map('map').setView([defaultLat, defaultLng], defaultZoom);
        L.marker([defaultLat, defaultLng])
          .addTo(map)
          .bindPopup('Jakarta (Default)')
          .openPopup();
      }
    } else {
      console.warn('Geolocation tidak didukung oleh browser ini.');
      alert(
        'Browser Anda tidak mendukung Geolocation API. Menampilkan peta di lokasi default.'
      );
      // Jika Geolocation tidak didukung, inisialisasi peta di lokasi default
      map = L.map('map').setView([defaultLat, defaultLng], defaultZoom);
      L.marker([defaultLat, defaultLng])
        .addTo(map)
        .bindPopup('Jakarta (Default)')
        .openPopup();
    }

    // Selalu tambahkan tile layer terlepas dari lokasi awal
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    this.map = map;
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  showLoading() {
    document.getElementById('stories-list-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideLoading() {
    const container = document.getElementById('stories-list-loading-container');
    if (container) {
      container.innerHTML = '';
    } else {
      console.warn('stories-list-loading-container tidak ditemukan');
    }
  }
}
