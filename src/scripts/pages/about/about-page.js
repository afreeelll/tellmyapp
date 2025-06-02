export default class AboutPage {
  async render() { 
    return `
      <section class="about-page"> 
      <div class="about-image">     
        <div class="about-text">
        <h1 class="section-title">Tentang Tellmy App</h1>
        <p>
          <strong>Tellmy App</strong> adalah platform berbagi cerita yang memungkinkan kamu menyampaikan pengalaman,
          perasaan, atau kisah inspiratifmu kepada publik. Aku sendiri percaya bahwa tidak semua orang memiliki keberanian dan kepercayan
          untuk menceritakan kisahnya kepada orang lain. Maka dari itu aku membangu platform ini agar kamu yang memiliki masalah
          kepercayaan bisa merasa aman saat bercerita di sini. Karena kami akan menjaga rahasia sampai kapanpun.
        </p>
        
        <br />
        <p> 
          Kenapa platform ini dinamakan Tellmy App? Tell artinya beritahu, my diambil dari me sebenarnya yang artinya aku, hanya aku ingin
          membuatnya lebih menarik. Jadi beritahu aku tentang cerita, pengalaman, atau apapun jika kamu butuh teman untuk bercerita.
        </p>
        <br />
        
        <p>
          Aplikasi ini dibuat sebagai bagian dari proyek awal Dicoding, dan dikembangkan oleh <strong>Afriliza (FC-09)</strong>.
        </p>
        <br />
        <p>
          Dilengkapi dengan fitur peta, bookmark, dan sistem otentikasi, Tellmy App dirancang agar mudah digunakan dan aman.
        </p>
        </div>
        <img src="./images/icon-tellmyapp.png" alt="Tellmy App Icon" class="about-image-img">
        </div>
        <br />
        
      </section>
    `;
  }

  async afterRender() {}
}
