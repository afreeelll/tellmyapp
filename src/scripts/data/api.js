import { getAccessToken } from "../utils/auth";

const ENDPOINTS = {
  // Auth
  REGISTER: `https://story-api.dicoding.dev/v1/register`,
  LOGIN: `https://story-api.dicoding.dev/v1/login`,

  // Story
  ADD_NEW_STORY: `https://story-api.dicoding.dev/v1/stories`,
  ADD_NEW_STORY_GUEST: `https://story-api.dicoding.dev/v1/stories/guest`,
  GET_ALL_STORIES: `https://story-api.dicoding.dev/v1/stories`,
  DETAIL_STORY: `https://story-api.dicoding.dev/v1/stories/:id`,

  // Notifications subscribe
  SUBSCRIBE: `https://story-api.dicoding.dev/v1/notifications/subscribe`,
  UNSUBSCRIBE: `https://story-api.dicoding.dev/v1/notifications/subscribe`,
};

export async function getRegistered({ name, email, password }) {
  const data = JSON.stringify({ name, email, password });

  const fetchResponse = await fetch(ENDPOINTS.REGISTER, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: data,
  });

  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function getLogin({ email, password }) {
  const data = JSON.stringify({ email, password });

  const fetchResponse = await fetch(ENDPOINTS.LOGIN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: data,
  });

  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function addNewStory({
  description,
  evidenceImages,
  latitude,
  longitude,
}) {
  try {
    const accessToken = getAccessToken();

    const formData = new FormData();
    formData.append("description", description);

    if (latitude) formData.append("lat", latitude.toString());
    if (longitude) formData.append("lon", longitude.toString());

    if (evidenceImages && evidenceImages.length > 0) {
      formData.append("photo", evidenceImages[0]);
    }

    const response = await fetch(ENDPOINTS.ADD_NEW_STORY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to post story");
    }

    return await response.json();
  } catch (error) {
    console.error("addNewStory error:", error);
    throw error;
  }
}

export async function getAddNewStoryGuest({ description, photo, lat, lon }) {
  const formData = new FormData();
  formData.set("description", description);
  formData.append("photo", photo);

  if (lat !== undefined) formData.set("lat", lat);
  if (lon !== undefined) formData.set("lon", lon);

  const fetchResponse = await fetch(ENDPOINTS.ADD_NEW_STORY_GUEST, {
    method: "POST",
    body: formData,
  });

  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function getAllStories({
  page = 1,
  size = 10,
  location = 0,
} = {}) {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return {
      ok: false,
      message: "Token tidak ditemukan. Harap login kembali.",
    };
  }

  const url = new URL(ENDPOINTS.GET_ALL_STORIES);
  url.searchParams.append("page", page);
  url.searchParams.append("size", size);
  url.searchParams.append("location", location);

  try {
    const fetchResponse = await fetch(url.toString(), {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const json = await fetchResponse.json();

    return {
      ...json,
      ok: fetchResponse.ok,
    };
  } catch (error) {
    console.error("getAllStories error:", error);

    return {
      ok: false,
      message: error.message || "Gagal mengambil cerita.",
    };
  }
}

export async function getDetailStory(id) {
  const accessToken = getAccessToken();
  const url = ENDPOINTS.DETAIL_STORY.replace(":id", id);

  try {
    const fetchResponse = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const json = await fetchResponse.json();

    return {
      ...json,
      ok: fetchResponse.ok,
    };
  } catch (error) {
    console.error("Fetch error:", error);
    return { ok: false };
  }
}



export async function subscribePushNotification({
  endpoint,
  keys: { p256dh, auth },
}) {
  const accessToken = getAccessToken();
  const data = JSON.stringify({
    endpoint,
    keys: { p256dh, auth },
  });

  const fetchResponse = await fetch(ENDPOINTS.SUBSCRIBE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function unsubscribePushNotification({ endpoint }) {
  const accessToken = getAccessToken();
  const data = JSON.stringify({
    endpoint,
  });

  const fetchResponse = await fetch(ENDPOINTS.UNSUBSCRIBE, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: data,
  });

  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}
