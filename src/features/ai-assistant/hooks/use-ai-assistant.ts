import { useNavigate } from "react-router-dom";
import { useMemo, useState, useCallback } from "react";
import { toast } from "@/store/notificationStore";
import { useAuthStore } from "@/store/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAIModelConfigs, setDefaultAIProvider } from "@/services/aiAssistantApi";
import { gatewayOrigin, joinUrl } from "@/config/runtime";
import { useChat, type UIMessage } from "@ai-sdk/react";
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
      headers: {
        'Accept': 'text/event-stream',
      },
      // Custom fetch to handle the project's specific SSE protocol
      fetch: async (url: string | URL | Request, options?: RequestInit) => {
        const response = await fetch(url, {
          ...options,
          credentials: 'include',
        });

        if (response.status === 401 || response.status === 403) {
          console.warn('[AI Assistant] Auth failed, clearing auth');
          clearAuth();
          return response;
        }

        if (!response.ok) return response;

        const reader = response.body?.getReader();
        if (!reader) return response;

        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
          async start(controller) {
            let buffer = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine || !trimmedLine.startsWith('data:')) continue;
                
                const data = trimmedLine.substring(trimmedLine.indexOf(':') + 1).trim();
                if (data === '[DONE]') continue;

                try {
                  const json = JSON.parse(data);
                  
                  // Transform custom protocol to AI SDK Data Stream Protocol
                  // 0: text, b: tool-call, c: tool-result, d: finish, e: error
                  switch (json.type) {
                    case 'text-delta':
                      controller.enqueue(encoder.encode(`0:${JSON.stringify(json.delta)}\n`));
                      break;
                    case 'tool-input-available':
                      controller.enqueue(encoder.encode(`b:${JSON.stringify({
                        toolCallId: json.toolCallId,
                        toolName: json.toolName,
                        args: json.input
                      })}\n`));
                      break;
                    case 'tool-output-available':
                      controller.enqueue(encoder.encode(`c:${JSON.stringify({
                        toolCallId: json.toolCallId,
                        result: json.output
                      })}\n`));
                      break;
                    case 'source-url':
                      // Map source to a data part (type 2)
                      controller.enqueue(encoder.encode(`2:${JSON.stringify([{
                        type: 'source',
                        source: { id: json.sourceId, url: json.url, title: json.title }
                      }])}\n`));
                      break;
                    case 'error':
                      controller.enqueue(encoder.encode(`3:${JSON.stringify(json.errorText)}\n`));
                      break;
                    case 'finish':
                      controller.enqueue(encoder.encode(`d:{"finishReason":"${json.finishReason || 'stop'}"}\n`));
                      break;
                  }
                } catch (e) {
                  console.error('Failed to parse SSE data:', data, e);
                }
              }
            }
            controller.close();
          },
        });

        return new Response(stream, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      },
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

