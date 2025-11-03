import { createSignal, createResource, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { webhookApi } from "../lib/api";
import { FiTrash2, FiExternalLink, FiCopy, FiCheck, FiZap } from "solid-icons/fi";

interface WebhookListProps {
  refresh?: number;
}

function WebhookList(props: WebhookListProps) {
  const [webhooks, { refetch }] = createResource(
    () => props.refresh,
    () => webhookApi.list()
  );
  
  const [copiedId, setCopiedId] = createSignal<number | null>(null);
  const [deletingId, setDeletingId] = createSignal<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this webhook?")) {
      return;
    }

    setDeletingId(id);
    try {
      await webhookApi.delete(id);
      refetch();
    } catch (err) {
      console.error("Failed to delete webhook:", err);
      alert("Failed to delete webhook");
    } finally {
      setDeletingId(null);
    }
  };

  const copyProxyUrl = async (id: number) => {
    const url = `http://localhost:8080/hook/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-slate-800 mb-2">Your Webhooks</h2>
        <p class="text-slate-600">Manage your webhook proxies</p>
      </div>

      <Show
        when={!webhooks.loading}
        fallback={
          <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-3 text-slate-500">Loading webhooks...</p>
          </div>
        }
      >
        <Show
          when={webhooks()?.length}
          fallback={
            <div class="text-center py-12">
              <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiZap class="w-8 h-8 text-slate-400" />
              </div>
              <p class="text-slate-500 text-lg font-medium">No webhooks yet</p>
              <p class="text-slate-400 text-sm mt-1">
                Create your first webhook proxy above
              </p>
            </div>
          }
        >
          <div class="space-y-3">
            <For each={webhooks()}>
              {(webhook) => (
                <div class="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center space-x-3 mb-2">
                        <h3 class="text-lg font-semibold text-slate-800">
                          {webhook.name}
                        </h3>
                        <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                          Active
                        </span>
                      </div>

                      <div class="space-y-2 text-sm">
                        <div>
                          <span class="text-slate-500">Source:</span>{" "}
                          <span class="text-slate-700">{webhook.source_url || "Any"}</span>
                        </div>
                        <div>
                          <span class="text-slate-500">Target:</span>{" "}
                          <a
                            href={webhook.target_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-blue-600 hover:underline inline-flex items-center space-x-1"
                          >
                            <span class="truncate max-w-md">{webhook.target_url}</span>
                            <FiExternalLink class="w-3 h-3 flex-shrink-0" />
                          </a>
                        </div>
                        <div class="flex items-center space-x-2">
                          <span class="text-slate-500">Proxy URL:</span>
                          <code class="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono">
                            http://localhost:8080/hook/{webhook.id}
                          </code>
                          <button
                            onClick={() => copyProxyUrl(webhook.id)}
                            class="text-slate-500 hover:text-blue-600 transition-colors"
                            title="Copy proxy URL"
                          >
                            <Show
                              when={copiedId() === webhook.id}
                              fallback={<FiCopy class="w-4 h-4" />}
                            >
                              <FiCheck class="w-4 h-4 text-green-600" />
                            </Show>
                          </button>
                        </div>
                      </div>

                      <div class="mt-3 text-xs text-slate-400">
                        Created: {new Date(webhook.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div class="flex flex-col space-y-2 ml-4">
                      <A
                        href={`/mappings/${webhook.id}`}
                        class="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium text-center"
                      >
                        Mappings
                      </A>
                      <A
                        href={`/logs?webhook=${webhook.id}`}
                        class="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium text-center"
                      >
                        Logs
                      </A>
                      <button
                        onClick={() => handleDelete(webhook.id)}
                        disabled={deletingId() === webhook.id}
                        class="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center space-x-1"
                      >
                        <FiTrash2 class="w-4 h-4" />
                        <span>{deletingId() === webhook.id ? "..." : "Delete"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
}

export default WebhookList;


