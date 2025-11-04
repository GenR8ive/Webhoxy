export interface Webhook {
  id: number;
  name: string;
  description: string;
  target_url: string;
  api_key: string | null;
  allowed_ips: string | null;
  require_api_key: number;
  require_ip_whitelist: number;
  created_at: string;
}

export interface Mapping {
  id: number;
  webhook_id: number;
  source_field: string;
  target_field: string;
  fixed_value: string | null;
}

export interface Log {
  id: number;
  webhook_id: number;
  payload: string; // Transformed/forwarded payload
  source_payload: string | null; // Original incoming payload
  response_code: number;
  response_body: string;
  created_at: string;
}

export interface WebhookCreateRequest {
  name: string;
  description: string;
  target_url: string;
}

export interface WebhookResponse {
  id: number;
  proxy_url: string;
}

export interface MappingCreateRequest {
  webhook_id: number;
  source_field: string;
  target_field: string;
  fixed_value?: string | null;
}

