import { apiService } from "./apiService";
import { storageService } from "./storageService";

export const authService = {
  async login(email, password) {
    const cleanEmail = apiService.sanitize(email);
    const cleanPass = apiService.sanitize(password);
    if (!cleanEmail || !cleanPass) throw new Error("Invalid credentials");
    if (!apiService.validateEmail(cleanEmail)) throw new Error("Invalid email format");

    const response = await apiService.post('/auth/login', { email: cleanEmail, password: cleanPass });
    
    if (!response.success) {
      throw new Error(response.message || 'Login failed');
    }
    
    storageService.set("auth_token", response.token);
    storageService.set("auth_user", response.user);
    return { success: true, token: response.token, user: response.user };
  },

  async logout() {
    try {
      await apiService.post('/auth/logout');
    } catch (err) {
      // Ignore logout errors
    }
    storageService.remove("auth_token");
    storageService.remove("auth_user");
  },

  getToken() {
    return storageService.get("auth_token");
  },

  getUser() {
    return storageService.get("auth_user");
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};
