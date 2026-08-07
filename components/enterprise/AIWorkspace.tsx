"use client"

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Boxes,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Mic,
  Plus,
  ReceiptText,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Upload,
  User,
  AlertTriangle,
  X,
} from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string | null;
  executedAction?: {
    type: 'add_stock';
    item: {
      id: string;
      name: string;
      price: number;
      qty: number;
      category: string;
      image?: string;
    };
  } | null;
  suggestions?: string[];
  timestamp: string;
};

const initialWelcomeMessage: Message = {
  id: 'welcome-1',
  role: 'assistant',
  content: `👋 **Namaste Shopkeeper!** I am your **AI Store Assistant**.\n\nI can perform real shopkeeping tasks for you instantly:\n\n- 📸 **Photo Stock Intake**: Upload a photo of new stock or invoice, tell me price/quantity, and I will add it to your inventory database.\n- ⚠️ **Inventory Alerts**: Ask me *"Which stock items are low?"*\n- 🧾 **Billing Assistance**: Ask me how to create bills, offer discounts, or export reports.\n\nHow can I help your shop today?`,
  suggestions: [
    '📸 Add stock from photo',
    '⚠️ Check low stock items',
    '🧾 How to create a bill',
    '📣 Generate promo poster',
  ],
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export function AIWorkspace({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const isLight = theme === 'light';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([initialWelcomeMessage]);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || inputText;
    if (!textToSend.trim() && !selectedFile && !imagePreview) return;

    const userMsgId = `user-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: textToSend.trim(),
      image: imagePreview,
      timestamp,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    const fileForReq = selectedFile;
    const imgForReq = imagePreview;
    removeSelectedImage();
    setIsLoading(true);

    try {
      let response;
      if (fileForReq) {
        const formData = new FormData();
        formData.append('prompt', textToSend);
        formData.append('image', fileForReq);
        formData.append('history', JSON.stringify(messages.slice(-4).map((m) => ({ role: m.role, content: m.content }))));

        response = await fetch('/api/ai-chat', {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: textToSend,
            image: imgForReq,
            history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
          }),
        });
      }

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get response from AI Copilot');
      }

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        executedAction: data.executedAction,
        suggestions: data.suggestions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `assistant-err-${Date.now()}`,
        role: 'assistant',
        content: `❌ **Error**: ${err.message || 'Unable to connect to AI Assistant. Please check your network or try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (suggestion: string) => {
    if (suggestion.includes('Add stock')) {
      if (fileInputRef.current) fileInputRef.current.click();
    } else {
      sendMessage(suggestion);
    }
  };

  const clearChat = () => {
    setMessages([initialWelcomeMessage]);
    removeSelectedImage();
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-140px)] min-h-[580px] rounded-2xl border overflow-hidden ${
      isLight ? 'border-zinc-200 bg-white text-black' : 'border-zinc-900 bg-black text-white'
    }`}>
      {/* Top Header Bar */}
      <div className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 ${
        isLight ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-900 bg-black'
      }`}>
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
            isLight ? 'border-transparent bg-black text-white' : 'border-zinc-800 bg-white text-black'
          }`}>
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-extrabold tracking-tight">AI Shopkeeper Copilot</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-bold text-emerald-500 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
            <p className={`text-[12px] font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Upload stock photos, add inventory, check stock alerts & manage billing
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={clearChat}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-bold transition ${
            isLight
              ? 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 hover:text-black'
              : 'border-zinc-800 bg-black text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }`}
          title="Clear Chat History"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reset Chat</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                isLight ? 'border-zinc-200 bg-black text-white' : 'border-zinc-800 bg-white text-black'
              }`}>
                <Bot className="h-4 w-4" />
              </span>
            )}

            <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
              {/* Image attachment inside user message if present */}
              {msg.image && (
                <div className="overflow-hidden rounded-xl border border-zinc-700 max-w-xs shadow-md">
                  <img src={msg.image} alt="User attachment" className="w-full h-auto max-h-48 object-cover" />
                </div>
              )}

              {/* Message Content Bubble */}
              <div className={`rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? isLight
                    ? 'bg-black text-white rounded-tr-none'
                    : 'bg-white text-black rounded-tr-none'
                  : isLight
                    ? 'bg-zinc-100 text-black border border-zinc-200 rounded-tl-none'
                    : 'bg-zinc-900 text-white border border-zinc-800 rounded-tl-none'
              }`}>
                <div className="whitespace-pre-wrap font-medium">
                  {msg.content.split('\n').map((line, idx) => (
                    <p key={idx} className={line.startsWith('- ') || line.startsWith('1. ') ? 'mt-1 ml-2' : 'mt-1'}>
                      {line}
                    </p>
                  ))}
                </div>

                <div className={`mt-1.5 text-right text-[10px] ${
                  msg.role === 'user'
                    ? isLight ? 'text-zinc-300' : 'text-zinc-600'
                    : isLight ? 'text-zinc-400' : 'text-zinc-500'
                }`}>
                  {msg.timestamp}
                </div>
              </div>

              {/* Special Executed Action Card (e.g. Stock Added Card) */}
              {msg.executedAction?.type === 'add_stock' && (
                <div className={`rounded-2xl border p-3.5 shadow-md ${
                  isLight ? 'border-emerald-200 bg-emerald-50/60 text-black' : 'border-emerald-500/30 bg-emerald-500/10 text-white'
                }`}>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[12.5px] font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Database Action Executed: Item Added to Stock</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border p-2.5 bg-black/5 dark:bg-black/40 border-emerald-500/20">
                    <div className="flex items-center gap-3 min-w-0">
                      {msg.executedAction.item.image ? (
                        <img src={msg.executedAction.item.image} alt={msg.executedAction.item.name} className="h-11 w-11 rounded-lg object-cover border border-emerald-500/30 shrink-0" />
                      ) : (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                          <Boxes className="h-5 w-5" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-bold">{msg.executedAction.item.name}</div>
                        <div className="text-[11.5px] font-semibold text-emerald-600 dark:text-emerald-300">
                          Qty: {msg.executedAction.item.qty} units • ₹{msg.executedAction.item.price}/ea
                        </div>
                      </div>
                    </div>

                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-300 shrink-0">
                      {msg.executedAction.item.category}
                    </span>
                  </div>
                </div>
              )}

              {/* Suggestions Quick Buttons */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {msg.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleQuickAction(suggestion)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11.5px] font-bold transition shadow-sm ${
                        isLight
                          ? 'border-zinc-300 bg-white text-black hover:bg-black hover:text-white'
                          : 'border-zinc-800 bg-zinc-900 text-white hover:bg-white hover:text-black'
                      }`}
                    >
                      <span>{suggestion}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                isLight ? 'border-zinc-200 bg-zinc-100 text-black' : 'border-zinc-800 bg-zinc-900 text-white'
              }`}>
                <User className="h-4 w-4" />
              </span>
            )}
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex gap-3 items-center text-zinc-400 text-[12.5px] font-semibold">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
              isLight ? 'border-zinc-200 bg-black text-white' : 'border-zinc-800 bg-white text-black'
            }`}>
              <Bot className="h-4 w-4 animate-spin" />
            </span>
            <div className="flex items-center gap-2 rounded-2xl px-4 py-2 bg-zinc-900/40 border border-zinc-800">
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>Analyzing & processing shop request...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Selected Image Thumbnail Bar */}
      {imagePreview && (
        <div className={`flex items-center justify-between gap-3 px-4 py-2 border-t shrink-0 ${
          isLight ? 'border-zinc-200 bg-zinc-100' : 'border-zinc-900 bg-zinc-950'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <img src={imagePreview} alt="Preview" className="h-10 w-10 rounded-lg object-cover border border-zinc-700 shrink-0" />
            <div className="min-w-0">
              <div className="truncate text-[12px] font-bold">{selectedFile?.name || 'Uploaded Stock Image'}</div>
              <div className="text-[10.5px] font-medium text-emerald-500">Ready for AI stock intake & analysis</div>
            </div>
          </div>

          <button
            type="button"
            onClick={removeSelectedImage}
            className="rounded-full p-1 text-zinc-400 hover:bg-red-500/20 hover:text-red-400 transition"
            title="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Bottom Input Dock */}
      <div className={`p-3 border-t shrink-0 ${
        isLight ? 'border-zinc-200 bg-white' : 'border-zinc-900 bg-black'
      }`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* File Input (Hidden) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          />

          {/* Upload Image Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
              imagePreview
                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                : isLight
                  ? 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-black'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
            title="Upload stock photo or invoice snapshot"
          >
            <ImageIcon className="h-5 w-5" />
          </button>

          {/* Text Input */}
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              imagePreview
                ? "Type details e.g. 'Add to stock, price ₹150, qty 20'..."
                : "Ask AI Assistant or type e.g. 'Add 15 Cadbury Silk at ₹120'..."
            }
            className={`flex-1 h-11 rounded-xl border px-4 text-base md:text-[13.5px] font-semibold outline-none transition ${
              isLight
                ? 'border-zinc-200 bg-zinc-50 text-black placeholder:text-zinc-400 focus:ring-1 focus:ring-black'
                : 'border-zinc-800 bg-black text-white placeholder:text-zinc-500 focus:ring-1 focus:ring-white'
            }`}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedFile && !imagePreview) || isLoading}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-[13.5px] font-bold transition border-0 ${
              isLight
                ? 'bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400'
                : 'bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500'
            }`}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}