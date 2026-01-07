import { useNavigate } from "react-router-dom";
import { useMemo, useState, useCallback } from "react";
import { toast } from "@/store/notificationStore";
import { useAuthStore } from "@/store/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAIModelConfigs, setDefaultAIProvider } from "@/services/aiAssistantApi";
import { gatewayOrigin, joinUrl } from "@/config/runtime";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

export function useAIAssistant() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();

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
      toast.success("AI 引擎切换成功");
    },
    onError: (err: any) => {
      toast.error(err.message || "切换引擎失败");
    }
  });

  // Manual input state
  const [input, setInput] = useState('');
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  // Initial greeting message
  const initialMessages: any[] = [
    {
      id: "init-1",
      role: "assistant",
      content: "你好！我是 Prism Cloud AI 助手。我可以帮你快速导航、查看状态或解答疑问。试着对我说：'带我去设备列表' 或 '帮我分析离线设备'"
    },
  ];

  const {
    messages,
    status,
    stop,
    sendMessage: sdkSendMessage,
    setMessages,
    addToolResult,
  } = useChat({
    transport: new DefaultChatTransport({
      api: joinUrl(gatewayOrigin, '/api/chat'),
    }),
    messages: initialMessages,
    onToolCall: async ({ toolCall }) => {
      if (toolCall.toolName === 'navigateToPage') {
        const args = (toolCall as any).args as { path?: string; label?: string } | undefined;
        const path = args?.path;
        const label = args?.label;
        if (path) {
          navigate(path);
          toast.success(`已为你跳转到 ${label || path}`);
          
          addToolResult({
            toolCallId: toolCall.toolCallId,
            tool: toolCall.toolName,
            output: { success: true, path }
          });
        }
      }
    },
    onError: (err: any) => {
      console.error("Chat error:", err);
      if (err.status === 401 || err.status === 403) {
        console.warn('[AI Assistant] Auth failed');
        clearAuth();
      } else {
        toast.error("呼叫助手失败，请稍后再试");
      }
    }
  });

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    sdkSendMessage({ text: input });
    setInput('');
  }, [input, sdkSendMessage]);

  const reload = useCallback(() => {
    setMessages(initialMessages);
  }, [setMessages, initialMessages]);

  const isLoading = status === 'submitted' || status === 'streaming';

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
    stop,
    sendMessage: sdkSendMessage,
    addToolResult,
    status,
    configs,
    currentProvider,
    isConfigsLoading,
    switchProvider: switchProviderMutation.mutate,
    isSwitchingProvider: switchProviderMutation.isPending
  };
}
