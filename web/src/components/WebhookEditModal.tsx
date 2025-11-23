import { createSignal, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { webhookApi } from "../lib/api";
import type { Webhook } from "../lib/types";
import { FiX, FiAlertCircle, FiChevronDown, FiChevronUp, FiLock, FiShield, FiEye, FiEyeOff, FiCopy } from "solid-icons/fi";

interface WebhookEditModalProps {
  webhook: Webhook;
  onClose: () => void;
  onSuccess: () => void;
}

function WebhookEditModal(props: WebhookEditModalProps) {
  const [name, setName] = createSignal(props.webhook.name);
  const [description, setDescription] = createSignal(props.webhook.description || "");
  const [targetUrl, setTargetUrl] = createSignal(props.webhook.target_url);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  
  // Security settings
  const [showSecurity, setShowSecurity] = createSignal(false);
  const [apiKey, setApiKey] = createSignal(props.webhook.api_key || "");
  const [requireApiKey, setRequireApiKey] = createSignal(!!props.webhook.require_api_key);
  const [showApiKey, setShowApiKey] = createSignal(false);
  const [allowedIps, setAllowedIps] = createSignal(props.webhook.allowed_ips || "");
  const [requireIpWhitelist, setRequireIpWhitelist] = createSignal(!!props.webhook.require_ip_whitelist);
  const [deduplicationEnabled, setDeduplicationEnabled] = createSignal(!!props.webhook.deduplication_enabled);
  const [deduplicationWindow, setDeduplicationWindow] = createSignal(props.webhook.deduplication_window || 60);

  const generateApiKey = () => {
    const key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setApiKey(key);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await webhookApi.update(props.webhook.id, {
        name: name(),
        description: description(),
        target_url: targetUrl(),
        api_key: requireApiKey() ? apiKey() : undefined,
        allowed_ips: requireIpWhitelist() ? allowedIps() : undefined,
        require_api_key: requireApiKey(),
        require_ip_whitelist: requireIpWhitelist(),
        deduplication_enabled: deduplicationEnabled(),
        deduplication_window: deduplicationWindow(),
      });

      props.onSuccess();
      props.onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update webhook");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={props.onClose}>
        <div class="glass-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div class="flex items-center justify-between p-6 border-b border-white/10">
            <h2 class="text-2xl font-bold text-white">Edit Webhook</h2>
            <button
              onClick={props.onClose}
              class="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <FiX class="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} class="p-6 space-y-5">
            {/* Webhook Name */}
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Webhook Name
              </label>
              <input
                type="text"
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
                placeholder="e.g., GitHub -> Slack"
                required
                class="w-full px-4 py-3 rounded-lg outline-none input-premium placeholder:text-slate-600"
              />
            </div>

            {/* Description */}
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Description
                <span class="text-slate-500 font-normal ml-2">(optional)</span>
              </label>
              <input
                type="text"
                value={description()}
                onInput={(e) => setDescription(e.currentTarget.value)}
                placeholder="e.g., GitHub API, Stripe Webhooks"
                class="w-full px-4 py-3 rounded-lg outline-none input-premium placeholder:text-slate-600"
              />
            </div>

            {/* Target URL */}
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Target URL <span class="text-red-400">*</span>
              </label>
              <input
                type="url"
                value={targetUrl()}
                onInput={(e) => setTargetUrl(e.currentTarget.value)}
                placeholder="https://your-app.com/webhook"
                required
                class="w-full px-4 py-3 rounded-lg outline-none input-premium placeholder:text-slate-600"
              />
            </div>

            {/* Security Settings */}
            <div class="border border-white/10 rounded-lg overflow-hidden bg-black/20">
              <button
                type="button"
                onClick={() => setShowSecurity(!showSecurity())}
                class="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div class="flex items-center space-x-2">
                  <FiShield class="w-5 h-5 text-primary-400" />
                  <span class="font-medium text-slate-200">Security Settings</span>
                </div>
                <Show when={showSecurity()} fallback={<FiChevronDown class="w-5 h-5 text-slate-400" />}>
                  <FiChevronUp class="w-5 h-5 text-slate-400" />
                </Show>
              </button>

              <Show when={showSecurity()}>
                <div class="p-4 space-y-4 border-t border-white/10">
                  {/* API Key Authentication */}
                  <div class="border-l-4 border-primary-500 pl-4">
                    <label class="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requireApiKey()}
                        onChange={(e) => setRequireApiKey(e.currentTarget.checked)}
                        class="w-4 h-4 text-primary-500 border-slate-600 rounded focus:ring-2 focus:ring-primary-500 bg-slate-800"
                      />
                      <div class="flex items-center space-x-2">
                        <FiLock class="w-4 h-4 text-primary-400" />
                        <span class="text-sm font-medium text-slate-300">Require API Key</span>
                      </div>
                    </label>
                    
                  <Show when={requireApiKey()}>
                    <div class="mt-3 space-y-2">
                      <div class="flex space-x-2">
                        <div class="flex-1 relative">
                          <input
                            type="text"
                            value={apiKey()}
                            onInput={(e) => setApiKey(e.currentTarget.value)}
                            placeholder="Enter or generate API key"
                            class="w-full px-3 py-2 pr-10 text-sm rounded-lg outline-none input-premium font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey())}
                            class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
                            title={showApiKey() ? "Hide API key" : "Show API key"}
                          >
                            <Show when={showApiKey()} fallback={<FiEye class="w-4 h-4" />}>
                              <FiEyeOff class="w-4 h-4" />
                            </Show>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={generateApiKey}
                          class="px-4 py-2 bg-primary-500/20 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors text-sm font-medium border border-primary-500/20"
                        >
                          Generate
                        </button>
                      </div>
                      <p class="text-xs text-slate-500">
                        Clients must include this key in the <code class="bg-white/10 px-1 rounded text-slate-300">X-API-Key</code> header
                      </p>
                    </div>
                  </Show>
                  </div>

                  {/* IP Whitelist */}
                  <div class="border-l-4 border-emerald-500 pl-4">
                    <label class="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requireIpWhitelist()}
                        onChange={(e) => setRequireIpWhitelist(e.currentTarget.checked)}
                        class="w-4 h-4 text-emerald-500 border-slate-600 rounded focus:ring-2 focus:ring-emerald-500 bg-slate-800"
                      />
                      <div class="flex items-center space-x-2">
                        <FiShield class="w-4 h-4 text-emerald-400" />
                        <span class="text-sm font-medium text-slate-300">IP Whitelist</span>
                      </div>
                    </label>
                    
                    <Show when={requireIpWhitelist()}>
                      <div class="mt-3 space-y-2">
                        <textarea
                          value={allowedIps()}
                          onInput={(e) => setAllowedIps(e.currentTarget.value)}
                          placeholder="192.168.1.1, 10.0.0.5"
                          rows="2"
                          class="w-full px-3 py-2 text-sm rounded-lg outline-none input-premium font-mono"
                        />
                        <p class="text-xs text-slate-500">
                          Only these IP addresses can call this webhook (comma-separated)
                        </p>
                      </div>
                    </Show>
                  </div>

                  {/* Deduplication */}
                  <div class="border-l-4 border-blue-500 pl-4">
                    <label class="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deduplicationEnabled()}
                        onChange={(e) => setDeduplicationEnabled(e.currentTarget.checked)}
                        class="w-4 h-4 text-blue-500 border-slate-600 rounded focus:ring-2 focus:ring-blue-500 bg-slate-800"
                      />
                      <div class="flex items-center space-x-2">
                        <FiCopy class="w-4 h-4 text-blue-400" />
                        <span class="text-sm font-medium text-slate-300">Prevent Duplicates</span>
                      </div>
                    </label>
                    
                    <Show when={deduplicationEnabled()}>
                      <div class="mt-3 space-y-2">
                        <div class="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            max="3600"
                            value={deduplicationWindow()}
                            onInput={(e) => setDeduplicationWindow(parseInt(e.currentTarget.value) || 60)}
                            class="w-24 px-3 py-2 text-sm rounded-lg outline-none font-mono input-premium"
                          />
                          <span class="text-sm text-slate-400">seconds window</span>
                        </div>
                        <p class="text-xs text-slate-500 leading-relaxed">
                          If enabled, Webhoxy will calculate a hash of the incoming payload. 
                          If an identical payload is received within the specified window, 
                          it will be skipped to prevent double-processing.
                        </p>
                      </div>
                    </Show>
                  </div>
                </div>
              </Show>
            </div>

            {/* Error Message */}
            <Show when={error()}>
              <div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-start space-x-2">
                <FiAlertCircle class="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span class="text-sm">{error()}</span>
              </div>
            </Show>

            {/* Action Buttons */}
            <div class="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={props.onClose}
                class="flex-1 bg-white/5 text-slate-300 font-semibold py-3 px-6 rounded-lg hover:bg-white/10 transition-colors border border-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading()}
                class="flex-1 btn-primary text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading() ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}

export default WebhookEditModal;

