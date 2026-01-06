import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { toast } from "@/store/notificationStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAIModelConfigs, setDefaultAIProvider } from "@/services/aiAssistantApi";
import { gatewayOrigin, joinUrl } from "@/config/runtime";
import { useChat } from "@ai-sdk/react";

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

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
    stop,
    append,
    data,
  } = useChat({
    api: joinUrl(gatewayOrigin, '/api/chat'),
    initialMessages: [
      {
        id: "init-1",
        role: "assistant",
        content: "你好！我是 Prism Cloud AI 助手。我可以帮你快速导航、查看状态或解答疑问。试着对我说：'带我去设备列表' 或 '帮我分析离线设备'",
      },
    ] as any,
    async onToolCall({ toolCall }: any) {
      if (toolCall.toolName === 'navigateToPage') {
        const { path, label } = toolCall.args || {};
        if (path) {
          navigate(path);
          toast.success(`已为你跳转到 ${label || path}`);
          // onToolCall should return void or Promise<void> in this version of SDK
        }
      }
    },
    onError: (err: any) => {
      console.error("Chat error:", err);
      toast.error("呼叫助手失败，请稍后再试");
    }
  } as any) as any;



  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
    stop,
    append,
    data,
    configs,
    currentProvider,
    isConfigsLoading,
    switchProvider: switchProviderMutation.mutate,
    isSwitchingProvider: switchProviderMutation.isPending
  };
}

