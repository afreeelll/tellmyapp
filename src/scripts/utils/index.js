export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function showFormattedDate(date, locale = "en-US", options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  });
}

export async function createCarousel(containerElement, options = {}) {
  const { tns } = await import("tiny-slider");

  return tns({
    container: containerElement,
    mouseDrag: true,
    swipeAngle: false,
    speed: 600,

    nav: true,
    navPosition: "bottom",

    autoplay: false,
    controls: false,

    ...options,
  });
}

export function convertBlobToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

export function convertBase64ToBlob(
  base64Data,
  contentType = "",
  sliceSize = 512
) {
  if (base64Data.startsWith("data:")) {
    base64Data = base64Data.split(",")[1];
  }

  const byteCharacters = atob(base64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const blob = convertBase64ToBlob(base64String, "image/jpeg");

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}

export function convertBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function transitionHelper({ skipTransition = false, updateDOM }) {
  if (skipTransition || !document.startViewTransition) {
    const updateCallbackDone = Promise.resolve(updateDOM()).then(() => {});
    return {
      ready: Promise.reject(Error("View transitions unsupported")),
      updateCallbackDone,
      finished: updateCallbackDone,
    };
  }
  return document.startViewTransition(updateDOM);
}

export function isServiceWorkerAvailable() {
  return 'serviceWorker' in navigator;
}

export async function registerServiceWorker() {
  if (!isServiceWorkerAvailable()) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.bundle.js');
      console.log('Service Worker registered successfully:', registration.scope);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}