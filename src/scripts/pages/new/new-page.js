// new-page.js
import NewPresenter from "./new-presenter";
import { generateLoaderAbsoluteTemplate } from "../../templates"; 
import * as TellmyAPI from "../../data/api";
import Camera from "../../utils/camera";
import Database from "../../database";

export default class NewPage {
  #presenter;
  #form;
  #isCameraOpen = false;
  #camera;

  async render() {
    return `
        <section>
          <div class="new-story__header">
            <div class="container">
              <h1 class="new-story__header__title">Berbagi Cerita Baru</h1>
              <p class="new-story__header__description">
                Hi, ayo ceritakan pengalaman kamu hari ini!<br>
                Aku yakin sudah banyak yang menunggu cerita mu.
              </p>
            </div>
          </div>
        </section>
    
        <section class="container">
          <div class="new-form__container">
            <form id="new-form" class="new-form">
              <div class="form-control">
                <div class="new-form__title__container">
                </div>
              <div class="form-control">
                <label for="description-input" class="new-form__description__title">Isi Cerita</label>

                <div class="new-form__description__container">
                  <textarea
                    id="description-input"
                    name="description"
                    placeholder="Ceritakan kisahmu dengan lengkap."
                  ></textarea>
                </div>
              </div>
              <div class="form-control">
                <label for="documentations-input" class="new-form__documentations__title">Dokumentasi</label>
                <div id="documentations-more-info">Anda juga dapat menyertakan dokumentasi hari ini.</div>

                <div class="new-form__documentations__buttons">
                  <button id="documentations-input-button" class="btn btn-outline" type="button">Ambil Gambar</button>
                  <input
                    id="documentations-input"
                    class="new-form__documentations__input"
                    name="documentations"
                    type="file"
                    accept="image/*"
                    multiple
                    aria-multiline="true"
                    aria-describedby="documentations-more-info"
                  >
                  <button id="open-documentations-camera-button" class="btn btn-outline" type="button">
                    Buka Kamera
                  </button>
                </div>

                <div id="camera-container" class="new-form__camera__container">
                  <video id="camera-video" class="new-form__camera__video" autoplay playsinline>
                  Video stream not available.
                </video>
                <div id="camera-fallback-message" style="display:none;">Kamera tidak tersedia.</div>

                <div class="new-form__camera__tools">
                  <select id="camera-select"></select>
                </div>

                    <button id="capture-button" class="btn btn-capture" type="button" style="display: none;">
                      Tangkap Gambar
                    </button>
                </div>
              </div>
              <ul id="documentations-taken-list" class="new-form__documentations__outputs"></ul>
              <div class="form-control">
                <div class="new-form__location__title">Lokasi</div>
  
                <div class="new-form__location__container">
                  <div class="new-form__location__map__container">
                    <div id="map" class="new-form__location__map"></div>
                    <div id="map-loading-container"></div>
                  </div>
                  <div class="new-form__location__lat-lng">
                    <input type="text" name="latitude" value="-6.175389" readonly>
                    <input type="text" name="longitude" value="106.827139" readonly>
                  </div>
                </div>
              </div>
              <div class="form-buttons">
                <span id="submit-button-container">
                  <button class="btn" type="submit">Bagikan Cerita
                  </button>
                </span>
                <a class="btn btn-outline" href="#/">Batal</a>
              </div>
            </form>
          </div>
        </section>
      `;
  }

  async afterRender() {
    // Inisiasi komponen View seperti Camera di View
    this.#camera = new Camera({
      video: document.getElementById("camera-video"),
      cameraSelect: document.getElementById("camera-select"),
    });

    document.getElementById("camera-container").style.display = "none";


    // Inisiasi Presenter, berikan View, Model, dan Camera sebagai dependensi
    this.#presenter = new NewPresenter({
      view: this,
      model: TellmyAPI, 
      camera: this.#camera, 
    });

    this.#presenter.showNewFormMap();

    this.#setupFormListeners();
    this.#setupCameraListeners();

    setTimeout(() => this.#presenter.populateTakenPictures(), 0);

  }

  #setupFormListeners() {
    this.#form = document.getElementById("new-form");

    this.#form.addEventListener("submit", async (event) => {
      event.preventDefault();

      // Ambil data form langsung dari DOM (tugas View)
      const description = this.#form.elements.namedItem("description").value;
      const latitude = this.#form.elements.namedItem("latitude").value;
      const longitude = this.#form.elements.namedItem("longitude").value;

      // Teruskan data ke Presenter
      await this.#presenter.handleSubmitStory({
        description,
        latitude,
        longitude,
      });
    });

document
  .getElementById("documentations-input")
  .addEventListener("change", async (event) => {
    try {
      await this.#presenter.handleFileInput(Array.from(event.target.files));
    } catch (error) {
      console.error("Error handling file input:", error);
      // Simpan ke offline queue jika perlu
      if (await Database.isOffline()) {
        const files = Array.from(event.target.files);
        // Simpan files ke IndexedDB atau offline queue
      }
    }
  });
  }

  #setupCameraListeners() {
    const openCameraButton = document.getElementById(
      "open-documentations-camera-button"
    );
    const cameraContainer = document.getElementById("camera-container");
    const cameraSelect = document.getElementById("camera-select");
    const captureButton = document.getElementById("capture-button");
    const cameraFallbackMessage = document.getElementById("camera-fallback-message");
    const videoElement = document.getElementById("camera-video"); 

    videoElement.style.display = "block";
    cameraSelect.style.display = "none"; 
    captureButton.style.display = "none";
    cameraFallbackMessage.style.display = "none";


    // Fungsi untuk memperbarui tampilan kamera saat ditutup
    const updateCameraViewClosed = () => {
      videoElement.style.display = "none";
      cameraContainer.appendChild(cameraFallbackMessage); 
      openCameraButton.textContent = "Buka Kamera";
      captureButton.style.display = "none";
      cameraSelect.style.display = "none";
      this.#isCameraOpen = false;
    };

    // Fungsi untuk memperbarui tampilan kamera saat dibuka
    const updateCameraViewOpen = (devices) => {
        const toolsContainer = document.createElement("div");
        toolsContainer.className = "new-form__camera__tools";
        toolsContainer.appendChild(cameraSelect);
        cameraContainer.appendChild(toolsContainer);
        
        this.populateCameraDevices(devices); 
        
        openCameraButton.textContent = "Tutup Kamera";
        captureButton.style.display = "inline-block";
        cameraSelect.style.display = "block";
        this.#isCameraOpen = true;
    };

    // Delegasikan berhenti kamera saat pindah halaman/sebelum unload ke presenter
    window.addEventListener("hashchange", () => this.#presenter.stopCamera());
    window.addEventListener("beforeunload", () => this.#presenter.stopCamera());

    openCameraButton.addEventListener("click", async () => {
  if (this.#isCameraOpen) {
    this.#presenter.stopCamera();
    cameraContainer.style.display = "none";
    openCameraButton.textContent = "Buka Kamera";
    captureButton.style.display = "none"; 
    this.#isCameraOpen = false;
  } else {
    try {
      const devices = await this.#presenter.startCamera();
      if (devices.length > 0) {
        cameraContainer.style.display = "block";
        captureButton.style.display = "inline-block"; 
        openCameraButton.textContent = "Tutup Kamera";
        this.populateCameraDevices(devices);
        this.#isCameraOpen = true;
      } else {
        throw new Error("Stream tidak tersedia");
      }
    } catch (error) {
      console.error(error);
      alert("Tidak dapat mengakses kamera.");
      this.#presenter.stopCamera();
      cameraContainer.style.display = "none";
      captureButton.style.display = "none";
      openCameraButton.textContent = "Buka Kamera";
      this.#isCameraOpen = false;
    }
  }
});

    

    captureButton.addEventListener("click", async () => {
      await this.#presenter.handleCaptureImage();
    });

    cameraSelect.addEventListener("change", async () => {
      await this.#presenter.handleChangeCamera(cameraSelect.value);
    });
  }

  // Dipanggil Presenter untuk menampilkan daftar gambar yang diambil
  renderTakenPictures(documentations) {
    const imageListElement = document.getElementById(
      "documentations-taken-list"
    );
    let html = "";

    if (documentations.length === 0) {
      imageListElement.innerHTML = "Tidak ada gambar yang diambil.";
      return;
    }

    html = documentations.reduce(
      (accumulator, picture, currentIndex) => {
        // Buat URL objek dari Blob (tugas View untuk menampilkan)
        const imageUrl = URL.createObjectURL(picture.blob);
        return accumulator.concat(`
          <li class="new-form__documentations__outputs-item">
            <img src="${imageUrl}" alt="Dokumentasi ke-${currentIndex + 1}">
          </li>
        `);
      },
      ""
    );
    imageListElement.innerHTML = html;
    document
      .querySelectorAll("button[data-deletepictureid]")
      .forEach((button) =>
        button.addEventListener("click", (event) => {
          const pictureId = event.currentTarget.dataset.deletepictureid;
          this.#presenter.handleDeletePicture(pictureId); 
        })
      );
  }

  // Dipanggil Presenter untuk mengisi opsi perangkat kamera
  populateCameraDevices(devices) {
    const cameraSelect = document.getElementById("camera-select");
    cameraSelect.innerHTML = "";
    if (devices.length === 0) {
      const option = document.createElement("option");
      option.text = "Tidak ada kamera yang tersedia";
      cameraSelect.appendChild(option);
      cameraSelect.disabled = true;
    } else {
      cameraSelect.disabled = false;
      devices.forEach((device, index) => {
        const option = document.createElement("option");
        option.value = device.deviceId;
        option.text = device.label || `Kamera ${index + 1}`;
        cameraSelect.appendChild(option);
      });
    }
  }

  // Metode untuk inisialisasi peta (tugas View untuk komponen UI)
  async initialMap() {
    const map = L.map("map").setView([-6.1754, 106.8272], 13); // Default Jakarta
    let userMarker; 

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const latInput = document.querySelector('input[name="latitude"]');
    const lngInput = document.querySelector('input[name="longitude"]');

    const draggableMarker = L.marker([-6.1754, 106.8272], { // Marker default Jakarta
        draggable: true,
    }).addTo(map);

    const updateCoordinates = (lat, lng) => {
        latInput.value = lat.toFixed(6); // Tidak perlu koreksi jika format API sudah sesuai
        lngInput.value = lng.toFixed(6);
    };

    if ("geolocation" in navigator) {
        console.log("Geolocation is available. Attempting to get user's current location...");
        try {
            const position = await new Promise((resolve, reject) => {
                const geoOptions = {
                    enableHighAccuracy: true, 
                    timeout: 15000,           
                    maximumAge: 0           
                };
                navigator.geolocation.getCurrentPosition(resolve, reject, geoOptions);
            });

            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            console.log("User's current location:", userLat, userLng);

            map.setView([userLat, userLng], 15); // Zoom lebih dekat ke lokasi pengguna

            // Pindahkan draggable marker ke lokasi pengguna
            draggableMarker.setLatLng([userLat, userLng]);
            updateCoordinates(userLat, userLng);

            // Tambahkan marker khusus untuk menunjukkan lokasi pengguna
            userMarker = L.circleMarker([userLat, userLng], {
                radius: 8,
                color: 'blue',
                fillColor: '#30f',
                fillOpacity: 0.8
            }).addTo(map)
              .bindPopup('Lokasi Anda')
              .openPopup();

        } catch (error) {
            console.error("Error getting user's current location:", error);
            if (error.code === error.PERMISSION_DENIED) {
                alert("Izin lokasi ditolak. Peta akan menampilkan lokasi default.");
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                alert("Informasi lokasi tidak tersedia. Peta akan menampilkan lokasi default.");
            } else if (error.code === error.TIMEOUT) {
                alert("Waktu habis saat mencoba mendapatkan lokasi. Peta akan menampilkan lokasi default.");
            } else {
                alert("Terjadi kesalahan saat mendapatkan lokasi: " + error.message);
            }
            // Jika gagal, peta tetap pada lokasi default Jakarta
        }
    } else {
        console.warn("Geolocation is not supported by this browser.");
        alert("Browser Anda tidak mendukung Geolocation API. Peta akan menampilkan lokasi default.");
    }

    draggableMarker.on("drag", (e) => {
        const { lat, lng } = e.target.getLatLng();
        updateCoordinates(lat, lng);
        // Hapus marker lokasi user jika draggable marker dipindahkan
        if (userMarker) {
            map.removeLayer(userMarker);
            userMarker = null; 
        }
    });

    map.on("click", (e) => {
        draggableMarker.setLatLng(e.latlng);
        updateCoordinates(e.latlng.lat, e.latlng.lng);
        if (userMarker) {
            map.removeLayer(userMarker);
            userMarker = null;
        }
    });

    this.map = map;
    return this;
}

  addFailed(message) {
    alert(message);
  }

  addSuccessfully(message) {
    console.log(message);
    alert("Cerita berhasil dibagikan!");

    setTimeout(() => {
      window.location.hash = "#/home";
    }, 1500);
  }

  showMapLoading() {
    document.getElementById("map-loading-container").innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById("map-loading-container").innerHTML = "";
  }

  showSubmitLoadingButton() {
    document.getElementById("submit-button-container").innerHTML = `
        <button class="btn" type="submit" disabled>
          <i class="fas fa-spinner fa-spin loader-button"></i> Bagikan Cerita
        </button>
      `;
  }

  hideSubmitLoadingButton() {
    document.getElementById("submit-button-container").innerHTML = `
        <button class="btn" type="submit">Bagikan Cerita</button>
      `;
  }
}