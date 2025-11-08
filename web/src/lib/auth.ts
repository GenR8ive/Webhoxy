import { createSignal } from "solid-js";
import axios from "axios";
import type { LoginRequest, LoginResponse, User, RefreshTokenRequest, RefreshTokenResponse } from "./types";

const API_BASE_URL = "/api";
const TOKEN_KEY = "webhoxy_access_token";
const REFRESH_TOKEN_KEY = "webhoxy_refresh_token";

// Create axios instance for auth
const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth state
const [isAuthenticated, setIsAuthenticated] = createSignal<boolean>(false);
const [user, setUser] = createSignal<User | null>(null);
const [isLoading, setIsLoading] = createSignal<boolean>(true);

// Initialize auth state from localStorage
(async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    await checkAuth();
  } else {
    setIsLoading(false);
  }
})();

// Check authentication status
export async function checkAuth(): Promise<boolean> {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return false;
    }

    const response = await authApi.get<User>("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setUser(response.data);
    setIsAuthenticated(true);
    setIsLoading(false);
    return true;
  } catch (error) {
    // Token might be expired, try to refresh
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        const refreshed = await refreshAccessToken(refreshToken);
        if (refreshed) {
          return true;
        }
      } catch (e) {
        // Refresh failed, clear auth
      }
    }

    // Clear invalid tokens
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setIsAuthenticated(false);
    setUser(null);
    setIsLoading(false);
    return false;
  }
}

// Login
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await authApi.post<LoginResponse>("/auth/login", credentials);
  const data = response.data;

  // Store tokens
  localStorage.setItem(TOKEN_KEY, data.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);

  // Update state
  setIsAuthenticated(true);
  
  // Get full user info to get createdAt/updatedAt
  try {
    const userResponse = await authApi.get<User>("/auth/me", {
      headers: {
        Authorization: `Bearer ${data.accessToken}`,
      },
    });
    setUser(userResponse.data);
  } catch (err) {
    // If we can't get user info, set basic info
    setUser({
      id: data.user.id,
      username: data.user.username,
      mustChangePassword: data.mustChangePassword,
      createdAt: "",
      updatedAt: "",
    });
  }

  return data;
}

// Logout
export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  
  try {
    if (refreshToken) {
      await authApi.post(
        "/auth/logout",
        { refreshToken },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
          },
        }
      );
    }
  } catch (error) {
    // Ignore logout errors
  }

  // Clear tokens and state
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  setIsAuthenticated(false);
  setUser(null);
}

// Refresh access token
async function refreshAccessToken(refreshToken: string): Promise<boolean> {
  try {
    const response = await authApi.post<RefreshTokenResponse>("/auth/refresh", {
      refreshToken,
    } as RefreshTokenRequest);

    localStorage.setItem(TOKEN_KEY, response.data.accessToken);
    
    // Get user info
    await checkAuth();
    return true;
  } catch (error) {
    return false;
  }
}

// Change password
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  await authApi.post(
    "/auth/change-password",
    { currentPassword, newPassword },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  // After password change, refresh tokens are invalidated
  // But the access token is still valid, so we can refresh user info
  // This will update mustChangePassword to false
  await checkAuth();
}

// Get access token
export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Export auth state
export { isAuthenticated, user, isLoading };

