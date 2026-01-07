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

  // 动态生成欢迎语和建议词 (基于后端 SDK 6 确定性触发列表)
  const { initialMessages, suggestions } = useMemo(() => {
    const hour = new Date().getHours();
    let greeting = "你好";
    if (hour < 9) greeting = "早上好";
    else if (hour < 12) greeting = "上午好";
    else if (hour < 14) greeting = "中午好";
    else if (hour < 18) greeting = "下午好";
    else greeting = "晚上好";

    const userName = user?.displayName || user?.publicId || "";
    const welcomePrefix = `${greeting}${userName ? `, ${userName}` : ""}！我是 Prism Cloud AI 助手。`;
    
    let contextTip = "我可以帮你快速导航、查看状态或解答疑问。";
    
    // 全局通用按钮
    const globalChips = [
      { label: "带我去设备列表 ✅", prompt: "带我去设备列表" },
      { label: "带我去节目 ✅", prompt: "带我去节目" },
      { label: "离线设备概览 ✅", prompt: "[[fleet:true]] 帮我分析离线设备" }
    ];
    
    let chips = [...globalChips];
    
    // 根据当前路径给出定制建议
    if (location.pathname.includes('/devices')) {
      contextTip = "发现你正在查看设备列表，需要我帮你分析特定设备的离线原因吗？";
      chips = [
        { label: "分析设备离线原因 ✅", prompt: "分析设备离线原因" },
        { label: "离线设备概览 ✅", prompt: "[[fleet:true]] 帮我分析离线设备" },
        { label: "带我去节目 ✅", prompt: "带我去节目" }
      ];
    } else if (location.pathname.includes('/logs')) {
      contextTip = "我可以帮你排查特定的指令执行记录，或分析失败原因。";
      chips = [
        { label: "排查指令未生效 ✅", prompt: "排查指令为什么没生效" },
        { label: "指令失败概览 ◇", prompt: "查询最近24小时失败的指令并总结Top原因" },
        { label: "打开帮助中心 ✅", prompt: "打开帮助中心" }
      ];
    } else if (location.pathname.includes('/studio') || location.pathname.includes('/programs')) {
      contextTip = "需要我解释如何创建节目，或者检查排期吗？";
      chips = [
        { label: "怎么创建节目？ ◇", prompt: "怎么创建节目？" },
        { label: "打开监控 ✅", prompt: "打开监控" },
        { label: "带我去设备列表 ✅", prompt: "带我去设备列表" }
      ];
    } else if (location.pathname.includes('/dashboard')) {
      contextTip = "需要我为您分析全量设备的离线情况或运行概览吗？";
      chips = [
        { label: "离线设备概览 ✅", prompt: "[[fleet:true]] 帮我分析离线设备" },
        { label: "打开监控 ✅", prompt: "打开监控" },
        { label: "带我去节目 ✅", prompt: "带我去节目" }
      ];
    }

    const fullText = `${welcomePrefix}${contextTip}`;

    const initialMsgs: UIMessage[] = [
      {
        id: "init-1",
        role: "assistant",
        parts: [{ type: 'text', text: fullText }]
      },
    ];

    return {
      initialMessages: initialMsgs,
      suggestions: chips
    };
  }, [user?.displayName, user?.publicId, location.pathname]);

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
  } = useChat({
    transport,
    messages: initialMessages,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: async ({ toolCall }) => {
      if (toolCall.toolName === 'navigateToPage') {
        const input = (toolCall as any).input as { path?: string; label?: string };
        if (input?.path) {
          navigate(input.path);
          toast.success(`已跳转到 ${input.label || input.path}`);
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
    reload: () => setMessages(initialMessages),
    stop,
    addToolOutput,
    status,
    configs,
    currentProvider,
    isConfigsLoading,
    switchProvider: switchProviderMutation.mutate,
    isSwitchingProvider: switchProviderMutation.isPending,
    suggestions
  };
}
