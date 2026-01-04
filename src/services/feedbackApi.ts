import apiClient, { handleRequest } from './apiClient';
import type { BffResponse } from '@/types/auth';
import type { UserBugReportCreateRequest, UserBugReportCreatedView } from '@/types/feedback';

/**
 * Submit a bug report or feedback
 */
export const submitBugReport = (data: UserBugReportCreateRequest) =>
  handleRequest(apiClient.post<BffResponse<UserBugReportCreatedView>>('/feedback/bugs', data));
