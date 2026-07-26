import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { aiAssistant } from '../../lib/gemini';
import { Product } from '../../types';
import { Sparkles, X, Send, Bot, User, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct?: (product: Product) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  recommendedProducts?: Product[];
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}) => {
  if (!isOpen) return null;

  const { addToCart } = useCart();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: 'Greetings! I am AURA AI, your personal luxury concierge and stylist. How can I assist your shopping journey today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const QUICK_PROMPTS = [
    'Find noise-cancelling spatial headphones',
    'Recommend a luxury gift under $500',
    'Suggest futuristic urban footwear',
    'Show me Swiss mechanical chronographs',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = { id: `msg-${Date.now()}`, sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Call Gemini AI Stylist Chat
    const chatHistory = messages.map((m) => ({
      role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
      text: m.text,
    }));

    const responseText = await aiAssistant.chatWithStylist(query, chatHistory, products);

    // Also get matched products
    const matchedProducts = await aiAssistant.smartSearch(query, products);

    const aiMsg: Message = {
      id: `msg-${Date.now() + 1}`,
      sender: 'ai',
      text: responseText,
      recommendedProducts: matchedProducts.slice(0, 2),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Floating AI Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl h-[650px] max-h-[85vh] glass-panel rounded-3xl p-5 sm:p-6 flex flex-col z-10 shadow-2xl border border-white/20 dark:border-white/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF6B35] to-amber-500 flex items-center justify-center text-white shadow-lg shadow-[#FF6B35]/30">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  AURA AI Concierge <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF6B35]/20 text-[#FF6B35] font-semibold">Gemini Powered</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Personal Stylist & Smart Catalog Guide</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-[#FF6B35] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 no-scrollbar">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-[#FF6B35]/20 text-[#FF6B35] flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#FF6B35] text-white shadow-md'
                      : 'glass-panel border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <p>{m.text}</p>

                  {/* Recommended Products Embed */}
                  {m.recommendedProducts && m.recommendedProducts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/40 dark:border-slate-800/60 flex flex-col gap-2">
                      <p className="text-[11px] font-bold tracking-wider uppercase text-[#FF6B35]">
                        Curated Recommendations:
                      </p>
                      {m.recommendedProducts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 p-2 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800"
                        >
                          <img src={p.images[0]} alt={p.title} className="w-12 h-12 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-xs line-clamp-1 text-slate-900 dark:text-white">
                              {p.title}
                            </h5>
                            <p className="text-xs font-bold text-[#FF6B35]">${p.price.toFixed(2)}</p>
                          </div>
                          <button
                            onClick={() => {
                              addToCart(p, 1);
                              onClose();
                            }}
                            className="p-2 rounded-lg bg-[#FF6B35] text-white hover:bg-[#E85A24] transition-colors shrink-0"
                            title="Add to Cart"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {m.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-[#FF6B35] font-medium animate-pulse">
                <Bot className="w-4 h-4" /> AURA AI is analyzing recommendations...
              </div>
            )}
          </div>

          {/* Quick Prompt Pills */}
          <div className="py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSend(qp)}
                className="px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap glass-pill text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-[#FF6B35] transition-colors shrink-0"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask AURA AI for recommendations or styling..."
              className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B35]"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="p-3 rounded-2xl bg-[#FF6B35] text-white hover:bg-[#E85A24] transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
