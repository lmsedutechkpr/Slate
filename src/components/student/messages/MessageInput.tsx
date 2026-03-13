'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (text: string) => void;
  onTyping?: () => void;
}

export default function MessageInput({ onSend, onTyping }: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [text]);

  const handleSend = () => {
    const msg = text.trim();
    if (!msg) return;
    onSend(msg);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      onTyping?.();
    }
  };

  return (
    <div className="px-4 py-4 flex-shrink-0 border-t border-gray-200 bg-gray-50 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      {/* Mini traffic lights */}
      <div className="flex items-center gap-1 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-[#FF5F57]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#FEBC2E]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#28C840]" />
      </div>

      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 resize-none overflow-hidden transition-shadow"
        />

        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center transition-all ${
            text.trim()
              ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Send className="w-[15px] h-[15px]" style={{ transform: 'translate(-1px, 1px)' }} />
        </button>
      </div>
    </div>
  );
}
