import { create } from 'zustand';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ title: string; score?: number }>;
  isStreaming?: boolean;
}

interface ChatBotState {
  isOpen: boolean;
  messages: ChatMessage[];
  sessionId: string;
  isLoading: boolean;

  toggle: () => void;
  open: () => void;
  close: () => void;
  addMessage: (message: ChatMessage) => void;
  updateLastMessage: (content: string, sources?: ChatMessage['sources']) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

const newSessionId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

export const useChatBotStore = create<ChatBotState>((set) => ({
  isOpen: false,
  messages: [],
  sessionId: newSessionId(),
  isLoading: false,

  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),

  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  updateLastMessage: (content, sources) =>
    set((state) => {
      const messages = [...state.messages];
      const last = messages[messages.length - 1];
      if (last) messages[messages.length - 1] = { ...last, content, sources, isStreaming: false };
      return { messages };
    }),

  setLoading: (isLoading) => set({ isLoading }),
  clearMessages: () => set({ messages: [], sessionId: newSessionId() }),
}));

export type { ChatMessage };
