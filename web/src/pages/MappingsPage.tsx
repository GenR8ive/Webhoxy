import { useParams, A } from "@solidjs/router";
import { createResource, Show } from "solid-js";
import Layout from "../components/Layout";
import MappingEditor from "../components/MappingEditor";
import { webhookApi } from "../lib/api";
import { FiArrowLeft } from "solid-icons/fi";

function MappingsPage() {
  const params = useParams();
  const webhookId = () => parseInt(params.id);

  const [webhook] = createResource(webhookId, (id) => webhookApi.get(id));

  return (
    <Layout>
      <div class="space-y-6">
        {/* Back Button */}
        <A
          href="/"
          class="inline-flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors"
        >
          <FiArrowLeft class="w-4 h-4" />
          <span>Back to Dashboard</span>
        </A>

        {/* Page Header */}
        <Show
          when={!webhook.loading}
          fallback={
            <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
              <div class="animate-pulse">
                <div class="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
                <div class="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          }
        >
          <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <h1 class="text-3xl font-bold text-slate-800 mb-2">
              Field Mappings
            </h1>
            <p class="text-slate-600">
              Webhook: <span class="font-semibold">{webhook()?.name}</span>
            </p>
            <div class="mt-2 text-sm text-slate-500">
              Target: {webhook()?.target_url}
            </div>
          </div>
        </Show>

        {/* Mapping Editor */}
        <MappingEditor webhookId={webhookId()} />

        {/* Help Section */}
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 class="font-semibold text-blue-900 mb-3">💡 How Field Mapping Works</h3>
          <div class="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Source Field:</strong> The path to extract data from incoming webhooks (e.g., <code class="bg-blue-100 px-1 rounded">user.email</code>)
            </p>
            <p>
              <strong>Target Field:</strong> Where to place the data in the forwarded payload (e.g., <code class="bg-blue-100 px-1 rounded">contact.email</code>)
            </p>
            <p>
              <strong>Fixed Value:</strong> Use a constant value instead of extracting from source
            </p>
          </div>
          <div class="mt-4 p-3 bg-white rounded-lg border border-blue-200">
            <p class="text-xs text-blue-700 font-medium mb-2">Example:</p>
            <code class="text-xs text-slate-700">
              {"{ user: { name: 'John' } }"} → {"{ userName: 'John' }"}
            </code>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default MappingsPage;


