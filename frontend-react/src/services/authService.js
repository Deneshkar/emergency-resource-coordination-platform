import { apiGet, apiPost, setStoredAuth, clearStoredAuth } from "./api";

export const authService = {
  async login(email, password) {
    const data = await apiPost("/auth/login", { email, password });
    if (data && data.token) {
      setStoredAuth(data.token, data.user);
    }
    return data;
  },

  async register(userData) {
    const data = await apiPost("/auth/register", userData);
    if (data && data.token) {
      setStoredAuth(data.token, data.user);
    }
    return data;
  },

  async googleLogin(googleData) {
    const data = await apiPost("/auth/google", googleData);
    if (data && data.token) {
      setStoredAuth(data.token, data.user);
    }
    return data;
  },

  async githubLogin(code, redirectUri) {
    const data = await apiPost("/auth/github", { code, redirectUri });
    if (data && data.token) {
      setStoredAuth(data.token, data.user);
    }
    return data;
  },

  async getProfile() {
    return apiGet("/auth/me");
  },

  async getDemoUsers() {
    return apiGet("/auth/demo-users");
  },

  logout() {
    clearStoredAuth();
  },
};
