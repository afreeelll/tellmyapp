import RegisterPage from '../pages/register/register-page';
import LoginPage from '../pages/login/login-pages';
import HomePage from '../pages/home/home-page';
import BookmarkPage from '../pages/bookmark/bookmark-page';
import NewPage from '../pages/new/new-page';
import AboutPage from '../pages/about/about-page';
import StoryDetailPage from '../pages/story-detail-page';
import StoryDetailPresenter from '../pages/story-detail-presenter';
import StoryDetailModel from '../pages/story-detail-model';
import {
  checkAuthenticatedRoute,
  checkUnauthenticatedRouteOnly,
} from '../utils/auth';

export const routes = {
  '/': () => new AboutPage(),

  '/login': () => checkUnauthenticatedRouteOnly(() => new LoginPage()),
  '/register': () => checkUnauthenticatedRouteOnly(() => new RegisterPage()),

  '/home': () => checkAuthenticatedRoute(() => new HomePage()),
  '/new': () => checkAuthenticatedRoute(() => new NewPage()),
  '/bookmark': () => checkAuthenticatedRoute(() => new BookmarkPage()),

  '/detail/:id': async (id) => {
    const storyDetailPage = new StoryDetailPage();
    const model = new StoryDetailModel();
    const presenter = new StoryDetailPresenter({
      view: storyDetailPage,
      model: model,
    });
    storyDetailPage.setPresenter(presenter);
    storyDetailPage.storyId = id;
    return storyDetailPage;
  },
};
