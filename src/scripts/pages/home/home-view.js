import {
  generateStoriesListErrorTemplate,
  generateStoriesListEmptyTemplate,
  generateStoryItemTemplate,
} from "../../templates";

export default class HomeView {
  populateStoriesListError(message) {
    const container = document.getElementById("stories-list-container");
    if (container) {
      container.innerHTML = generateStoriesListErrorTemplate(message);
    } else {
      console.error("Container untuk daftar cerita tidak ditemukan.");
    }
  }

  populateStoriesList(_, stories) {
  const container = document.getElementById("stories-list-container");
  if (container) {
    const storiesHtml = stories
      .map((storyRaw) => {
        const story = {
          id: storyRaw.id,
          description: storyRaw.description || "",
          evidenceImages: [storyRaw.photoUrl || ""],
          authorName: storyRaw.name || "Anonim",
          createdAt: storyRaw.createdAt,
          location: {
            lat: storyRaw.lat || "",
            lon: storyRaw.lon || "",
          },
        };
        return generateStoryItemTemplate(story);
      })
      .join("");

    container.innerHTML = storiesHtml;
  }
}


  populateStoriesListEmpty() {
    const container = document.getElementById("stories-list-container");
    if (container) {
      container.innerHTML = generateStoriesListEmptyTemplate();
    } else {
      console.error("Container untuk daftar cerita tidak ditemukan.");
    }
  }
}
