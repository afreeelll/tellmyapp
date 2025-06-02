import "../styles/styles.css";
import "../styles/responsives.css";
import "tiny-slider/dist/tiny-slider.css";

import App from "./pages/app";
import { registerServiceWorker } from "./utils";

document.addEventListener("DOMContentLoaded", async () => {
  const app = new App({
    content: document.querySelector("#content"),
    drawerButton: document.querySelector("#drawer-button"),
    drawerNavigation: document.querySelector("#drawer-navigation"),
  });

  registerServiceWorker();

  console.log('Berhasil mendaftarkan service worker.');

  app.initApp();
});
 