import { createSignal, Show } from "solid-js";
import { webhookApi } from "../lib/api";
import type { WebhookResponse } from "../lib/types";
import { FiCopy, FiCheck, FiAlertCircle } from "solid-icons/fi";

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

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await webhookApi.create({
        name: name(),
        description: description(),
        target_url: targetUrl(),
      });

      setProxyUrl(response.proxy_url);
      
      // Reset form
      setName("");
      setDescription("");
      setTargetUrl("");

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
            class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
            class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
            class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
          <p class="mt-1 text-xs text-slate-500">
            The URL where webhooks will be forwarded to
          </p>
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
          class="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 focus:ring-4 focus:ring-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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


