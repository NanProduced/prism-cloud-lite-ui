import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useChat } from "@ai-sdk/react";
import { z } from "zod";

export function useAIAssistant() {
  const navigate = useNavigate();

  const chatHelpers = useChat({
    api: "/api/chat", // 待后端实现
    // 在前端模拟 Tools 的定义
    maxSteps: 5,
    async onToolCall({ toolCall }) {
      if (toolCall.toolName === 'navigateToPage') {
        const { path, label } = toolCall.args as { path: string, label: string };
        navigate(path);
        toast.success(`已为你跳转到 ${label}`);
        return `Successfully navigated to ${label}`;
      }
    },
    initialMessages: [
      {
        id: "init-1",
        role: "assistant",
        content: "你好！我是 Prism Cloud AI 助手。我可以帮你快速导航、查看状态或解答疑问。试着对我说：'带我去设备列表'",
      },
    ],
  });

  return chatHelpers;
}

// 定义工具 schema (供参考，实际需后端同步)
export const aiTools = {
  navigateToPage: {
    description: 'Navigate to a specific page in the dashboard',
    parameters: z.object({
      path: z.string().describe('The target path, e.g., /dashboard/devices'),
      label: z.string().describe('The readable name of the page'),
    }),
  },
};
