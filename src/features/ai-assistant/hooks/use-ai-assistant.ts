import { useNavigate } from "react-router-dom";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { toast } from "@/store/notificationStore";
import apiClient from "@/services/apiClient";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAIModelConfigs, setDefaultAIProvider, type AIModelConfig } from "@/services/aiAssistantApi";

export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'data' | 'tool';
  content: string;
  toolInvocations?: any[];
}

export function useAIAssistant() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init-1",
      role: "assistant",
      content: "你好！我是 Prism Cloud AI 助手。我可以帮你快速导航、查看状态或解答疑问。试着对我说：'带我去设备列表' 或 '帮我分析离线设备'",
    },
  ]);
  const [status, setStatus] = useState<'idle' | 'streaming'>('idle');

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    if (!input.trim() || status === 'streaming') return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setData([]);
    setStatus('streaming');

    const assistantMsgId = (Date.now() + 1).toString();
    const newAssistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      toolInvocations: []
    };
    setMessages(prev => [...prev, newAssistantMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })) 
        }),
        credentials: 'include'
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith('data:')) continue;

            const dataStr = trimmedLine.replace(/^data:\s*/, '');
            if (dataStr === '[DONE]') break;

            try {
              const chunk = JSON.parse(dataStr);
              
              if (chunk.type === 'text-delta' && chunk.delta) {
                setMessages(prev => prev.map(m => 
                  m.id === assistantMsgId ? { ...m, content: m.content + chunk.delta } : m
                ));
              } 
              else if (chunk.type === 'tool-input-available') {
                setMessages(prev => prev.map(m => 
                  m.id === assistantMsgId ? {
                    ...m, 
                    toolInvocations: [
                      ...(m.toolInvocations || []),
                      {
                        toolCallId: chunk.toolCallId,
                        toolName: chunk.toolName,
                        args: chunk.input,
                        state: 'call'
                      }
                    ]
                  } : m
                ));
                
                // Handle client-side navigation tool
                if (chunk.toolName === 'navigateToPage' && chunk.input?.path) {
                  navigate(chunk.input.path);
                  toast.success(`已为你跳转到 ${chunk.input.label || chunk.input.path}`);
                }
              }
              else if (chunk.type === 'tool-output-available') {
                setMessages(prev => prev.map(m => 
                  m.id === assistantMsgId ? {
                    ...m, 
                    toolInvocations: (m.toolInvocations || []).map((ti: any) => 
                      ti.toolCallId === chunk.toolCallId ? { ...ti, state: 'result', result: chunk.output } : ti
                    )
                  } : m
                ));
              }
              else if (chunk.type === 'source-url') {
                setData(prev => [...prev, chunk]);
              }
              else if (chunk.type === 'error') {
                toast.error(chunk.errorText || "AI 出错啦");
              }
              else if (chunk.type === 'finish' && chunk.quota) {
                setData(prev => [...prev, chunk]);
              }
            } catch (e) {
              console.error("Parse error", e);
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      toast.error("呼叫助手失败，请稍后再试");
    } finally {
      setStatus('idle');
    }
  };

  const reload = () => {
    if (messages.length < 2) return;
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      const lastUserIdx = messages.indexOf(lastUserMessage);
      setMessages(prev => prev.slice(0, lastUserIdx));
      setInput(lastUserMessage.content);
    }
  };

  return {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading: status === 'streaming',
    reload,
    data,
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
