import { useParams, A } from "@solidjs/router";
import { createResource, Show, createSignal } from "solid-js";
import Layout from "../components/Layout";
import MappingEditor from "../components/MappingEditor";
import { webhookApi } from "../lib/api";
import { FiArrowLeft, FiCopy } from "solid-icons/fi";

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
          class="inline-flex items-center space-x-2 text-slate-400 hover:text-primary-400 transition-colors"
        >
          <FiArrowLeft class="w-4 h-4" />
          <span>Back to Dashboard</span>
        </A>

        {/* Page Header */}
        <Show
          when={!webhook.loading}
          fallback={
            <div class="glass-card rounded-xl p-6">
              <div class="animate-pulse">
                <div class="h-8 bg-white/10 rounded w-1/3 mb-2"></div>
                <div class="h-4 bg-white/10 rounded w-1/2"></div>
              </div>
            </div>
          }
        >
          <div class="glass-card rounded-xl p-6">
            <h1 class="text-3xl font-bold text-white mb-2">
              Field Mappings
            </h1>
            <p class="text-slate-400">
              Webhook: <span class="font-semibold text-slate-200">{webhook()?.name}</span>
            </p>
            <div class="mt-2 text-sm text-slate-500 font-mono bg-black/20 inline-block px-2 py-1 rounded border border-white/5">
              Target: {webhook()?.target_url}
            </div>
          </div>
        </Show>

        {/* Mapping Editor */}
        <MappingEditor webhookId={webhookId()} />

        {/* Help Section */}
        <div class="bg-primary-900/20 border border-primary-500/20 rounded-xl p-6">
          <h3 class="font-semibold text-primary-300 mb-3">💡 How Field Mapping Works</h3>
          <div class="space-y-2 text-sm text-primary-200/80">
            <p>
              <strong class="text-primary-200">Source Field:</strong> The path to extract data from incoming webhooks (e.g., <code class="bg-primary-500/20 px-1 rounded text-primary-300">user.email</code>)
            </p>
            <p>
              <strong class="text-primary-200">Target Field:</strong> Where to place the data in the forwarded payload (e.g., <code class="bg-primary-500/20 px-1 rounded text-primary-300">contact.email</code>)
            </p>
            <p>
              <strong class="text-primary-200">Fixed Value:</strong> Use a constant value instead of extracting from source
            </p>
          </div>
          <div class="mt-4 p-3 bg-black/20 rounded-lg border border-primary-500/20">
            <p class="text-xs text-primary-400 font-medium mb-2">Example:</p>
            <code class="text-xs text-slate-400 font-mono">
              {"{ user: { name: 'John' } }"} → {"{ userName: 'John' }"}
            </code>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default MappingsPage;


