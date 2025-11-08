import { createSignal, createResource } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import Layout from "../components/Layout";
import LogViewer from "../components/LogViewer";
import { webhookApi } from "../lib/api";

function Logs() {
  const [searchParams] = useSearchParams();
  const [selectedWebhookId, setSelectedWebhookId] = createSignal<number | undefined>(
    searchParams.webhook ? parseInt(searchParams.webhook) : undefined
  );

  const [webhooksData] = createResource(() => webhookApi.list(1, 100)); // Get up to 100 webhooks for the dropdown
  const webhooks = () => webhooksData()?.webhooks || [];

  return (
    <Layout>
      <div class="space-y-6">
        {/* Page Header */}
        <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <h1 class="text-3xl font-bold text-slate-800 mb-2">Webhook Logs</h1>
          <p class="text-slate-600">
            Monitor and debug your webhook deliveries
          </p>

          {/* Webhook Filter */}
          <div class="mt-6">
            <label class="block text-sm font-medium text-slate-700 mb-2">
              Filter by Webhook
            </label>
            <select
              value={selectedWebhookId() || ""}
              onChange={(e) => {
                const value = e.currentTarget.value;
                setSelectedWebhookId(value ? parseInt(value) : undefined);
              }}
              class="w-full md:w-96 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">All Webhooks</option>
              {webhooks()?.map((webhook) => (
                <option value={webhook.id}>{webhook.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Log Viewer */}
        <LogViewer webhookId={selectedWebhookId()} />
      </div>
    </Layout>
  );
}

export default Logs;


