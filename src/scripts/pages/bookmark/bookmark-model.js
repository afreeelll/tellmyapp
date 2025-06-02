import Database from '../../database';

const BookmarkModel = {
  async getBookmarkedStories() {
    return Database.getAllSavedStories();
  },

  async removeBookmark(id) {
    return Database.deleteSavedStory(id); 
  },

  async saveBookmark(story) {
    return Database.putSavedStory(story);  
  },

  async isBookmarked(id) {
    return Database.isSavedStory(id); 
  },
};

export default BookmarkModel;
