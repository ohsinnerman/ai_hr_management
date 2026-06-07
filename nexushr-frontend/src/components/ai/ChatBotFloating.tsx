'use client';

import { useRef, useEffect, useState, KeyboardEvent } from 'react';
import { Sparkles, X, Send, Loader2, Trash2, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useChatBotStore } from '@/lib/store/chatBotStore';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ChatBotFloating() {
  const {
    isOpen, toggle, close, messages, addMessage, updateLastMessage,
    setLoading, clearMessages, sessionId, isLoading,
  } = useChatBotStore();
  const { accessToken } = useAuthStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uuid = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const history = messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', content: m.content }));

    addMessage({ id: uuid(), role: 'user', content: userMessage });
    addMessage({ id: uuid(), role: 'assistant', content: '', isStreaming: true });
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ message: userMessage, sessionId, history }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      let sources: Array<{ title: string; score?: number }> = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullText += parsed.text;
              updateLastMessage(fullText);
            }
            if (parsed.type === 'sources') {
              sources = parsed.documents;
              updateLastMessage(fullText || 'Here is what I found.', sources);
            }
            if (parsed.type === 'error') {
              updateLastMessage('I apologize, but I encountered an error. Please try again.');
            }
          } catch {
            /* skip malformed chunks */
          }
        }
      }
      if (!fullText) updateLastMessage('I could not generate a response. Please try again.', sources);
    } catch {
      updateLastMessage('Connection error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Trigger */}
      <button
        onClick={toggle}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg shadow-accent/30 bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center',
          'transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-accent/40',
          isOpen && 'scale-90 opacity-80'
        )}
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <Sparkles className="w-6 h-6 text-white animate-pulse-slow" />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[600px] max-h-[80vh] flex flex-col rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-slide-up bg-white">
          {/* Header */}
          <div className="gradient-primary px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">NexusHR Assistant</p>
              <p className="text-xs text-white/60">Powered by Gemini AI</p>
            </div>
            <Button variant="ghost" size="icon" onClick={clearMessages} className="w-8 h-8 p-0 text-white/60 hover:text-white hover:bg-white/10" title="Clear conversation">
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={close} className="w-8 h-8 p-0 text-white/60 hover:text-white hover:bg-white/10">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-surface-2 p-4 space-y-4" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Sparkles className="w-10 h-10 text-primary/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted">How can I help you today?</p>
                <p className="text-xs text-muted/60 mt-1">Ask about leaves, payroll, policies, or HR queries</p>
                <div className="grid grid-cols-1 gap-2 mt-4">
                  {['What is my leave balance?', 'When was my last payslip?', 'How many sick leaves do I have?'].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => {
                        setInput(prompt);
                        inputRef.current?.focus();
                      }}
                      className="text-left text-xs bg-white border border-primary/10 rounded-lg px-3 py-2 text-primary hover:bg-primary/5 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={cn('flex gap-2', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                {message.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
                    message.role === 'user'
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                  )}
                >
                  {message.isStreaming && !message.content ? (
                    <div className="flex gap-1 items-center h-5">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )}

                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-muted font-medium mb-1">Sources:</p>
                      {message.sources.map((src, i) => (
                        <p key={i} className="text-xs text-primary/70">• {src.title}</p>
                      ))}
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0 mt-1">
                    <User className="w-3.5 h-3.5 text-primary-dark" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-100 p-3 flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about leaves, payroll, policies..."
              className="flex-1 text-sm bg-surface-2 border-transparent focus:border-primary/30 focus:bg-white"
              disabled={isLoading}
            />
            <Button onClick={sendMessage} disabled={!input.trim() || isLoading} className="shrink-0 gradient-primary w-9 h-9 p-0">
              {isLoading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
