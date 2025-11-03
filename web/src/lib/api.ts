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
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

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

  list: async (): Promise<Webhook[]> => {
    const response = await api.get<Webhook[]>("/webhooks");
    return response.data;
  },

  get: async (id: number): Promise<Webhook> => {
    const response = await api.get<Webhook>(`/webhooks/${id}`);
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
  list: async (webhookId: number): Promise<Log[]> => {
    const response = await api.get<Log[]>(`/logs/${webhookId}`);
    return response.data;
  },
};

// Field API (Smart mapping)
export const fieldApi = {
  getAvailableFields: async (webhookId: number): Promise<FieldInfo[]> => {
    const response = await api.get<FieldsResponse>(`/fields/${webhookId}`);
    return response.data.fields;
  },
  
  extractFields: async (payload: any): Promise<FieldInfo[]> => {
    const response = await api.post<FieldsResponse>('/fields/extract', { payload });
    return response.data.fields;
  },
};

export default api;


