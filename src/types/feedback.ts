export interface FeedbackAttachment {
  url: string;
  name?: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface UserBugReportCreateRequest {
  title: string;
  contentHtml: string;
  pageUrl?: string;
  contactEmail?: string;
  attachments?: FeedbackAttachment[];
}

export interface UserBugReportCreatedView {
  id: string;
  createdAt: string;
}
