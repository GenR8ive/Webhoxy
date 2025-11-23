import { createSignal, createResource, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { webhookApi } from "../lib/api";
import { FiTrash2, FiExternalLink, FiCopy, FiCheck, FiZap, FiChevronLeft, FiChevronRight, FiEdit } from "solid-icons/fi";
import WebhookEditModal from "./WebhookEditModal";
import type { Webhook } from "../lib/types";

interface WebhookListProps {
  refresh?: number;
}

function WebhookList(props: WebhookListProps) {
  const [page, setPage] = createSignal(1);
  const [limit] = createSignal(10);

  const [webhooksData, { refetch }] = createResource(
    () => ({ refresh: props.refresh, page: page(), limit: limit() }),
    () => webhookApi.list(page(), limit())
  );
  
  const [copiedId, setCopiedId] = createSignal<number | null>(null);
  const [deletingId, setDeletingId] = createSignal<number | null>(null);
  const [editingWebhook, setEditingWebhook] = createSignal<Webhook | null>(null);

  const webhooks = () => webhooksData()?.webhooks || [];
  const totalPages = () => webhooksData()?.totalPages || 1;
  const currentPage = () => webhooksData()?.page || 1;
  const total = () => webhooksData()?.total || 0;

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

  return (
    <div class="glass-card rounded-xl p-6">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-white mb-2">Your Webhooks</h2>
          <p class="text-slate-400">
            {total() > 0 ? `Total: ${total()} webhooks` : 'Manage your webhook proxies'}
          </p>
        </div>
      </div>

      <Show
        when={!webhooksData.loading}
        fallback={
          <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <p class="mt-3 text-slate-400">Loading webhooks...</p>
          </div>
        }
      >
        <Show
          when={webhooks().length}
          fallback={
            <div class="text-center py-12">
              <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <FiZap class="w-8 h-8 text-slate-400" />
              </div>
              <p class="text-slate-300 text-lg font-medium">No webhooks yet</p>
              <p class="text-slate-500 text-sm mt-1">
                Create your first webhook proxy above
              </p>
            </div>
          }
        >
          <div class="space-y-3">
            <For each={webhooks()}>
              {(webhook) => (
                <div class="border border-white/5 bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all group">
                  <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center space-x-3 mb-2">
                        <h3 class="text-lg font-semibold text-slate-200 group-hover:text-white transition-colors">
                          {webhook.name}
                        </h3>
                        <span class="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-medium border border-emerald-500/20">
                          Active
                        </span>
                      </div>

                      <div class="space-y-2 text-sm">
                        <div>
                          <span class="text-slate-500">Source:</span>{" "}
                          <span class="text-slate-300">{webhook.description || "Any"}</span>
                        </div>
                        <div>
                          <span class="text-slate-500">Target:</span>{" "}
                          <a
                            href={webhook.target_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-primary-400 hover:text-primary-300 hover:underline inline-flex items-center space-x-1"
                          >
                            <span class="truncate max-w-md">{webhook.target_url}</span>
                            <FiExternalLink class="w-3 h-3 flex-shrink-0" />
                          </a>
                        </div>
                          <div class="flex items-center space-x-2">
                          <span class="text-slate-500">Proxy URL:</span>
                          <code class="text-xs bg-black/30 px-2 py-1 rounded text-slate-300 font-mono border border-white/5">
                            {(() => {
                              const baseUrl = import.meta.env.VITE_WEBHOOK_URL || `${import.meta.env.VITE_API_URL}/hook`;
                              // Remove trailing slash if present to avoid double slashes
                              const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
                              return `${cleanBaseUrl}/${webhook.id}`;
                            })()}
                          </code>
                          <button
                            onClick={() => {
                              const baseUrl = import.meta.env.VITE_WEBHOOK_URL || `${import.meta.env.VITE_API_URL}/hook`;
                              const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
                              const url = `${cleanBaseUrl}/${webhook.id}`;
                              navigator.clipboard.writeText(url).then(() => {
                                setCopiedId(webhook.id);
                                setTimeout(() => setCopiedId(null), 2000);
                              });
                            }}
                            class="text-slate-500 hover:text-primary-400 transition-colors"
                            title="Copy proxy URL"
                          >
                            <Show
                              when={copiedId() === webhook.id}
                              fallback={<FiCopy class="w-4 h-4" />}
                            >
                              <FiCheck class="w-4 h-4 text-emerald-400" />
                            </Show>
                          </button>
                        </div>
                      </div>

                      <div class="mt-3 text-xs text-slate-500">
                        Created: {new Date(webhook.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div class="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => setEditingWebhook(webhook)}
                        class="px-4 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium flex items-center justify-center space-x-1 border border-white/5"
                      >
                        <FiEdit class="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <A
                        href={`/mappings/${webhook.id}`}
                        class="px-4 py-2 bg-primary-500/10 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors text-sm font-medium text-center border border-primary-500/10"
                      >
                        Mappings
                      </A>
                      <A
                        href={`/logs?webhook=${webhook.id}`}
                        class="px-4 py-2 bg-secondary-500/10 text-secondary-400 rounded-lg hover:bg-secondary-500/20 transition-colors text-sm font-medium text-center border border-secondary-500/10"
                      >
                        Logs
                      </A>
                      <button
                        onClick={() => handleDelete(webhook.id)}
                        disabled={deletingId() === webhook.id}
                        class="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center space-x-1 border border-red-500/10"
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

          {/* Pagination Controls */}
          <Show when={totalPages() > 1}>
            <div class="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
              <div class="text-sm text-slate-500">
                Page {currentPage()} of {totalPages()}
              </div>
              <div class="flex items-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage() === 1}
                  class="px-3 py-2 text-sm font-medium text-slate-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 transition-colors"
                >
                  <FiChevronLeft class="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages(), p + 1))}
                  disabled={currentPage() === totalPages()}
                  class="px-3 py-2 text-sm font-medium text-slate-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 transition-colors"
                >
                  <span>Next</span>
                  <FiChevronRight class="w-4 h-4" />
                </button>
              </div>
            </div>
          </Show>
        </Show>
      </Show>

      {/* Edit Modal */}
      <Show when={editingWebhook()}>
        <WebhookEditModal
          webhook={editingWebhook()!}
          onClose={() => setEditingWebhook(null)}
          onSuccess={() => refetch()}
        />
      </Show>
    </div>
  );
}

export default WebhookList;


