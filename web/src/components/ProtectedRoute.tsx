import { Show, onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { isAuthenticated, isLoading, checkAuth } from "../lib/auth";
import type { JSX } from "solid-js";

interface ProtectedRouteProps {
  children: JSX.Element;
}

function ProtectedRoute(props: ProtectedRouteProps) {
  const navigate = useNavigate();

  onMount(async () => {
    // Check auth status on mount
    const authStatus = await checkAuth();
    if (!authStatus) {
      navigate("/login", { replace: true });
    }
  });

  return (
    <Show when={!isLoading() && isAuthenticated()} fallback={
      <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div class="text-center">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <p class="text-slate-600">Checking authentication...</p>
        </div>
      </div>
    }>
      {props.children}
    </Show>
  );
}

export default ProtectedRoute;

