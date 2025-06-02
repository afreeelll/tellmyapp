import { getDetailStory } from "../data/api";

export default class StoryDetailModel {
  async fetchStoryDetail(storyId) {
    return await getDetailStory(storyId);
  }
}
