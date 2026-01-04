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
      toast.success("AI 引擎切换成功");
    },
    onError: (err: any) => {
      toast.error(err.message || "切换引擎失败");
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
      let receivedDone = false;

      const flushTyping = () => {
        typingRaf = null;
        if (!typingPending && receivedDone) return;

        // Typewriter effect: reveal a small slice per frame.
        // During streaming, we keep it slow and steady. 
        // After stream ends, we speed up slightly to finish the buffer.
        const step = receivedDone 
          ? Math.max(3, Math.ceil(typingPending.length / 10)) 
          : Math.max(1, Math.min(3, Math.ceil(typingPending.length / 30)));
          
        const slice = typingPending.slice(0, step);
        typingPending = typingPending.slice(step);
        visibleText += slice;

        if (slice || (receivedDone && typingPending.length === 0)) {
          setMessages(prev => prev.map(m =>
            m.id === assistantMsgId ? { ...m, content: visibleText } : m
          ));
        }

        if (typingPending || !receivedDone) {
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
              
              switch (chunk.type) {
                case 'text-delta':
                  if (chunk.delta) {
                    enqueueDelta(String(chunk.delta));
                  }
                  break;
                
                case 'tool-input-available':
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
                  
                  if (chunk.toolName === 'navigateToPage' && chunk.input?.path) {
                    navigate(chunk.input.path);
                    toast.success(`已为你跳转到 ${chunk.input.label || chunk.input.path}`);
                  }
                  break;

                case 'tool-output-available':
                  setMessages(prev => prev.map(m => 
                    m.id === assistantMsgId ? {
                      ...m, 
                      toolInvocations: (m.toolInvocations || []).map((ti: any) => 
                        ti.toolCallId === chunk.toolCallId ? { ...ti, state: 'result', result: chunk.output } : ti
                      )
                    } : m
                  ));
                  break;

                case 'source-url':
                  setData(prev => [...prev, chunk]);
                  break;

                case 'error':
                  toast.error(chunk.errorText || "AI 出错啦");
                  break;

                case 'finish':
                  if (chunk.quota) {
                    setData(prev => [...prev, chunk]);
                  }
                  break;
              }
            } catch (e) {
              console.error("Parse error", e);
            }
          }

          if (receivedDone) break;
        }
      }

      // Signal end of stream to flushTyping and finalize reasoning
      receivedDone = true;
      const tail = outputFilter.flush();
      if (tail.reasoning) reasoningText += tail.reasoning;
      if (tail.text) typingPending += tail.text;
      
      if (typingRaf === null) {
        typingRaf = requestAnimationFrame(flushTyping);
      }

      // Ensure final state is correctly resolved after typing finishes
      const finalizeMessage = () => {
        if (typingPending.length > 0) {
          setTimeout(finalizeMessage, 100);
          return;
        }
        
        const finalReasoning = reasoningText.trim();
        if (finalReasoning) {
          setMessages(prev => prev.map(m => (
            m.id === assistantMsgId
              ? {
                  ...m,
                  reasoning: finalReasoning,
                  content: visibleText.trim() ? m.content : "（模型返回了思考内容，但没有给出最终回答）"
                }
              : m
          )));
        }
      };
      finalizeMessage();
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
        } else {
          tagBuffer += ch;
          if (ch === '>') {
            if (isThinkStart(tagBuffer)) {
              inThink = true;
            } else if (isThinkEnd(tagBuffer)) {
              inThink = false;
            } else if (!isFinalTag(tagBuffer)) {
              // If it's not a recognized control tag, treat it as normal text/reasoning
              if (inThink) outReasoning += tagBuffer;
              else outText += tagBuffer;
            }
            inTag = false;
            tagBuffer = '';
          } else if (tagBuffer.length > 128) {
            // Safety fallback for malformed tags or very long unexpected < sequences
            if (inThink) outReasoning += tagBuffer;
            else outText += tagBuffer;
            inTag = false;
            tagBuffer = '';
          }
        }
      }
      return { text: outText, reasoning: outReasoning };
    },
    flush() {
      if (!inTag || !tagBuffer) return { text: '', reasoning: '' };
      const tailTag = tagBuffer;
      inTag = false;
      tagBuffer = '';
      
      // If we were in the middle of a tag when flushed, check if it was a control tag
      if (isThinkStart(tailTag)) {
        inThink = true;
        return { text: '', reasoning: '' };
      }
      if (isThinkEnd(tailTag)) {
        inThink = false;
        return { text: '', reasoning: '' };
      }
      if (isFinalTag(tailTag)) {
        return { text: '', reasoning: '' };
      }
      
      return inThink ? { text: '', reasoning: tailTag } : { text: tailTag, reasoning: '' };
    },
  };
}
