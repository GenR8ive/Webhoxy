import { A, useNavigate } from "@solidjs/router";
import { children, type JSX, Show } from "solid-js";
import { FiHome, FiActivity, FiLogOut, FiUser } from "solid-icons/fi";
import { user, logout, checkAuth } from "../lib/auth";
import ChangePasswordModal from "./ChangePasswordModal";

interface LayoutProps {
  children: JSX.Element;
}

function Layout(props: LayoutProps) {
  const c = children(() => props.children);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header class="bg-white border-b border-slate-200 shadow-sm">
        <div class="container mx-auto px-4 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <img src="/logo.svg" alt="Webhoxy Logo" class="h-10 w-auto" />
            </div>

            <div class="flex items-center space-x-4">
              <nav class="flex space-x-1">
                <A
                  href="/"
                  class="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                  activeClass="bg-primary-50 text-primary-600 font-medium"
                  end
                >
                  <FiHome class="w-4 h-4" />
                  <span>Dashboard</span>
                </A>
                <A
                  href="/logs"
                  class="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                  activeClass="bg-primary-50 text-primary-600 font-medium"
                >
                  <FiActivity class="w-4 h-4" />
                  <span>Logs</span>
                </A>
              </nav>

              {/* User Menu */}
              <Show when={user()}>
                <div class="flex items-center space-x-3 pl-4 border-l border-slate-200">
                  <div class="flex items-center space-x-2 text-slate-600">
                    <FiUser class="w-4 h-4" />
                    <span class="text-sm font-medium">{user()?.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    class="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                    title="Logout"
                  >
                    <FiLogOut class="w-4 h-4" />
                    <span class="text-sm">Logout</span>
                  </button>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main class="container mx-auto px-4 py-8">{c()}</main>

      {/* Change Password Modal */}
      <Show when={user()?.mustChangePassword}>
        <ChangePasswordModal
          onSuccess={async () => {
            // Refresh user data after password change
            await checkAuth();
          }}
        />
      </Show>

      {/* Footer */}
      <footer class="bg-white border-t border-slate-200 mt-16">
        <div class="container mx-auto px-4 py-6 text-center text-slate-600 text-sm">
          <p>
            Webhoxy - Open Source Webhook Proxy{" "}
            <span class="text-slate-400">•  </span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;


