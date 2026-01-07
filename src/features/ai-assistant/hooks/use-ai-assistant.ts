import { useNavigate } from "react-router-dom";
import { useMemo, useState, useCallback, useEffect } from "react";
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

  const { data: configsRes, isLoading: isConfigsLoading } = useQuery({
    queryKey: ['ai-assistant', 'configs'],
    queryFn: getAIModelConfigs,
    staleTime: 1000 * 60 * 5,
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

  const [input, setInput] = useState('');
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

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
    sendMessage,
    setMessages,
    addToolResult,
  } = useChat({
    transport: new DefaultChatTransport({
      api: joinUrl(gatewayOrigin, '/api/chat'),
      credentials: 'include',
    }),
    // 关键修复：3.0.14 使用 messages 作为配置项
    messages: initialMessages,
    onToolCall: async ({ toolCall }) => {
      console.log("[AI SDK Debug] Tool Call:", toolCall);
      if (toolCall.toolName === 'navigateToPage') {
        const args = (toolCall as any).args as { path?: string; label?: string } | undefined;
        const path = args?.path;
        if (path) {
          navigate(path);
          toast.success(`已为你跳转到 ${args?.label || path}`);
          
          addToolResult({
            toolCallId: toolCall.toolCallId,
            tool: toolCall.toolName,
            state: 'output-available',
            output: { success: true }
          });
        }
      }
    },
    onError: (err: any) => {
      console.error("[AI SDK Debug] Error:", err);
      if (err.status === 401 || err.status === 403) {
        clearAuth();
      } else {
        toast.error("对话发生错误，详情请查看控制台");
      }
    }
  });

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    console.log("[AI SDK Debug] Sending message:", input);
    // 使用 sendMessage 发送消息
    sendMessage({ text: input });
    setInput('');
  }, [input, sendMessage]);

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
    sendMessage,
    addToolResult,
    status,
    configs,
    currentProvider,
    isConfigsLoading,
    switchProvider: switchProviderMutation.mutate,
    isSwitchingProvider: switchProviderMutation.isPending
  };
}