export interface Webhook {
  id: number;
  name: string;
  description: string;
  target_url: string;
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
  response_code: number;
  response_body: string;
  created_at: string;
}

export interface FieldInfo {
  path: string;
  type: string;
  sample?: any;
}

export interface FieldsResponse {
  fields: FieldInfo[];
}


