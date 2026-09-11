/**
 * components/AIAssistant.jsx
 * KrushiMitra AI — Floating AI Chat Assistant
 * Triggered by F1 key or the floating button
 * Queries /api/ai/chat with live business context
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Loader2, Sparkles, ChevronDown, Trash2 } from 'lucide-react';
import api from '../services/api';

const SUGGESTIONS = [
  "What are today's total sales?",
  "Which products are low on stock?",
  "Who has the highest outstanding balance?",
  "What are the top selling products this month?",
  "Show me products near expiry",
  "Give me a profit summary",
];

const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '🌱 Hello! I\'m your KrushiMitra AI assistant. I have real-time access to your shop data — sales, inventory, customers, suppliers, and more. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Listen for F1 global event to toggle
  useEffect(() => {
    const handler = () => setOpen(o => !o);
    window.addEventListener('toggle-ai-assistant', handler);
    return () => window.removeEventListener('toggle-ai-assistant', handler);
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // api interceptor returns response.data (the server body: { success, data: { reply, ... } })
      // Destructuring { data } gives us the inner data object { reply, tokensUsed, model }
      const result = await api.post('/ai/chat', { messages: newMessages, stream: false });
      const reply = result?.data?.reply || result?.reply;
      if (!reply) throw new Error('No reply received');
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const errMsg = err.response?.status === 503 || err.message?.includes('not configured')
        ? '⚠️ AI backend is not reachable. Make sure the backend server is running.'
        : `❌ ${err.message || 'Failed to get a response. Please try again.'}`;
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: '🌱 Chat cleared! How can I help you?' }]);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-600 text-content shadow-lg shadow-primary-500/30 flex items-center justify-center"
        title="AI Assistant (F1)"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="h-6 w-6" /></motion.div>
            : <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Bot className="h-6 w-6" /></motion.div>
          }
        </AnimatePresence>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-40 w-[380px] max-h-[580px] flex flex-col glass-panel rounded-2xl border border-border-color shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-color bg-gradient-to-r from-primary-500/10 to-emerald-500/5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary-500 to-emerald-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-content" />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">KrushiMitra AI</p>
                  <p className="text-[10px] text-primary-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse" />
                    Live Business Data
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={clearChat} className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-secondary transition-colors" title="Clear chat">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-secondary transition-colors">
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="h-6 w-6 rounded-lg bg-primary-500/20 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                      <Sparkles className="h-3 w-3 text-primary-400" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary-500/20 text-text-primary border border-primary-500/20'
                      : 'bg-bg-secondary text-text-primary border border-border-color'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="h-6 w-6 rounded-lg bg-primary-500/20 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                    <Sparkles className="h-3 w-3 text-primary-400" />
                  </div>
                  <div className="bg-bg-secondary border border-border-color rounded-xl px-4 py-2.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Suggestions (show only at start) */}
            {messages.length <= 1 && (
              <div className="px-4 pb-3 flex flex-wrap gap-1.5 shrink-0">
                {SUGGESTIONS.slice(0, 3).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-primary-500/10 text-primary-400 border border-primary-500/20 hover:bg-primary-500/20 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border-color shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask about your business..."
                  className="flex-1 px-3 py-2.5 rounded-xl bg-bg-secondary border border-border-color text-text-primary text-sm placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  disabled={loading}
                />
                <motion.button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  whileTap={{ scale: 0.95 }}
                  className="h-10 w-10 rounded-xl bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:pointer-events-none shrink-0"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </motion.button>
              </div>
              <p className="text-[10px] text-text-secondary mt-1.5 text-center">Press F1 to toggle • Enter to send</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
