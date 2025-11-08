import { createSignal, Show } from "solid-js";
import { webhookApi } from "../lib/api";
import type { WebhookResponse } from "../lib/types";
import { FiCopy, FiCheck, FiAlertCircle, FiChevronDown, FiChevronUp, FiLock, FiShield, FiEye, FiEyeOff } from "solid-icons/fi";

interface WebhookFormProps {
  onSuccess?: (webhook: WebhookResponse) => void;
}

function WebhookForm(props: WebhookFormProps) {
  const [name, setName] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [targetUrl, setTargetUrl] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [proxyUrl, setProxyUrl] = createSignal("");
  const [copied, setCopied] = createSignal(false);
  
  // Security settings
  const [showSecurity, setShowSecurity] = createSignal(false);
  const [apiKey, setApiKey] = createSignal("");
  const [requireApiKey, setRequireApiKey] = createSignal(false);
  const [showApiKey, setShowApiKey] = createSignal(false);
  const [allowedIps, setAllowedIps] = createSignal("");
  const [requireIpWhitelist, setRequireIpWhitelist] = createSignal(false);

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
      const response = await webhookApi.create({
        name: name(),
        description: description(),
        target_url: targetUrl(),
        api_key: requireApiKey() ? apiKey() : undefined,
        allowed_ips: requireIpWhitelist() ? allowedIps() : undefined,
        require_api_key: requireApiKey(),
        require_ip_whitelist: requireIpWhitelist(),
      });

      setProxyUrl(response.proxy_url);
      
      // Reset form
      setName("");
      setDescription("");
      setTargetUrl("");
      setApiKey("");
      setRequireApiKey(false);
      setAllowedIps("");
      setRequireIpWhitelist(false);
      setShowSecurity(false);

      if (props.onSuccess) {
        props.onSuccess(response);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create webhook");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(proxyUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-slate-800 mb-2">Create New Webhook</h2>
        <p class="text-slate-600">
          Configure your webhook proxy to forward requests to your target URL
        </p>
      </div>

      <form onSubmit={handleSubmit} class="space-y-5">
        {/* Webhook Name */}
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            Webhook Name
          </label>
          <input
            type="text"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
            placeholder="e.g., GitHub -> Slack"
            required
            class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
          />
        </div>

        {/* Source URL */}
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            Source Description
            <span class="text-slate-400 font-normal ml-2">(optional)</span>
          </label>
          <input
            type="text"
            value={description()}
            onInput={(e) => setDescription(e.currentTarget.value)}
            placeholder="e.g., GitHub API, Stripe Webhooks"
            class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
          />
          <p class="mt-1 text-xs text-slate-500">
            A description of the webhook
          </p>
        </div>

        {/* Target URL */}
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            Target URL <span class="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={targetUrl()}
            onInput={(e) => setTargetUrl(e.currentTarget.value)}
            placeholder="https://your-app.com/webhook"
            required
            class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
          />
          <p class="mt-1 text-xs text-slate-500">
            The URL where webhooks will be forwarded to
          </p>
        </div>

        {/* Security Settings */}
        <div class="border border-slate-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSecurity(!showSecurity())}
            class="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div class="flex items-center space-x-2">
              <FiShield class="w-5 h-5 text-slate-600" />
              <span class="font-medium text-slate-700">Security Settings</span>
              <span class="text-xs text-slate-500">(Optional)</span>
            </div>
            <Show when={showSecurity()} fallback={<FiChevronDown class="w-5 h-5 text-slate-400" />}>
              <FiChevronUp class="w-5 h-5 text-slate-400" />
            </Show>
          </button>

          <Show when={showSecurity()}>
            <div class="p-4 space-y-4 bg-white">
              {/* API Key Authentication */}
              <div class="border-l-4 border-primary-500 pl-4">
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireApiKey()}
                    onChange={(e) => setRequireApiKey(e.currentTarget.checked)}
                    class="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-2 focus:ring-primary-500"
                  />
                  <div class="flex items-center space-x-2">
                    <FiLock class="w-4 h-4 text-primary-600" />
                    <span class="text-sm font-medium text-slate-700">Require API Key</span>
                  </div>
                </label>
                
                <Show when={requireApiKey()}>
                  <div class="mt-3 space-y-2">
                    <div class="flex space-x-2">
                      <div class="flex-1 relative">
                        <input
                          type={showApiKey() ? "text" : "password"}
                          value={apiKey()}
                          onInput={(e) => setApiKey(e.currentTarget.value)}
                          placeholder="Enter or generate API key"
                          class="w-full px-3 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey())}
                          class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700 transition-colors"
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
                        class="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors text-sm font-medium"
                      >
                        Generate
                      </button>
                    </div>
                    <p class="text-xs text-slate-500">
                      Clients must include this key in the <code class="bg-slate-100 px-1 rounded">X-API-Key</code> header
                    </p>
                  </div>
                </Show>
              </div>

              {/* IP Whitelist */}
              <div class="border-l-4 border-green-500 pl-4">
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireIpWhitelist()}
                    onChange={(e) => setRequireIpWhitelist(e.currentTarget.checked)}
                    class="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <div class="flex items-center space-x-2">
                    <FiShield class="w-4 h-4 text-green-600" />
                    <span class="text-sm font-medium text-slate-700">IP Whitelist</span>
                  </div>
                </label>
                
                <Show when={requireIpWhitelist()}>
                  <div class="mt-3 space-y-2">
                    <textarea
                      value={allowedIps()}
                      onInput={(e) => setAllowedIps(e.currentTarget.value)}
                      placeholder="192.168.1.1, 10.0.0.5"
                      rows="2"
                      class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none font-mono"
                    />
                    <p class="text-xs text-slate-500">
                      Only these IP addresses can call this webhook (comma-separated)
                    </p>
                  </div>
                </Show>
              </div>
            </div>
          </Show>
        </div>

        {/* Error Message */}
        <Show when={error()}>
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2">
            <FiAlertCircle class="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span class="text-sm">{error()}</span>
          </div>
        </Show>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading()}
          class="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-primary-600 hover:to-secondary-600 focus:ring-4 focus:ring-primary-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {loading() ? "Creating..." : "Create Webhook"}
        </button>
      </form>

      {/* Success Message with Proxy URL */}
      <Show when={proxyUrl()}>
        <div class="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-5">
          <div class="flex items-center space-x-2 mb-3">
            <FiCheck class="w-5 h-5 text-green-600" />
            <h3 class="font-semibold text-green-800">Webhook Created Successfully!</h3>
          </div>
          <p class="text-sm text-green-700 mb-3">
            Use this proxy URL in your webhook source:
          </p>
          <div class="flex items-center space-x-2 bg-white border border-green-200 rounded-lg p-3">
            <code class="flex-1 text-sm text-slate-800 font-mono break-all">
              {proxyUrl()}
            </code>
            <button
              onClick={copyToClipboard}
              class="flex-shrink-0 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors flex items-center space-x-1"
            >
              <Show when={copied()} fallback={<FiCopy class="w-4 h-4" />}>
                <FiCheck class="w-4 h-4" />
              </Show>
              <span class="text-xs font-medium">{copied() ? "Copied!" : "Copy"}</span>
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}

export default WebhookForm;


