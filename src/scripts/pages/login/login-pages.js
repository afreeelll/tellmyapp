import LoginPresenter from "./login-presenter";
import * as TellmyAPI from "../../data/api";
import * as AuthModel from "../../../scripts/utils/auth";

export default class LoginPage {
  #presenter = null;

  async render() {
    return `
            <section class="login-container"> 
                <article class="login-form-container">
                    <h1 class="login__title">Masuk Akun</h1>
                    
                    <form id="login-form" class="login-form">
                        <div class="form-control">
                            <label for="email-input" class="login-form__email-title">Email</label>
                            
                            <div class="login-form__title-container">
                                <input id="email-input" type="email" name="email" placeholder="nama@gmail.com">
                            </div>
                        </div>
                        <div class="form-control">
                            <label for="password-input" class="login-form__password-title">Password</label>

                            <div class="login-form__title-container">
                                <input id="password-input" type="password" name="password" placeholder="Masukkan password Anda">
                            </div>
                        </div>
                        <div class="form-buttons login-form__form-buttons">
                            <div id="submit-button-container">
                                <button class="btn" type="submit">Masuk</button>
                            </div>
                            <p class="login-form__do-not-have-account">Belum punya akun? <a href="#/register">Daftar</a></p>
                        </div>
                    </form>
                </article>
            </section>
        `;
  }

  async afterRender() {
    this.#presenter = new LoginPresenter({
      view: this,
      model: TellmyAPI,
      authModel: AuthModel,
    });

    this.#setupForm();
  }

  #setupForm() {
    document
      .getElementById("login-form")
      .addEventListener("submit", async (event) => {
        event.preventDefault();

        const data = {
          email: document.getElementById("email-input").value,
          password: document.getElementById("password-input").value,
        };
        await this.#presenter.getLogin(data);
      });
  }

  loginSuccessfully(message) {
    console.log(message);

    // Redirect
    location.hash = "#/home";
  }

  loginFailed(message) {
    alert(message);
  }

  showSubmitLoadingButton() {
    document.getElementById("submit-button-container").innerHTML = `
          <button class="btn" type="submit" disabled>
            <i class="fas fa-spinner fa-spin loader-button"></i> Masuk
          </button>
        `;
  }

  hideSubmitLoadingButton() {
    document.getElementById("submit-button-container").innerHTML = `
          <button class="btn" type="submit">Masuk</button>
        `;
  }
}
