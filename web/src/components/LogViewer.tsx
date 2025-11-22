import { createSignal, createResource, For, Show, createEffect } from "solid-js";
import { logApi } from "../lib/api";
import { FiChevronDown, FiChevronUp, FiCheckCircle, FiXCircle, FiClock, FiChevronLeft, FiChevronRight } from "solid-icons/fi";
import type { Log } from "../lib/types";

interface LogViewerProps {
  webhookId?: number;
}

function LogViewer(props: LogViewerProps) {
  const [page, setPage] = createSignal(1);
  const [limit] = createSignal(20);

  // Reset page when webhookId changes
  createEffect(() => {
    props.webhookId; // track dependency
    setPage(1);
  });

  const [logsData] = createResource(
    () => ({ webhookId: props.webhookId, page: page(), limit: limit() }),
    ({ webhookId }) => logApi.list(webhookId, page(), limit())
  );

  const [expandedId, setExpandedId] = createSignal<number | null>(null);

  const logs = () => logsData()?.logs || [];
  const totalPages = () => logsData()?.totalPages || 1;
  const currentPage = () => logsData()?.page || 1;
  const total = () => logsData()?.total || 0;

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId() === id ? null : id);
  };

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (code >= 400) return "text-red-400 bg-red-500/10 border-red-500/20";
    if (code === 0) return "text-red-400 bg-red-500/10 border-red-500/20";
    return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
  };

  const getStatusIcon = (code: number) => {
    if (code >= 200 && code < 300) return <FiCheckCircle class="w-5 h-5" />;
    if (code >= 400 || code === 0) return <FiXCircle class="w-5 h-5" />;
    return <FiClock class="w-5 h-5" />;
  };

  const formatPayload = (payload: string) => {
    try {
      return JSON.stringify(JSON.parse(payload), null, 2);
    } catch {
      return payload;
    }
  };

  return (
    <div class="glass-card rounded-xl p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-white mb-2">Webhook Logs</h2>
        <p class="text-slate-400">
          {total() > 0 ? `Total: ${total()} logs` : 'View webhook delivery history and responses'}
        </p>
      </div>

      <Show
        when={!logsData.loading}
        fallback={
          <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <p class="mt-3 text-slate-400">Loading logs...</p>
          </div>
        }
      >
        <Show
          when={logs().length}
          fallback={
            <div class="text-center py-12">
              <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <FiClock class="w-8 h-8 text-slate-400" />
              </div>
              <p class="text-slate-300 text-lg font-medium">No logs yet</p>
              <p class="text-slate-500 text-sm mt-1">
                Logs will appear here when webhooks are received
              </p>
            </div>
          }
        >
          <div class="space-y-3">
            <For each={logs()}>
              {(log: Log) => (
                <div class="border border-white/5 bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-all">
                  {/* Log Header */}
                  <div
                    class="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => toggleExpand(log.id)}
                  >
                    <div class="flex items-center space-x-4 flex-1">
                      {/* Status Icon */}
                      <div class={`flex items-center space-x-2 p-1 rounded-full ${getStatusColor(log.response_code)} bg-transparent border-0`}>
                        {getStatusIcon(log.response_code)}
                      </div>

                      {/* Status Code */}
                      <div>
                        <span class={`text-sm font-bold px-3 py-1 rounded-lg border ${getStatusColor(log.response_code)}`}>
                          {log.response_code === 0 ? "ERROR" : log.response_code}
                        </span>
                      </div>

                      {/* Timestamp */}
                      <div class="flex-1">
                        <div class="text-sm text-slate-300">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                        <div class="text-xs text-slate-500">
                          {/* Relative time removed */}
                        </div>
                      </div>
                    </div>

                    {/* Expand Button */}
                    <button class="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <Show
                        when={expandedId() === log.id}
                        fallback={<FiChevronDown class="w-5 h-5 text-slate-400" />}
                      >
                        <FiChevronUp class="w-5 h-5 text-slate-400" />
                      </Show>
                    </button>
                  </div>

                  {/* Expanded Content */}
                  <Show when={expandedId() === log.id}>
                    <div class="border-t border-white/5 bg-black/20 p-4 space-y-4">
                      {/* Request Payload */}
                      <div>
                        <h4 class="text-sm font-semibold text-slate-400 mb-2">
                          Request Payload
                        </h4>
                        <pre class="bg-black/40 text-emerald-400 p-4 rounded-lg overflow-x-auto text-xs font-mono border border-white/5">
                          {formatPayload(log.payload)}
                        </pre>
                      </div>

                      {/* Response Body */}
                      <div>
                        <h4 class="text-sm font-semibold text-slate-400 mb-2">
                          Response Body
                        </h4>
                        <pre class="bg-black/40 text-cyan-400 p-4 rounded-lg overflow-x-auto text-xs font-mono border border-white/5">
                          {log.response_body || "No response body"}
                        </pre>
                      </div>

                      {/* Metadata */}
                      <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span class="text-slate-500">Log ID:</span>{" "}
                          <span class="text-slate-300 font-mono">#{log.id}</span>
                        </div>
                        <div>
                          <span class="text-slate-500">Webhook ID:</span>{" "}
                          <span class="text-slate-300 font-mono">#{log.webhook_id}</span>
                        </div>
                      </div>
                    </div>
                  </Show>
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
    </div>
  );
}

export default LogViewer;


