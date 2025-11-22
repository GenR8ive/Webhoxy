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
    <div class="min-h-screen bg-[var(--color-dark-bg)] text-slate-200 font-sans selection:bg-primary-500/30 selection:text-primary-200">
      <div class="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/20 via-dark-bg to-dark-bg pointer-events-none z-0"></div>
      
      {/* Header */}
      <header class="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div class="container mx-auto px-4 py-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="relative group">
                <div class="absolute -inset-1 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg blur opacity-25 "></div>
                  <img src="/logo.svg" alt="Webhoxy Logo" class="h-8 w-auto" />
              </div>
            </div>

            <div class="flex items-center space-x-6">
              <nav class="flex items-center space-x-1 bg-white/5 rounded-full p-1 border border-white/5">
                <A
                  href="/"
                  class="flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium"
                  activeClass="bg-primary-600/20 text-primary-300 shadow-[0_0_10px_rgba(192,38,211,0.2)]"
                  inactiveClass="text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  end
                >
                  <FiHome class="w-4 h-4" />
                  <span>Dashboard</span>
                </A>
                <A
                  href="/logs"
                  class="flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium"
                  activeClass="bg-primary-600/20 text-primary-300 shadow-[0_0_10px_rgba(192,38,211,0.2)]"
                  inactiveClass="text-slate-400 hover:text-slate-200 hover:bg-white/5"
                >
                  <FiActivity class="w-4 h-4" />
                  <span>Logs</span>
                </A>
              </nav>

              {/* User Menu */}
              <Show when={user()}>
                <div class="flex items-center space-x-4 pl-6 border-l border-white/10">
                  <div class="flex items-center space-x-2 text-slate-400">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 p-[1px]">
                      <div class="w-full h-full rounded-full bg-dark-surface flex items-center justify-center">
                        <FiUser class="w-4 h-4 text-slate-200" />
                      </div>
                    </div>
                    <span class="text-sm font-medium text-slate-300">{user()?.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    class="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20"
                    title="Logout"
                  >
                    <FiLogOut class="w-4 h-4" />
                  </button>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main class="relative z-10 container mx-auto px-4 pt-24 pb-12 min-h-[calc(100vh-80px)]">
        {c()}
      </main>

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
      <footer class="relative z-10 border-t border-white/5 bg-dark-bg/50 backdrop-blur-sm">
        <div class="container mx-auto px-4 py-8">
          <div class="flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
            <p>
              &copy; {new Date().getFullYear()} Webhoxy. All rights reserved.
            </p>
            <div class="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="#" class="hover:text-primary-400 transition-colors">Documentation</a>
              <a href="#" class="hover:text-primary-400 transition-colors">Support</a>
              <a href="#" class="hover:text-primary-400 transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;


