'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { createPortal } from 'react-dom';

interface MessageBubbleProps {
  message: any;
  isSent: boolean;
  showAvatar: boolean;
  userAvatar?: string | null;
}

function fmtTime(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

interface PopupPos {
  top: number;
  left: number;
  showBelow: boolean;
}

export default function MessageBubble({ message, isSent, showAvatar, userAvatar }: MessageBubbleProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [popupPos, setPopupPos] = useState<PopupPos | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const time = new Date(message.created_at || message.sent_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const sentTime = fmtTime(message.created_at || message.sent_at);
  const seenTime = fmtTime(message.read_at);

  const POPUP_HEIGHT = 132; // approx height of the popup in px
  const POPUP_WIDTH = 220;

  const openInfo = useCallback(() => {
    if (!bubbleRef.current) return;
    const rect = bubbleRef.current.getBoundingClientRect();
    const spaceAbove = rect.top;
    const showBelow = spaceAbove < POPUP_HEIGHT + 16; // not enough room above

    // Horizontal: align to right edge for sent, left edge for received
    let left = isSent
      ? Math.max(8, rect.right - POPUP_WIDTH)
      : Math.min(rect.left, window.innerWidth - POPUP_WIDTH - 8);

    const top = showBelow
      ? rect.bottom + 8
      : rect.top - POPUP_HEIGHT - 8;

    setPopupPos({ top, left, showBelow });
    setShowInfo(true);
  }, [isSent]);

  // Close on outside click
  useEffect(() => {
    if (!showInfo) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popupRef.current && !popupRef.current.contains(target) &&
        bubbleRef.current && !bubbleRef.current.contains(target)
      ) {
        setShowInfo(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showInfo]);

  // Close on scroll
  useEffect(() => {
    if (!showInfo) return;
    const handler = () => setShowInfo(false);
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, [showInfo]);

  const popup = showInfo && popupPos ? (
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        top: popupPos.top,
        left: popupPos.left,
        width: POPUP_WIDTH,
        zIndex: 9999,
      }}
      className="bg-white border border-gray-200 rounded-2xl shadow-xl px-4 py-3"
    >
      {/* Arrow pointing up or down toward the bubble */}
      {!popupPos.showBelow && (
        <div
          className={`absolute bottom-[-6px] w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45 ${isSent ? 'right-4' : 'left-4'}`}
        />
      )}
      {popupPos.showBelow && (
        <div
          className={`absolute top-[-6px] w-3 h-3 bg-white border-l border-t border-gray-200 rotate-45 ${isSent ? 'right-4' : 'left-4'}`}
        />
      )}

      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Message Info</p>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-gray-400" strokeWidth={2.5} />
            <span className="text-[12px] font-semibold text-gray-600">Sent</span>
          </div>
          <span className="text-[11px] text-gray-500 font-medium tabular-nums">{sentTime || '—'}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <CheckCheck className="w-3.5 h-3.5 text-gray-400" strokeWidth={2.5} />
            <span className="text-[12px] font-semibold text-gray-600">Delivered</span>
          </div>
          <span className="text-[11px] text-gray-500 font-medium tabular-nums">{sentTime || '—'}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <CheckCheck className="w-3.5 h-3.5 text-[#28C840]" strokeWidth={2.5} />
            <span className="text-[12px] font-semibold text-gray-600">Seen</span>
          </div>
          <span className="text-[11px] text-gray-500 font-medium tabular-nums">{seenTime || '—'}</span>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className={`flex items-end gap-2 w-full ${isSent ? 'justify-end' : 'justify-start'}`}>

      {/* Received Avatar */}
      {!isSent ? (
        showAvatar ? (
          <div className="w-7 h-7 rounded-full bg-gray-200 border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden mb-1">
            {userAvatar ? (
              <img src={userAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-gray-500">?</span>
            )}
          </div>
        ) : (
          <div className="w-7 flex-shrink-0" />
        )
      ) : null}

      {/* Bubble Container */}
      <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'} max-w-[75%]`}>

        {/* Clickable Bubble */}
        <div
          ref={bubbleRef}
          onClick={showInfo ? () => setShowInfo(false) : openInfo}
          className={`px-4 py-2.5 text-[13px] leading-relaxed shadow-sm cursor-pointer select-none transition-opacity active:opacity-75 ${
            isSent
              ? 'bg-gray-900 border border-gray-800 text-white rounded-2xl rounded-br-sm'
              : 'bg-white border text-gray-900 rounded-2xl rounded-bl-sm border-gray-200'
          }`}
        >
          {message.body}
        </div>

        {/* Time & Read Status */}
        <div className="flex items-center gap-1 mt-1 px-1">
          <span className="text-[10px] font-medium text-gray-400">{time}</span>

          {isSent && (
            message.is_read ? (
              <CheckCheck className="w-[11px] h-[11px] text-[#28C840]" strokeWidth={3} />
            ) : (
              <Check className="w-[11px] h-[11px] text-gray-400" strokeWidth={3} />
            )
          )}
        </div>
      </div>

      {/* Portal popup — rendered at document body level so it's never clipped */}
      {typeof document !== 'undefined' && createPortal(popup, document.body)}
    </div>
  );
}
