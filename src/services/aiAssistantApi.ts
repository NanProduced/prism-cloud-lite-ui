import apiClient, { handleRequest } from './apiClient';
import type { BffResponse } from '@/types/auth';

export interface AIModelConfig {
  provider: 'openai' | 'gemini' | 'local-vllm';
  model: string;
  enabled: boolean;
  isDefault: boolean;
  hasApiKey: boolean;
  apiKeyLast4?: string;
}

export interface UpsertAIModelConfigRequest {
  provider: string;
  model: string;
  enabled: boolean;
  makeDefault: boolean;
  apiKey?: string;
}

/**
 * List all AI model configurations for the current user.
 */
export const getAIModelConfigs = () =>
  handleRequest(apiClient.get<BffResponse<AIModelConfig[]>>('/api/v1/assistant/model-configs'));

/**
 * Create or update an AI model configuration (BYOK).
 */
export const upsertAIModelConfig = (data: UpsertAIModelConfigRequest) =>
  handleRequest(apiClient.post<BffResponse<AIModelConfig>>('/api/v1/assistant/model-configs', data));

/**
 * Set a specific provider as the default for AI Assistant.
 */
export const setDefaultAIProvider = (provider: string) =>
  handleRequest(apiClient.post<BffResponse<void>>(`/api/v1/assistant/model-configs/${provider}/default`));

/**
 * Delete an AI model configuration (and its API key).
 */
export const deleteAIModelConfig = (provider: string) =>
  handleRequest(apiClient.delete<BffResponse<void>>(`/api/v1/assistant/model-configs/${provider}`));
