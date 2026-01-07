import { useNavigate, useLocation } from "react-router-dom";
import { useMemo, useState, useCallback, useEffect } from "react";
import { toast } from "@/store/notificationStore";
import { useAuthStore } from "@/store/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAIModelConfigs, setDefaultAIProvider } from "@/services/aiAssistantApi";
import { gatewayOrigin, joinUrl } from "@/config/runtime";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls, type UIMessage } from "ai";

export function useAIAssistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { clearAuth, user } = useAuthStore();

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

  // 1. 初始历史记录为空 (欢迎语改为独立的 Welcome Card 渲染，不污染消息流)
  const initialMsgs = useMemo<UIMessage[]>(() => [], []);

  // 2. 动态建议词 (保持不变)
  const suggestions = useMemo(() => {
    // 全局通用按钮
    const globalChips = [
      { label: "带我去设备列表 ✅", prompt: "带我去设备列表" },
      { label: "带我去节目 ✅", prompt: "带我去节目" },
      { label: "离线设备概览 ✅", prompt: "[[fleet:true]] 帮我分析离线设备" }
    ];
    
    if (location.pathname.includes('/devices')) {
      return [
        { label: "分析设备离线原因 ✅", prompt: "分析设备离线原因" },
        { label: "离线设备概览 ✅", prompt: "[[fleet:true]] 帮我分析离线设备" },
        { label: "带我去节目 ✅", prompt: "带我去节目" }
      ];
    } else if (location.pathname.includes('/logs')) {
      return [
        { label: "排查指令未生效 ✅", prompt: "排查指令为什么没生效" },
        { label: "指令失败概览 ◇", prompt: "查询最近24小时失败的指令并总结Top原因" },
        { label: "打开帮助中心 ✅", prompt: "打开帮助中心" }
      ];
    } else if (location.pathname.includes('/studio') || location.pathname.includes('/programs')) {
      return [
        { label: "怎么创建节目？ ◇", prompt: "怎么创建节目？" },
        { label: "打开监控 ✅", prompt: "打开监控" },
        { label: "带我去设备列表 ✅", prompt: "带我去设备列表" }
      ];
    } else if (location.pathname.includes('/dashboard')) {
      return [
        { label: "离线设备概览 ✅", prompt: "[[fleet:true]] 帮我分析离线设备" },
        { label: "打开监控 ✅", prompt: "打开监控" },
        { label: "带我去节目 ✅", prompt: "带我去节目" }
      ];
    }
    
    return globalChips;
  }, [location.pathname]);

  const transport = useMemo(() => new DefaultChatTransport({
    api: joinUrl(gatewayOrigin, '/api/chat'),
    credentials: 'include',
  }), []);

  const {
    messages,
    status,
    stop,
    sendMessage,
    setMessages,
    addToolOutput,
    error,
  } = useChat({
    transport,
    messages: initialMsgs,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: async ({ toolCall }) => {
      if (toolCall.toolName === 'navigateToPage') {
        const input = (toolCall as any).input as { path?: string; label?: string };
        if (input?.path) {
          // 只有路径不一致时才触发跳转
          if (location.pathname !== input.path) {
            navigate(input.path);
            toast.success(`已跳转到 ${input.label || input.path}`);
          }
          
          addToolOutput({
            toolCallId: toolCall.toolCallId,
            tool: toolCall.toolName as any,
            state: 'output-available',
            output: { ok: true }
          });
        }
      }
    },
    onError: (err: any) => {
      console.error("[AI SDK Error]", err);
      if (err.status === 401 || err.status === 403) {
        clearAuth();
      } else {
        toast.error("AI 助手连接异常");
      }
    }
  });

  // 手动监控流，防止 SDK 静默丢弃消息
  useEffect(() => {
    if (messages.length > 1) {
      const last = messages[messages.length - 1];
      const content = last.parts?.filter(p => p.type === 'text').map((p: any) => p.text).join('') || '';
      const reasoning = last.parts?.find(p => p.type === 'reasoning') as any;
      
      console.log("[AI SDK State] 最新消息角色:", last.role);
      console.log("[AI SDK State] 最新消息内容长度:", content.length);
      if (reasoning?.text) {
        console.log("[AI SDK State] 收到思考过程:", reasoning.text.length, "字符");
      }
    }
  }, [messages]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const val = input.trim();
    if (!val || status === 'submitted' || status === 'streaming') return;
    
    console.log("[AI SDK Action] 发送消息:", val);
    sendMessage({ text: val });
    setInput('');
  }, [input, sendMessage, status]);

  const isLoading = status === 'submitted' || status === 'streaming';

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    append: (text: string) => sendMessage({ text }),
    isLoading,
    reload: () => setMessages(initialMsgs),
    stop,
    addToolOutput,
    status,
    error,
    configs,
    currentProvider,
    isConfigsLoading,
    switchProvider: switchProviderMutation.mutate,
    isSwitchingProvider: switchProviderMutation.isPending,
    suggestions
  };
}
