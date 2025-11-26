export interface Webhook {
  id: number;
  uuid: string;
  name: string;
  description: string;
  target_url: string;
  api_key: string | null;
  allowed_ips: string | null;
  require_api_key: number;
  require_ip_whitelist: number;
  deduplication_enabled: number;
  deduplication_window: number;
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
  api_key: string | null;
  allowed_ips: string | null;
  require_api_key: number;
  require_ip_whitelist: number;
  deduplication_enabled: number;
  deduplication_window: number;
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

export interface User {
  id: number;
  username: string;
  password_hash: string;
  must_change_password: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: number;
  user_id: number;
  activity_type: string;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: string | null;
  created_at: string;
}

export interface RefreshToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  created_at: string;
}

export type ActivityType = 
  | 'user_created'
  | 'user_updated'
  | 'logged_in'
  | 'logged_out'
  | 'password_changed'
  | 'webhook_created'
  | 'webhook_updated'
  | 'webhook_deleted'
  | 'mapping_created'
  | 'mapping_updated'
  | 'mapping_deleted';

