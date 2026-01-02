import { useNavigate } from "react-router-dom";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { toast } from "@/store/notificationStore";
import apiClient from "@/services/apiClient";
import { useChat } from "@ai-sdk/react";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAIModelConfigs, setDefaultAIProvider, type AIModelConfig } from "@/services/aiAssistantApi";

export function useAIAssistant() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [data, setData] = useState<any[]>([]);

  // Fetch AI configurations
  const { data: configsRes, isLoading: isConfigsLoading } = useQuery({
    queryKey: ['ai-assistant', 'configs'],
    queryFn: getAIModelConfigs,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const configs = (configsRes as any)?.data || [];
  const currentProvider = useMemo(() => configs.find((c: any) => c.isDefault), [configs]);

  const switchProviderMutation = useMutation({
    mutationFn: setDefaultAIProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-assistant', 'configs'] });
      toast.success("AI Provider switched successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to switch provider");
    }
  });

  const chatHelpers = useChat({
    api: "/api/chat",
    // Ensure cookies are sent with the request for authentication
    fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, credentials: 'include' }),
    maxSteps: 5,
    onData: (newData: any) => {
      setData(prev => [...prev, newData]);
    },
    async onToolCall({ toolCall }: { toolCall: any }) {
      // Handle frontend-executed tools (providerExecuted=false)
      if (toolCall.toolName === 'navigateToPage') {
        const args = toolCall.args as { path: string; label?: string };
        if (args.path) {
          navigate(args.path);
          toast.success(`已为你跳转到 ${args.label || args.path}`);
        }
        return;
      }
    },
    initialMessages: [
      {
        id: "init-1",
        role: "assistant",
        content: "你好！我是 Prism Cloud AI 助手。我可以帮你快速导航、查看状态或解答疑问。试着对我说：'带我去设备列表' 或 '帮我分析离线设备'",
      },
    ],
    onError: (error) => {
      console.error("AI Assistant Error:", error);
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.errorCode === 'ASSISTANT_TOKEN_DAILY_LIMIT_EXCEEDED') {
          toast.error(`额度已用尽：${errorData.errorText || '今日 token 额度已达上限'}`);
        } else {
          toast.error(errorData.errorText || "呼叫助手失败，请稍后再试");
        }
      } catch {
        toast.error("呼叫助手失败，请稍后再试");
      }
    }
  } as any);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    if (!input.trim()) return;
    
    const currentInput = input;
    setInput(""); // Optimistically clear input
    setData([]); // Clear sources/data for new request
    
    try {
      await chatHelpers.sendMessage({ text: currentInput });
    } catch (err) {
      console.error("Failed to send message:", err);
      setInput(currentInput); // Restore input on failure
    }
  };

  return {
    ...chatHelpers,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading: chatHelpers.status === 'streaming' || chatHelpers.status === 'submitted',
    reload: chatHelpers.regenerate,
    data,
    // BYOK extensions
    configs,
    currentProvider,
    isConfigsLoading,
    switchProvider: switchProviderMutation.mutate,
    isSwitchingProvider: switchProviderMutation.isPending
  };
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
