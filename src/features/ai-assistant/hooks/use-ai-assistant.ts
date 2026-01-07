import { useNavigate } from "react-router-dom";
import { useMemo, useState, useCallback } from "react";
import { toast } from "@/store/notificationStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAIModelConfigs, setDefaultAIProvider } from "@/services/aiAssistantApi";
import { gatewayOrigin, joinUrl } from "@/config/runtime";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

export function useAIAssistant() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  // AI SDK 5.0+: Input state managed manually
  const [input, setInput] = useState('');

  // Initial greeting message in UIMessage format (AI SDK 5.0+)
  const initialMessages: UIMessage[] = [
    {
      id: "init-1",
      role: "assistant",
      parts: [{
        type: 'text',
        text: "你好！我是 Prism Cloud AI 助手。我可以帮你快速导航、查看状态或解答疑问。试着对我说：'带我去设备列表' 或 '帮我分析离线设备'"
      }],
    },
  ];

  const {
    messages,
    status,
    stop,
    sendMessage,
    setMessages,
  } = useChat({
    transport: new DefaultChatTransport({
      api: joinUrl(gatewayOrigin, '/api/chat'),
    }),
    messages: initialMessages,
    onToolCall: async ({ toolCall }: { toolCall: { toolName: string; toolCallId: string; args?: unknown } }) => {
      if (toolCall.toolName === 'navigateToPage') {
        const args = toolCall.args as { path?: string; label?: string } | undefined;
        const path = args?.path;
        const label = args?.label;
        if (path) {
          navigate(path);
          toast.success(`已为你跳转到 ${label || path}`);
        }
      }
    },
    onError: (err) => {
      console.error("Chat error:", err);
      toast.error("呼叫助手失败，请稍后再试");
    }
  });

  // AI SDK 5.0+: Manual input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  // AI SDK 5.0+: Manual submit handler
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
  }, [input, sendMessage]);

  // AI SDK 5.0+: Reload functionality - clear and resend
  const reload = useCallback(() => {
    setMessages(initialMessages);
  }, [setMessages]);

  // AI SDK 5.0+: isLoading derived from status
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
    status,
    configs,
    currentProvider,
    isConfigsLoading,
    switchProvider: switchProviderMutation.mutate,
    isSwitchingProvider: switchProviderMutation.isPending
  };
}

