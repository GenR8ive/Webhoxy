import axios from "axios";
import type {
  Webhook,
  WebhookCreateRequest,
  WebhookResponse,
  Mapping,
  MappingCreateRequest,
  Log,
  FieldsResponse,
  FieldInfo,
  WebhookListResponse,
  LogListResponse,
} from "./types";

// Get base URL from environment or use default
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
  // Ensure URL doesn't end with /api if already included
  return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Webhook API
export const webhookApi = {
  create: async (data: WebhookCreateRequest): Promise<WebhookResponse> => {
    const response = await api.post<WebhookResponse>("/webhooks", data);
    return response.data;
  },

  list: async (page: number = 1, limit: number = 10): Promise<WebhookListResponse> => {
    const response = await api.get<WebhookListResponse>("/webhooks", {
      params: { page, limit }
    });
    return response.data;
  },

  get: async (id: number): Promise<Webhook> => {
    const response = await api.get<Webhook>(`/webhooks/${id}`);
    return response.data;
  },

  update: async (id: number, data: Partial<WebhookCreateRequest>): Promise<Webhook> => {
    const response = await api.patch<Webhook>(`/webhooks/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/webhooks/${id}`);
  },
};

// Mapping API
export const mappingApi = {
  create: async (data: MappingCreateRequest): Promise<Mapping> => {
    const response = await api.post<Mapping>("/mappings", data);
    return response.data;
  },

  list: async (webhookId: number): Promise<Mapping[]> => {
    const response = await api.get<Mapping[]>(`/mappings/${webhookId}`);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/mappings/${id}`);
  },
};

// Log API
export const logApi = {
  list: async (webhookId: number | undefined, page: number = 1, limit: number = 20): Promise<LogListResponse> => {
    const url = webhookId ? `/logs/${webhookId}` : '/logs';
    const response = await api.get<LogListResponse>(url, {
      params: { page, limit }
    });
    return response.data;
  },
};

// Field API (Smart mapping)
export const fieldApi = {
  getStoredFields: async (webhookId: number): Promise<FieldInfo[]> => {
    const response = await api.get<FieldsResponse>(`/fields/${webhookId}/stored`);
    return response.data.fields;
  },

  getAvailableFields: async (webhookId: number): Promise<FieldInfo[]> => {
    const response = await api.get<FieldsResponse>(`/fields/${webhookId}`);
    return response.data.fields;
  },
  
  saveCustomField: async (webhookId: number, fieldPath: string): Promise<void> => {
    await api.post(`/fields/${webhookId}/custom`, { field_path: fieldPath });
  },

  extractFields: async (payload: any): Promise<FieldInfo[]> => {
    const response = await api.post<FieldsResponse>('/fields/extract', { payload });
    return response.data.fields;
  },
};

export default api;


