import {
  generateSubscribeButtonTemplate,
  generateUnsubscribeButtonTemplate,
} from "../scripts/templates";

import { subscribe, unsubscribe } from "./utils/notification-helper";

function renderPushButton() {
  const container = document.getElementById("push-notification-tools");
  if (!container) return;

  const isSubscribed = localStorage.getItem("isSubscribed") === "true";

  container.innerHTML = isSubscribed
    ? generateUnsubscribeButtonTemplate()
    : generateSubscribeButtonTemplate();
}

export default function setupPushNotificationButton() {
  const observer = new MutationObserver(() => {
    const container = document.getElementById("push-notification-tools");
    if (container && !container.dataset.ready) {
      container.dataset.ready = "true";
      renderPushButton();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener("click", async (event) => {
    const container = document.getElementById("push-notification-tools");
    if (!container || !container.contains(event.target)) return;

    if (
      event.target.id === "subscribe-button" ||
      event.target.closest("#subscribe-button")
    ) {
      await subscribe();
      localStorage.setItem("isSubscribed", "true");
      renderPushButton();
    }

    if (
      event.target.id === "unsubscribe-button" ||
      event.target.closest("#unsubscribe-button")
    ) {
      await unsubscribe();
      localStorage.setItem("isSubscribed", "false");
      renderPushButton();
      console.log("Unsubscribed!");
    }
  });
}

setupPushNotificationButton();
