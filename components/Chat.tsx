import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { User } from '../types';
import { Send, Globe, Loader2 } from 'lucide-react';

interface ChatProps {
  currentUser: User;
}

const Chat: React.FC<ChatProps> = ({ currentUser }) => {
  // useQuery s'abonne aux données temps réel : plus besoin de setInterval/polling !
  const messages = useQuery(api.main.listMessages) || [];
  
  const sendMessage = useMutation(api.main.sendMessage);
  const translate = useAction(api.actions.translateText);

  const [input, setInput] = useState('');
  const [translating, setTranslating] = useState(false);
  const [pendingTranslation, setPendingTranslation] = useState<{hanzi: string, pinyin: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    try {
      await sendMessage({
        content: input, 
        user_id: currentUser.id as any, 
        is_mandarin: !!pendingTranslation, 
        pinyin: pendingTranslation?.pinyin
      });
      setInput('');
      setPendingTranslation(null);
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const handleTranslate = async () => {
    if (!input.trim()) return;
    setTranslating(true);
    try {
      // Appel à l'action IA côté serveur (protège la clé API)
      const result = await translate({ text: input });
      setPendingTranslation(result);
      setInput(result.hanzi);
    } catch (error) {
      console.error("Translation failed", error);
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.24))] md:h-[calc(100vh-theme(spacing.20))] bg-[#151521] rounded-3xl shadow-2xl border border-[#2A2A35] overflow-hidden">
      {/* Header */}
      <div className="bg-[#151521]/90 backdrop-blur-sm p-4 border-b border-[#2A2A35] flex justify-between items-center z-10">
        <h2 className="font-semibold text-slate-200 flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          Discussion de classe
        </h2>
        <span className="text-xs text-slate-500 px-3 py-1 bg-[#0B0B15] rounded-full border border-[#2A2A35]">
          {messages.length} messages
        </span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#0B0B15]/50">
        {messages.map((msg: any) => {
          const isMe = msg.user_id === currentUser.id;
          return (
            <div key={msg._id || msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-5 py-3.5 shadow-md ${
                isMe 
                  ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-br-none' 
                  : 'bg-[#2A2A35] text-slate-200 rounded-bl-none border border-[#3A3A4A]'
              }`}>
                <div className="flex items-baseline justify-between gap-4 mb-1">
                  <span className={`text-xs font-bold ${isMe ? 'text-white/80' : 'text-violet-400'}`}>
                    {msg.profile?.name}
                    {msg.profile?.role === 'admin' && ' (Admin)'}
                    {msg.profile?.role === 'délégué' && ' (Délégué)'}
                  </span>
                  <span className={`text-[10px] ${isMe ? 'text-white/60' : 'text-slate-500'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                
                <p className={`text-sm ${msg.is_mandarin ? 'font-chinese text-lg leading-relaxed' : 'leading-relaxed'}`}>
                  {msg.content}
                </p>
                {msg.pinyin && (
                  <p className={`text-xs mt-1 italic ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                    {msg.pinyin}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#151521] border-t border-[#2A2A35]">
        <div className="flex items-center gap-3 relative">
          <button
            type="button"
            onClick={handleTranslate}
            disabled={translating || !input}
            className="p-3 text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            title="Traduire en Chinois"
          >
            {translating ? <Loader2 size={20} className="animate-spin" /> : <Globe size={20} />}
          </button>
          
          <form onSubmit={handleSend} className="flex-1 flex gap-3">
            <div className="flex-1 relative">
                <input
                type="text"
                value={input}
                onChange={(e) => {
                    setInput(e.target.value);
                    if(pendingTranslation) setPendingTranslation(null);
                }}
                placeholder="Écrivez un message..."
                className="w-full bg-[#0B0B15] pl-5 pr-4 py-3 border border-[#2A2A35] rounded-full focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none font-chinese text-slate-200 placeholder-slate-600 transition-all"
                />
            </div>
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white p-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-900/20 active:scale-95"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
        {pendingTranslation && (
            <div className="text-xs text-emerald-400 mt-2 px-4 flex items-center gap-2 animate-fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Traduction prête : <span className="italic">{pendingTranslation.pinyin}</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default Chat;