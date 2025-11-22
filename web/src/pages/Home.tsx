import { createSignal } from "solid-js";
import Layout from "../components/Layout";
import WebhookForm from "../components/WebhookForm";
import WebhookList from "../components/WebhookList";

function Home() {
  const [refreshKey, setRefreshKey] = createSignal(0);

  const handleWebhookCreated = () => {
    // Trigger refresh of webhook list
    setRefreshKey((k) => k + 1);
  };

  return (
    <Layout>
      <div class="space-y-12">
        {/* Hero Section */}
        <div class="text-center py-12 relative">
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary-500/20 blur-[100px] rounded-full pointer-events-none"></div>
          <h1 class="relative text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Webhook Proxy
            </span>
            <span class="block text-gradient mt-2">Dashboard</span>
          </h1>
          <p class="relative text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Create powerful webhook proxies to forward, transform, and monitor your data streams in real-time with zero latency.
          </p>
        </div>

        {/* Main Content Grid */}
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Create Webhook Form */}
          <div class="lg:col-span-5">
            <div class="sticky top-24">
              <WebhookForm onSuccess={handleWebhookCreated} />
            </div>
          </div>

          {/* Webhook List */}
          <div class="lg:col-span-7">
            <WebhookList refresh={refreshKey()} />
          </div>
        </div>

        {/* Info Cards */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-white/5">
          <div class="glass-card rounded-2xl p-8 group">
            <div class="w-14 h-14 bg-primary-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-500/20 transition-colors border border-primary-500/20">
              <svg class="w-7 h-7 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-slate-200 mb-3">Fast Forwarding</h3>
            <p class="text-slate-400 leading-relaxed">
              Instantly forward webhooks to multiple destinations with minimal latency using our optimized proxy engine.
            </p>
          </div>

          <div class="glass-card rounded-2xl p-8 group">
            <div class="w-14 h-14 bg-secondary-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-secondary-500/20 transition-colors border border-secondary-500/20">
              <svg class="w-7 h-7 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-slate-200 mb-3">Field Mapping</h3>
            <p class="text-slate-400 leading-relaxed">
              Transform JSON payloads with custom field mappings and fixed values to match your destination's schema.
            </p>
          </div>

          <div class="glass-card rounded-2xl p-8 group">
            <div class="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">
              <svg class="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-slate-200 mb-3">Complete Logging</h3>
            <p class="text-slate-400 leading-relaxed">
              Track every single webhook delivery with comprehensive request and response logs for easy debugging.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Home;
