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

export interface WebhookCreateRequest {
  name: string;
  description: string;
  target_url: string;
  api_key?: string;
  allowed_ips?: string;
  require_api_key?: boolean;
  require_ip_whitelist?: boolean;
}

export interface WebhookResponse {
  id: number;
  proxy_url: string;
}

export interface Mapping {
  id: number;
  webhook_id: number;
  source_field: string;
  target_field: string;
  fixed_value: string | null;
}

export interface MappingCreateRequest {
  webhook_id: number;
  source_field: string;
  target_field: string;
  fixed_value?: string | null;
}

export interface Log {
  id: number;
  webhook_id: number;
  payload: string;
  source_payload: string | null;
  response_code: number;
  response_body: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: T[];
}

export interface WebhookListResponse {
  webhooks: Webhook[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LogListResponse {
  logs: Log[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FieldInfo {
  path: string;
  type: string;
  sample?: any;
}

export interface FieldsResponse {
  fields: FieldInfo[];
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  mustChangePassword: boolean;
  user: {
    id: number;
    username: string;
  };
}

export interface User {
  id: number;
  username: string;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
  mustChangePassword: boolean;
}


