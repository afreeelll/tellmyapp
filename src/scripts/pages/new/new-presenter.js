import Database from '../../database';
import { addNewStory } from '../../data/api.js';

export default class NewPresenter {
  #view;
  #model; 
  #camera; 
  #takenDocumentations = []; 

  constructor({ view, model, camera }) {
    this.#view = view;
    this.#model = model;
    this.#camera = camera;
  }

  // Di dalam method handleSubmitStory di NewPresenter
  async handleSubmitStory({ description, latitude, longitude }) {
    try {
      this.#view.showSubmitLoadingButton();

      const storyPayload = {
        description,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
      };

      const evidenceImages = this.#takenDocumentations.map((doc) => doc.blob);

      if (await Database.isOffline()) {
        // Offline: simpan ke IndexedDB dan antrian offline
        const offlineStory = {
          ...storyPayload,
          id: `offline-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        await Database.addToOfflineQueue('POST', offlineStory, '/v1/stories');
        this.#view.addSuccessfully(
          'Cerita disimpan untuk dikirim saat online & bisa dilihat offline'
        );
        return;
      }

      const responseData = await addNewStory({
        description: storyPayload.description,
        evidenceImages,
        latitude: storyPayload.latitude,
        longitude: storyPayload.longitude,
      });

      // ResponseData ini sudah hasil json dari server
      this.#view.addSuccessfully(
        responseData.message || 'Cerita berhasil dikirim'
      );
    } catch (error) {
      console.error('Submit error:', error);
      this.#view.addFailed('Gagal menambahkan cerita: ' + error.message);
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }

  async handleFileInput(files) {
    for (const file of files) {
      await this.#addTakenPicture(file);
    }
    this.populateTakenPictures(); 
  }

  async handleCaptureImage() {
    try {
      const blob = await this.#camera.takePicture(); 
      await this.#addTakenPicture(blob);
      this.populateTakenPictures();
    } catch (error) {
      console.error('Error capturing image:', error);
      this.#view.addFailed('Gagal mengambil gambar: ' + error.message);
    }
  }

  handleDeletePicture(pictureId) {
    this.#removePicture(pictureId);
    this.populateTakenPictures(); 
  }

  async showNewFormMap() {
    this.#view.showMapLoading();
    await this.#view.initialMap(); 
    this.#view.hideMapLoading();
  }

  async startCamera() {
    if (this.#camera) {
      await this.#camera.launch();
      return await this.#camera.getDevices();
    } else {
      throw new Error('Camera not initialized in presenter.');
    }
  }

  stopCamera() {
    if (this.#camera) {
      this.#camera.stop(); 
    }
  }

  async getAvailableCameraDevices() {
    if (this.#camera) {
      return await this.#camera.getDevices();
    }
    return [];
  }

  async handleChangeCamera(deviceId) {
    if (this.#camera) {
      await this.#camera.changeCamera(deviceId); 
    }
  }

  async #addTakenPicture(blob) {
    if (!(blob instanceof Blob) && !(blob instanceof File)) {
      throw new Error(
        'Invalid image (not a Blob or File). Presenter expects Blob/File.'
      );
    }

    const newDocumentation = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      blob: blob,
    };
    this.#takenDocumentations = [
      ...this.#takenDocumentations,
      newDocumentation,
    ];
  }

  #removePicture(id) {
    const initialLength = this.#takenDocumentations.length;
    this.#takenDocumentations = this.#takenDocumentations.filter(
      (picture) => picture.id !== id
    );
    return this.#takenDocumentations.length < initialLength;
  }

  populateTakenPictures() {
    // Beri tahu View untuk merender gambar berdasarkan state yang dikelola Presenter
    this.#view.renderTakenPictures(this.#takenDocumentations);
  }
}
