import { getActiveRoute } from "../routes/url-parser";
import { ACCESS_TOKEN_KEY } from "../config";

export function getAccessToken() {
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (accessToken === "null" || accessToken === "undefined") {
      return null;
    }

    return accessToken;
  } catch (error) {
    console.error("getAccessToken: error", error);
    return null;
  }
}

export function putAccessToken(token) {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error("putAccessToken: error", error);
    return false;
  }
}

export function removeAccessToken() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    return true;
  } catch (error) {
    console.error("getLogout: error", error);
    return false;
  }
}

const unauthenticatedRoutesOnly = ["#/login", "#/register"];

export function checkUnauthenticatedRouteOnly(pageFunction) {
  const url = getActiveRoute();
  const isLogin = !!getAccessToken();

  if (unauthenticatedRoutesOnly.includes(url) && isLogin) {
    location.hash = "#/home";
    return new HomePage();
  }

  return pageFunction(); 
}

export function checkAuthenticatedRoute(pageFunction) {
  const token = !!getAccessToken();

  if (!token) {
    location.hash = "#/login";
    return new LoginPage(); // return fallback LoginPage kalau belum login
  }

  return pageFunction();
}

export function getLogout() {
  removeAccessToken();
}

export default function setupSkipToContent(buttonElement, targetElement) {
  if (!buttonElement || !targetElement) return;

  buttonElement.addEventListener("click", () => {
    targetElement.setAttribute("tabindex", "-1");
    targetElement.focus();
    window.scrollTo({
      top: targetElement.offsetTop,
      behavior: "smooth",
    });
  });
}
