import { A } from "@solidjs/router";
import { children, type JSX } from "solid-js";
import { FiHome, FiZap, FiActivity } from "solid-icons/fi";

interface LayoutProps {
  children: JSX.Element;
}

function Layout(props: LayoutProps) {
  const c = children(() => props.children);

  return (
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header class="bg-white border-b border-slate-200 shadow-sm">
        <div class="container mx-auto px-4 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FiZap class="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Webhoxy
                </h1>
                <p class="text-xs text-slate-500">Webhook Proxy Service</p>
              </div>
            </div>

            <nav class="flex space-x-1">
              <A
                href="/"
                class="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                activeClass="bg-blue-50 text-blue-600 font-medium"
                end
              >
                <FiHome class="w-4 h-4" />
                <span>Dashboard</span>
              </A>
              <A
                href="/logs"
                class="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                activeClass="bg-blue-50 text-blue-600 font-medium"
              >
                <FiActivity class="w-4 h-4" />
                <span>Logs</span>
              </A>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main class="container mx-auto px-4 py-8">{c()}</main>

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


