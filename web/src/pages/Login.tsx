import { createSignal, Show, onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { login, checkAuth } from "../lib/auth";
import type { LoginRequest } from "../lib/types";
import { FiLock, FiUser, FiAlertCircle } from "solid-icons/fi";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);

  // Redirect if already authenticated
  onMount(async () => {
    const authStatus = await checkAuth();
    if (authStatus) {
      navigate("/", { replace: true });
    }
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const credentials: LoginRequest = {
        username: username(),
        password: password(),
      };

      const response = await login(credentials);

      // Check if password change is required
      if (response.mustChangePassword) {
        // TODO: Navigate to change password page
        navigate("/", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Invalid username or password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        {/* Logo/Header */}
        <div class="text-center mb-8">
          <img src="/logo.svg" alt="Webhoxy Logo" class="h-16 w-auto mx-auto mb-4" />
          <p class="text-slate-600">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div class="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <form onSubmit={handleSubmit} class="space-y-6">
            {/* Error Message */}
            <Show when={error()}>
              <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                <FiAlertCircle class="w-5 h-5" />
                <span class="text-sm">{error()}</span>
              </div>
            </Show>

            {/* Username Field */}
            <div>
              <label for="username" class="block text-sm font-medium text-slate-700 mb-2">
                Username
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser class="w-5 h-5 text-slate-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  value={username()}
                  onInput={(e) => setUsername(e.currentTarget.value)}
                  class="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                  placeholder="Enter your username"
                  disabled={isLoading()}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label for="password" class="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock class="w-5 h-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password()}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                  class="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                  placeholder="Enter your password"
                  disabled={isLoading()}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading()}
              class="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 px-4 rounded-lg font-medium hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isLoading() ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p class="text-center text-sm text-slate-500 mt-6">
          Webhoxy - Webhook Proxy Service
        </p>
      </div>
    </div>
  );
}

export default Login;

