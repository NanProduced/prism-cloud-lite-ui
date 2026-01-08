import { useNavigate, useLocation } from "react-router-dom";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { toast } from "@/store/notificationStore";
import { useAuthStore } from "@/store/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAIModelConfigs, setDefaultAIProvider } from "@/services/aiAssistantApi";
import { gatewayOrigin, joinUrl } from "@/config/runtime";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

function getToolNameFromPart(part: any): string | null {
  if (!part || typeof part !== 'object') return null;
  if (part.type === 'dynamic-tool') return String(part.toolName || '');
  if (typeof part.type === 'string' && part.type.startsWith('tool-')) return part.type.slice('tool-'.length);
  return null;
}

function isToolPart(part: any): boolean {
  return !!getToolNameFromPart(part);
}

function isCompletedToolPart(part: any): boolean {
  return part?.state === 'output-available' || part?.state === 'output-error';
}

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

  /**
   * Guard against infinite resend loops when the backend emits tool parts without:
   * - `providerExecuted: true` for server-executed tools, and/or
   * - `step-start` boundaries (so AI SDK can't isolate the "last step").
   *
   * We only auto-resubmit after *client-side* tools that require a second roundtrip.
   */
  const autoResendSignatureRef = useRef<string>('');
  const sendAutomaticallyWhen = useCallback(({ messages }: { messages: UIMessage[] }) => {
    const lastMessage = messages[messages.length - 1] as any;
    if (!lastMessage || lastMessage.role !== 'assistant') return false;

    const parts: any[] = Array.isArray(lastMessage.parts) ? lastMessage.parts : [];
    if (parts.length === 0) return false;

    const clientToolsNeedingResubmit = new Set([
      'pickDevice',
      'pickCommandLog',
    ]);

    const relevantToolParts = parts
      .map((part, index) => ({ part, index, toolName: getToolNameFromPart(part) }))
      .filter(({ toolName }) => !!toolName && clientToolsNeedingResubmit.has(toolName))
      .filter(({ part }) => !part?.providerExecuted);

    if (relevantToolParts.length === 0) return false;
    if (!relevantToolParts.every(({ part }) => isCompletedToolPart(part))) return false;

    const lastToolIndex = Math.max(...relevantToolParts.map(({ index }) => index));
    const hasAssistantTextAfterTools = parts
      .slice(lastToolIndex + 1)
      .some((p) => p?.type === 'text' && typeof p.text === 'string' && p.text.trim().length > 0);

    if (hasAssistantTextAfterTools) return false;

    const signature = [
      lastMessage.id,
      relevantToolParts
        .map(({ part, toolName }) => `${toolName}:${part.toolCallId ?? ''}:${part.state ?? ''}`)
        .sort()
        .join('|'),
    ].join('::');

    if (autoResendSignatureRef.current === signature) return false;
    autoResendSignatureRef.current = signature;
    return true;
  }, []);

  const {
    messages,
    status,
    stop,
    sendMessage,
    regenerate,
    setMessages,
    addToolOutput,
    error,
  } = useChat({
    transport,
    messages: initialMsgs,
    sendAutomaticallyWhen,
    onToolCall: async ({ toolCall }) => {
      if (toolCall.toolName === 'navigateToPage') {
        const input = (toolCall as any).input as { path?: string; label?: string } | undefined;

        if (!input?.path) {
          addToolOutput({
            toolCallId: toolCall.toolCallId,
            tool: toolCall.toolName as any,
            state: 'output-error',
            errorText: 'navigateToPage 缺少 path',
          });
          return;
        }

        try {
          // 只有路径不一致时才触发跳转
          if (location.pathname !== input.path) {
            navigate(input.path);
            toast.success(`已跳转到 ${input.label || input.path}`);
          }

          addToolOutput({
            toolCallId: toolCall.toolCallId,
            tool: toolCall.toolName as any,
            state: 'output-available',
            output: { ok: true },
          });
        } catch (e: any) {
          addToolOutput({
            toolCallId: toolCall.toolCallId,
            tool: toolCall.toolName as any,
            state: 'output-error',
            errorText: e?.message || '页面跳转失败',
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
    if (!import.meta.env.DEV) return;
    if (messages.length > 1) {
      const last = messages[messages.length - 1];
      const content = last.parts?.filter(p => p.type === 'text').map((p: any) => p.text).join('') || '';
      const reasoning = last.parts?.find(p => p.type === 'reasoning') as any;
      const toolParts = (last.parts || []).filter(isToolPart);
      
      console.log("[AI SDK State] 最新消息角色:", last.role);
      console.log("[AI SDK State] 最新消息内容长度:", content.length);
      if (reasoning?.text) {
        console.log("[AI SDK State] 收到思考过程:", reasoning.text.length, "字符");
      }
      if (toolParts.length > 0) {
        console.log(
          "[AI SDK State] 工具 parts:",
          toolParts.map((p: any) => ({
            type: p.type,
            toolName: getToolNameFromPart(p),
            toolCallId: p.toolCallId,
            state: p.state,
            providerExecuted: p.providerExecuted,
          }))
        );
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
    clearConversation: () => setMessages(initialMsgs),
    regenerateLast: () => regenerate(),
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
