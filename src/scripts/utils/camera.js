export default class Camera {
  #videoElement;
  #selectCameraElement;
  #currentStream;

  constructor({ video, cameraSelect }) {
    this.#videoElement = video;
    this.#selectCameraElement = cameraSelect;

    this.#initialListener();
  }

  #initialListener() {
    if (this.#selectCameraElement) {
      this.#selectCameraElement.onchange = async () => {
        this.stop();
        await this.launch();
      };
    }
  }

  async getDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === "videoinput");
  }

  async #getStream() {
    const selectedDeviceId = this.#selectCameraElement?.value;

    const constraints = {
      video: selectedDeviceId
        ? { deviceId: { exact: selectedDeviceId }, aspectRatio: 4 / 3 }
        : { aspectRatio: 4 / 3 },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error) {
      console.error("getUserMedia error:", error);
      return null;
    }
  }

  async launch() {
    const stream = await this.#getStream();

    if (!stream) {
      throw new Error("Stream kamera tidak tersedia.");
    }

    this.#currentStream = stream;
    this.#videoElement.srcObject = stream;

    // Tunggu video metadata dimuat (termasuk dimensi)
    await new Promise((resolve) => {
      this.#videoElement.onloadedmetadata = () => {
        resolve();
      };
    });

    // Baru play video
    try {
      await this.#videoElement.play();
      console.log("Kamera berhasil dijalankan.");
      console.log(
        "Video dimensions:",
        this.#videoElement.videoWidth,
        this.#videoElement.videoHeight
      );
    } catch (err) {
      console.error("Gagal menjalankan video.play():", err);
    }

    await this.#populateDeviceList(stream);
  }

  async #populateDeviceList(stream) {
    if (!this.#selectCameraElement) return;

    try {
      const devices = await this.getDevices();
      const activeDeviceId = stream
        ?.getVideoTracks()[0]
        ?.getSettings()?.deviceId;

      this.#selectCameraElement.innerHTML = devices
        .map((device, i) => {
          const isSelected = device.deviceId === activeDeviceId;
          return `<option value="${device.deviceId}" ${isSelected ? "selected" : ""}>
                    ${device.label || `Kamera ${i + 1}`}
                  </option>`;
        })
        .join("");
    } catch (e) {
      console.error("Gagal mengisi daftar kamera:", e);
    }
  }

  stop() {
    if (this.#videoElement) {
      this.#videoElement.pause();
      this.#videoElement.srcObject = null;
    }

    if (this.#currentStream) {
      this.#currentStream.getTracks().forEach((track) => track.stop());
      this.#currentStream = null;
    }
  }

  async changeCamera(deviceId) {
    if (this.#selectCameraElement) {
      this.#selectCameraElement.value = deviceId;
    }
    this.stop();
    await this.launch();
  }

  async takePicture() {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = this.#videoElement.videoWidth;
      canvas.height = this.#videoElement.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(this.#videoElement, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Gagal mengambil gambar"));
      }, "image/jpeg");
    });
  }
}
