import { getActiveRoute } from '../routes/url-parser';
import {
  generateAuthenticatedNavigationListTemplate,
  generateMainNavigationListTemplate,
  generateSubscribeButtonTemplate,
  generateUnauthenticatedNavigationListTemplate,
  generateUnsubscribeButtonTemplate,
} from '../templates';
import { transitionHelper, isServiceWorkerAvailable } from '../utils';
import { getAccessToken, getLogout } from '../utils/auth';
import { routes } from '../routes/routes';
import {
  isCurrentPushSubscriptionAvailable,
  subscribe,
  unsubscribe,
} from '../utils/notification-helper';
import Database from '../database';

export default class App {
  #content;
  #drawerButton;
  #drawerNavigation;
  #bookmarkService;
  #activePage;

  constructor({ content, drawerButton, drawerNavigation, bookmarkService }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#drawerNavigation = drawerNavigation;
    this.#bookmarkService = bookmarkService;
  }

  async initApp() {
    this.#setupDrawer();
    this.#setupGlobalEventHandlers();
    await this.#listenToHashChangeAndRenderPage();
    this.#setupNavigationList();
  }

  #setupDrawer() {
    if (!this.#drawerNavigation || !this.#drawerButton) {
      console.error(
        'drawerNavigation atau drawerButton tidak ditemukan di DOM!'
      );
      return;
    }

    this.#drawerButton.addEventListener('click', () => {
      this.#drawerNavigation.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      const isTargetInsideDrawer = this.#drawerNavigation.contains(
        event.target
      );
      const isTargetInsideButton = this.#drawerButton.contains(event.target);

      if (!(isTargetInsideDrawer || isTargetInsideButton)) {
        this.#drawerNavigation.classList.remove('open');
      }

      this.#drawerNavigation.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#drawerNavigation.classList.remove('open');
        }
      });
    });
  }

  #setupNavigationList() {
    const isLogin = !!getAccessToken();
    const navListMain =
      this.#drawerNavigation.children.namedItem('navlist-main');
    const navList = this.#drawerNavigation.children.namedItem('navlist');

    if (!isLogin) {
      navListMain.innerHTML = '';
      navList.innerHTML = generateUnauthenticatedNavigationListTemplate();
      return;
    }

    navListMain.innerHTML = generateMainNavigationListTemplate();
    navList.innerHTML = generateAuthenticatedNavigationListTemplate();

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', (event) => {
        event.preventDefault();

        if (confirm('Apakah Anda yakin ingin keluar?')) {
          getLogout();

          // Redirect
          location.hash = '#/login';
        }
      });
    }
  }

  async #setupPushNotification() {
    const pushNotificationTools = document.getElementById(
      'push-notification-tools'
    );
    const isSubscribed = await isCurrentPushSubscriptionAvailable();

    if (isSubscribed) {
      pushNotificationTools.innerHTML = generateUnsubscribeButtonTemplate();
      document
        .getElementById('unsubscribe-button')
        .addEventListener('click', () => {
          unsubscribe().finally(() => {
            this.#setupPushNotification();
          });
        });
      return;
    }

    pushNotificationTools.innerHTML = generateSubscribeButtonTemplate();
    document
      .getElementById('subscribe-button')
      .addEventListener('click', () => {
        subscribe().finally(() => {
          this.#setupPushNotification();
        });
      });
  }

  async #listenToHashChangeAndRenderPage() {
    window.addEventListener('hashchange', async () => {
      await this.#renderPageByHash();
    });
    await this.#renderPageByHash();
  }

  #setupGlobalEventHandlers() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.bookmark-btn');
      if (!btn) return;
      try {
        const storyId = btn.dataset.id;
        if (!storyId) return;

        const isBookmarked = this.#bookmarkService.isBookmarked(storyId);

        if (isBookmarked) {
          this.#bookmarkService.removeBookmark(storyId);
          btn.classList.remove('bookmarked');
          btn.innerHTML = '<i class="fas fa-bookmark-o"></i>';
        } else {
          this.#bookmarkService.saveBookmark(storyId);
          btn.classList.add('bookmarked');
          btn.innerHTML = '<i class="fas fa-bookmark"></i>';
        }
      } catch (error) {
        console.error('Bookmark error:', error);
      }
    });

    window.addEventListener('storage', (e) => {
      if (e.key === 'user_bookmarks') {
        if (window.location.hash.includes('#/bookmark')) {
          this.#renderPageByHash();
        }
      }
    });

    const skipLink = document.getElementById('skip-link');
    if (skipLink) {
      skipLink.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Skip-link diklik. Memindahkan fokus ke konten utama.');
        this.#content.focus();
        history.replaceState(null, null, ' ');
      });
    }
  }

  async #renderPageByHash() {
    const currentHash = window.location.hash;
    if (currentHash === '#content') {
      return;
    }

    const url = getActiveRoute();
    console.log('Active route:', url);

    let route = routes[url];

    // Penanganan rute detail dengan ID
    if (!route && url.startsWith('/detail/')) {
      const id = url.split('/detail/')[1];
      route = () => routes['/detail/:id'](id);
    }

    // Penanganan jika rute tidak ditemukan (fallback)
    if (!route) {
      console.error('Route not found:', url, 'Redirecting to default route.');
      window.location.hash = '/';
      return;
    }

    // Render halaman yang ditemukan
    if (this.#activePage && typeof this.#activePage.destroy === 'function') {
      this.#activePage.destroy();
    }

    const page = await route();
    const transition = transitionHelper({
      updateDOM: async () => {
        this.#content.innerHTML = await page.render();
        console.log('[DEBUG] Page render selesai');
        await page.afterRender();
        console.log('[DEBUG] Page afterRender selesai');

        Database.getAllSavedStories()
          .then((stories) =>
            console.log(
              'IndexedDB initialized',
              stories.length + ' stories found'
            )
          )
          .catch((err) => console.error('IndexedDB error:', err));

        this.#activePage = page;
      },
    });

    transition.ready.catch(console.error);
    transition.updateCallbackDone.then(() => {
      scrollTo({ top: 0, behavior: 'instant' });
      this.#setupNavigationList();

      if (isServiceWorkerAvailable()) {
        this.#setupPushNotification();
      }
    });
  }
}
