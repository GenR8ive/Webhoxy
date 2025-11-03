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
      <div class="space-y-8">
        {/* Hero Section */}
        <div class="text-center py-8">
          <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Webhook Proxy Dashboard
          </h1>
          <p class="text-lg text-slate-600 max-w-2xl mx-auto">
            Create webhook proxies to forward, transform, and monitor your webhooks in real-time
          </p>
        </div>

        {/* Main Content Grid */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Webhook Form */}
          <div>
            <WebhookForm onSuccess={handleWebhookCreated} />
          </div>

          {/* Webhook List */}
          <div>
            <WebhookList refresh={refreshKey()} />
          </div>
        </div>

        {/* Info Cards */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-blue-900 mb-2">Fast Forwarding</h3>
            <p class="text-sm text-blue-700">
              Instantly forward webhooks to multiple destinations with minimal latency
            </p>
          </div>

          <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div class="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-purple-900 mb-2">Field Mapping</h3>
            <p class="text-sm text-purple-700">
              Transform JSON payloads with custom field mappings and fixed values
            </p>
          </div>

          <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div class="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-green-900 mb-2">Complete Logging</h3>
            <p class="text-sm text-green-700">
              Track all webhook deliveries with full request and response logs
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Home;
