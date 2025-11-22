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
    <div class="min-h-screen bg-[var(--color-dark-bg)] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/20 via-dark-bg to-dark-bg pointer-events-none"></div>
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none" style="animation-delay: 1s"></div>

      <div class="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <div class="text-center mb-8">
          <div class="relative inline-block group mb-4">
            <div class="absolute -inset-1 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl blur opacity-25"></div>
              <img src="/logo.svg" alt="Webhoxy Logo" class="h-12 w-auto" />
          </div>
          <h2 class="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p class="text-slate-400">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div class="glass-card rounded-2xl p-8">
          <form onSubmit={handleSubmit} class="space-y-6">
            {/* Error Message */}
            <Show when={error()}>
              <div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center space-x-2">
                <FiAlertCircle class="w-5 h-5" />
                <span class="text-sm">{error()}</span>
              </div>
            </Show>

            {/* Username Field */}
            <div>
              <label for="username" class="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser class="w-5 h-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  value={username()}
                  onInput={(e) => setUsername(e.currentTarget.value)}
                  class="block w-full pl-10 pr-3 py-3 rounded-lg outline-none input-premium placeholder:text-slate-600"
                  placeholder="Enter your username"
                  disabled={isLoading()}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label for="password" class="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock class="w-5 h-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password()}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                  class="block w-full pl-10 pr-3 py-3 rounded-lg outline-none input-premium placeholder:text-slate-600"
                  placeholder="Enter your password"
                  disabled={isLoading()}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading()}
              class="w-full btn-primary text-white py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading() ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p class="text-center text-sm text-slate-500 mt-8">
          Webhoxy - Webhook Proxy Service
        </p>
      </div>
    </div>
  );
}

export default Login;

