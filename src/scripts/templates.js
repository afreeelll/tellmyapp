import { showFormattedDate } from "./utils";

export function generateLoaderTemplate() {
  return `
        <div class="loader"></div>
        `;
}

export function generateLoaderAbsoluteTemplate() {
  return `
        <div class="loader loader-absolute"></div>
        `;
}

export function generateMainNavigationListTemplate() {
  return `
      <li><a id="story-list-button" class="story-list-button" href="#/home">Daftar Cerita</a></li>
      <li><a id="bookmark-button" class="bookmark-button" href="#/bookmark">Cerita Tersimpan</a></li>
    `;
}

export function generateUnauthenticatedNavigationListTemplate() {
  return `
      <li id="push-notification-tools" class="push-notification-tools"></li>
      <li><a id="login-button" href="#/login">Login</a></li>
      <li><a id="register-button" href="#/register">Register</a></li>
    `;
}

export function generateAuthenticatedNavigationListTemplate() {
  return `
    <li id="push-notification-tools" class="push-notification-tools">
      <button id="subscribe-button" class="btn subscribe-button">
      Subscribe
      <i class="fas fa-bell"></i>
      </button>
    </li>
    <li>
      <a id="new-story-button" class="btn new-story-button" href="#/new">
        Buat Cerita <i class="fas fa-plus"></i>
      </a>
    </li>
    <li>
      <a id="logout-button" class="logout-button" href="#/logout">
        <i class="fas fa-sign-out-alt"></i> Logout
      </a>
    </li>
  `;
}

export function generateStoriesListEmptyTemplate() {
  return `
        <div id="stories-list-empty" class="stories-list__empty">
            <h2>Belum ada cerita tersimpan</h2>
        </div>
        `;
}

export function generateStoriesListErrorTemplate(message) {
  return `
        <div id="stories-list-error" class="stories-list__error">
            <h2>Gagal memuat cerita</h2>
            <p>${message ? message : "Coba cek koneksi internetmu dan muat ulang halaman. "}</p>
        </div>
        `;
}

export function generateStoryDetailErrorTemplate(message) {
  return `
        <div id="stories-detail-error" class="stories-detail__error">
            <h2>Gagal menampilkan detail cerita</h2>
            <p>${message ? message : "Coba beberapa saat lagi atau laporkan masalah ini. "}</p>
        </div>
        `;
}

export function generateCommentsListEmptyTemplate() {
  return `
      <div id="comment-list-empty" class="comment-list__empty">
        <h2>Belum ada balasan yang tersedia</h2>
        <p>Jadilah yang pertama memberikan tanggapan untuk cerita ini!</p>
      </div>
    `;
}

export function generateStoryItemTemplate({
  id,
  description,
  evidenceImages,
  authorName,
  createdAt,
  location,
  isBookmarked,
  isBookmarkPage = false,
}) {
  const safeImage =
    Array.isArray(evidenceImages) && evidenceImages.length > 0
      ? evidenceImages[0]
      : "/images/fallback.jpg.png";

  const safeLocation =
    location && Object.values(location).length > 0
      ? Object.values(location).join(", ")
      : "Lokasi tidak tersedia";

  return `
        <div tabindex="0" class="story-item" data-storyid="${id}">
    <div class="story-item__image-wrapper">
    <img class="story-item__image" src="${safeImage}" alt="Gambar cerita" />
      <button class="bookmark-btn ${isBookmarked ? "bookmarked" : ""}" 
        data-id="${id}" 
        aria-label="${isBookmarked ? "Hapus bookmark" : "Simpan bookmark"}">
        <i class="fas ${isBookmarked ? "fa-bookmark" : "fa-bookmark-o"}"></i>
      </button>
    </div>
          
          <div class="story-item__body">
                <div class="story-item__main">
                    <div class="story-item__more-info">
                        <div class="story-item__createdat">
                            <i class="fas fa-calendar-alt"></i> ${showFormattedDate(createdAt, "id-ID")}
                        </div>
                        <div class="story-item__location">
                            <i class="fas fa-map"></i> ${safeLocation}
                        </div>
                    </div>
                </div>
                <div id="story-description" class="story-item__description">
                    ${description}
                </div>
                <div class="story-item__more-info">
                    <div class="story-item__author">
                        Ditulis oleh: ${authorName}
                    </div>
                </div>
                <a class="btn story-item__read-more" href="#/detail/${id}">
                    Selengkapnya <i class="fas fa-arrow-right"></i>
                </a>
                
                ${
                  isBookmarkPage
                    ? `
          <button class="btn story-item__delete-bookmark" data-id="${id}" style="margin-left: 10px; background-color: #f05392; color: white;">
            Hapus Cerita <i class="fas fa-trash-alt"></i>
          </button>
          `
                    : ""
                }

            </div>
        </div>
    `;
}

export function generateStoryDetailImageTemplate(imageUrl = null, alt = "") {
  if (!imageUrl) {
    return `
      <img class="story-detail__image" src="images/placeholder-image.jpg" alt="Placeholder Image">
    `;
  }

  return `
    <img class="story-detail__image" src="${imageUrl}" alt="${alt}">
  `;
}

export function generateStoryCommentItemTemplate({
  photoUrlCommenter,
  nameCommenter,
  body,
}) {
  return `
        <article tabindex="0" class="story-detail__comment-item">
            <img
                class="story-detail__comment-item__photo"
                src="${photoUrlCommenter}"
                alt="Commenter name: ${nameCommenter}"
            >
            <div class="story-detail__comment-item__body">
                <div class="sroty-detail__comment-item__body__more-info">
                    <div class="story-detail__comment-item__body__author">${nameCommenter}</div>
            </div>
        <article>
    `;
}

export function generateStoryDetailTemplate({
  description,
  evidenceImages,
  latitudeLocation,
  longitudeLocation,
  authorName,
  createdAt,
}) {
  const createdAtFormatted = showFormattedDate(createdAt, "id-ID");
  const imagesHtml = evidenceImages
    .map((img) => generateStoryDetailImageTemplate(img))
    .join("");

  return `
    <div class="story-detail__container">
    <div id="story-detail" class="story-detail">
      <div class="story-detail__header">

      <div class="container">
        <div class="story-detail__images__container">
        <div class="tns-outer" id="images-ow">
            <div class="tns-liveregion tns-visually-hidden" aria-live="polite" aria-atomic="true">
            "slide "
            <span class="current">3</span>
            " of 2"
        </div>
          <div id="images" class="story-detail__images">${imagesHtml}</div>
        </div>
      </div>
  
        <div class="story-detail__more-info">
          <div class="story-detail__more-info__inline">
            <div id="createdat" class="story-detail__createdat" data-value="${createdAtFormatted}"><i class="fas fa-calendar-alt"></i></div>
          </div>
          <div class="story-detail__more-info__inline">
            <div id="location-latitude" class="story-detail__location__latitude" data-value="${latitudeLocation}">Latitude:</div>
            <div id="location-longitude" class="story-detail__location__longitude" data-value="${longitudeLocation}">Longitude:</div>
          </div>
          <div id="author" class="story-detail__author" data-value="${authorName}">Dibuatkan oleh:</div>
        </div>
      </div>
      
  
      <div class="container">
        <div class="story-detail__body">
          <div class="story-detail__body__description__container">
            <h2 class="story-detail__description__title">Cerita Lengkap</h2>
            <div id="description" class="story-detail__description__body">
              ${description}
            </div>
          </div>
          <div class="story-detail__body__map__container">
  <h2 class="story-detail__map__title">Peta Lokasi</h2>
  <div class="story-detail__map__container">
    <div id="story-map" style="height: 400px;"></div>
    <div id="map-loading-container"></div>
  </div>
</div>
    
          <hr>
    
          <div class="story-detail__body__actions__container">
            <h2>Reaksi</h2>
            <div class="story-detail__actions__buttons">
              <div id="save-actions-container"></div>
            </div>

            <div id="bookmark-actions-container">
              <button id="story-detail-bookmark" class="btn btn-transparent" aria-label="Bookmark cerita ini">
               Bookmark Cerita
              <i class="far fa-bookmark"></i>
              </button>
            </div>


              <div id="notify-me-actions-container">
                <button id="story-detail-notify-me" class="btn btn-transparent">
                  Try Notify Me
                   <i class="far fa-bell"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
}

export function generateSubscribeButtonTemplate() {
  return `
        <button id="subscribe-button" class="btn subscribe-button">
            Subscribe <i class="fas fa-bell"></i>
        </button>
    `;
}

export function generateUnsubscribeButtonTemplate() {
  return `
      <button id="unsubscribe-button" class="btn unsubscribe-button">
        Unsubscribe <i class="fas fa-bell-slash"></i>
      </button>
    `;
}

export function generateStoryButtonTemplate() {
  return `
        <button id="story-detail-save" class="btn btn-transparent">
            Simpan Cerita <i class="far fa-bookmark"></i>
        </button>
    `;
}

export function generateRemoveStoryButtonTemplate() {
  return `
        <button id="save-action-container" class="btn btn-transparent">
            Buang dari catatan tersimpan <i class="fas fa-bookmark"></i>
        </button>
    `;
}
