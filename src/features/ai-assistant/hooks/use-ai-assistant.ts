import { useNavigate } from "react-router-dom";
import { useMemo, useRef, useState } from "react";
import { toast } from "@/store/notificationStore";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAIModelConfigs, setDefaultAIProvider } from "@/services/aiAssistantApi";

export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'data' | 'tool';
  content: string;
  reasoning?: string;
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
  const [streamingAssistantId, setStreamingAssistantId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  const cancelCurrent = () => {
    try {
      abortRef.current?.abort();
    } catch {
      // ignore
    } finally {
      abortRef.current = null;
    }
  };

  const handleSubmit = async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    if (!input.trim() || status === 'streaming') return;

    cancelCurrent();

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
    setStreamingAssistantId(assistantMsgId);
    const newAssistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      toolInvocations: []
    };
    setMessages(prev => [...prev, newAssistantMessage]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const outputFilter = createAssistantOutputFilter();
      let typingPending = '';
      let typingRaf: number | null = null;
      let visibleText = '';
      let reasoningText = '';

      const flushTyping = () => {
        typingRaf = null;
        if (!typingPending) return;

        // Typewriter effect: reveal a small slice per frame.
        const step = Math.max(8, Math.min(64, Math.ceil(typingPending.length / 16)));
        const slice = typingPending.slice(0, step);
        typingPending = typingPending.slice(step);
        visibleText += slice;

        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId ? { ...m, content: visibleText } : m
        ));

        if (typingPending) {
          typingRaf = requestAnimationFrame(flushTyping);
        }
      };

      const enqueueDelta = (delta: string) => {
        if (!delta) return;
        const { text, reasoning } = outputFilter.feed(delta);
        if (reasoning) reasoningText += reasoning;
        if (text) typingPending += text;
        if (typingRaf == null) {
          typingRaf = requestAnimationFrame(flushTyping);
        }
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })) 
        }),
        credentials: 'include',
        signal: controller.signal
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let receivedDone = false;

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
            if (dataStr === '[DONE]') {
              receivedDone = true;
              break;
            }

            try {
              const chunk = JSON.parse(dataStr);
              
              if (chunk.type === 'text-delta' && chunk.delta) {
                enqueueDelta(String(chunk.delta));
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

          if (receivedDone) {
            break;
          }
        }
      }

      // Flush remaining buffered text and strip any incomplete tag fragments.
      const tail = outputFilter.flush();
      if (tail.reasoning) reasoningText += tail.reasoning;
      if (tail.text) typingPending += tail.text;

      if (typingRaf != null) {
        cancelAnimationFrame(typingRaf);
        typingRaf = null;
      }
      if (typingPending) {
        visibleText += typingPending;
        setMessages(prev => prev.map(m => (m.id === assistantMsgId ? { ...m, content: visibleText } : m)));
      }

      const finalReasoning = reasoningText.trim();
      const finalContent = visibleText.trim();
      if (finalReasoning) {
        setMessages(prev => prev.map(m => (
          m.id === assistantMsgId
            ? {
                ...m,
                reasoning: finalReasoning,
                content: finalContent ? m.content : "（模型返回了思考内容，但没有给出最终回答）"
              }
            : m
        )));
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error("Chat error:", err);
        toast.error("呼叫助手失败，请稍后再试");
      }
    } finally {
      abortRef.current = null;
      setStatus('idle');
      setStreamingAssistantId(null);
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
    streamingAssistantId,
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

function createAssistantOutputFilter() {
  let inTag = false;
  let tagBuffer = '';
  let inThink = false;

  const normalizeTag = (tag: string) => tag.replace(/\s+/g, '').toLowerCase();
  const isThinkStart = (tag: string) => normalizeTag(tag) === '<think>';
  const isThinkEnd = (tag: string) => normalizeTag(tag) === '</think>';
  const isFinalTag = (tag: string) => {
    const normalized = normalizeTag(tag);
    return normalized === '<final>' || normalized === '</final>';
  };

  return {
    feed(text: string) {
      if (!text) return { text: '', reasoning: '' };
      let outText = '';
      let outReasoning = '';
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (!inTag) {
          if (ch === '<') {
            inTag = true;
            tagBuffer = '<';
          } else {
            if (inThink) outReasoning += ch;
            else outText += ch;
          }
          continue;
        }

        tagBuffer += ch;
        if (ch === '>') {
          if (isThinkStart(tagBuffer)) {
            inThink = true;
          } else if (isThinkEnd(tagBuffer)) {
            inThink = false;
          } else if (!isFinalTag(tagBuffer)) {
            if (inThink) outReasoning += tagBuffer;
            else outText += tagBuffer;
          }
          inTag = false;
          tagBuffer = '';
        } else if (tagBuffer.length > 64) {
          // Safety fallback for malformed tags.
          if (inThink) outReasoning += tagBuffer;
          else outText += tagBuffer;
          inTag = false;
          tagBuffer = '';
        }
      }
      return { text: outText, reasoning: outReasoning };
    },
    flush() {
      if (!inTag || !tagBuffer) return { text: '', reasoning: '' };
      const tailTag = tagBuffer;
      const normalized = normalizeTag(tailTag);
      if (normalized === '<think>') inThink = true;
      if (normalized === '</think>') inThink = false;
      const shouldDrop = isThinkStart(tailTag) || isThinkEnd(tailTag) || isFinalTag(tailTag);
      inTag = false;
      tagBuffer = '';
      if (shouldDrop) return { text: '', reasoning: '' };
      return inThink ? { text: '', reasoning: tailTag } : { text: tailTag, reasoning: '' };
    },
  };
}
