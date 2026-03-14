'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, CheckCheck, MoreVertical, Pencil, Trash2, Trash } from 'lucide-react';
import { createPortal } from 'react-dom';

interface MessageBubbleProps {
  message: any;
  isSent: boolean;
  showAvatar: boolean;
  userAvatar?: string | null;
  onEdit?: (msgId: string, currentBody: string) => void;
  onDeleteForMe?: (msgId: string) => void;
  onDeleteForAll?: (msgId: string) => void;
}

const DELETED_SENTINEL = '__deleted_for_all__';

function fmtTime(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export default function MessageBubble({
  message,
  isSent,
  showAvatar,
  userAvatar,
  onEdit,
  onDeleteForMe,
  onDeleteForAll,
}: MessageBubbleProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDeletedForAll = message.body === DELETED_SENTINEL;
  const isEdited = !!message.edited_at;

  const time = new Date(message.created_at || message.sent_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const sentTime = fmtTime(message.created_at || message.sent_at);
  const seenTime = fmtTime(message.read_at);

  const POPUP_H = 132;
  const POPUP_W = 220;

  // Open message info (sender only)
  const openInfo = useCallback(() => {
    if (!isSent || !bubbleRef.current) return;
    const rect = bubbleRef.current.getBoundingClientRect();
    const showBelow = rect.top < POPUP_H + 16;
    const left = Math.max(8, rect.right - POPUP_W);
    const top = showBelow ? rect.bottom + 8 : rect.top - POPUP_H - 8;
    setMenuPos({ top, left });
    setShowInfo(true);
  }, [isSent]);

  // Open context menu (sender only: edit + delete options; receiver: no menu)
  const openMenu = useCallback((e: React.MouseEvent) => {
    if (!isSent) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuH = 140;
    const top = rect.bottom + 4 + menuH > window.innerHeight ? rect.top - menuH - 4 : rect.bottom + 4;
    const left = Math.min(rect.left, window.innerWidth - 160 - 8);
    setMenuPos({ top, left });
    setShowMenu(true);
  }, [isSent]);

  // Close on outside click
  useEffect(() => {
    if (!showInfo && !showMenu) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      const inPopup = popupRef.current?.contains(t);
      const inBubble = bubbleRef.current?.contains(t);
      const inMenu = menuRef.current?.contains(t);
      if (!inPopup && !inBubble && !inMenu) {
        setShowInfo(false);
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showInfo, showMenu]);

  useEffect(() => {
    if (!showInfo && !showMenu) return;
    const h = () => { setShowInfo(false); setShowMenu(false); };
    window.addEventListener('scroll', h, true);
    return () => window.removeEventListener('scroll', h, true);
  }, [showInfo, showMenu]);

  // ── Popups rendered via portal ──
  const infoPopup = showInfo && menuPos && isSent ? (
    <div
      ref={popupRef}
      style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, width: POPUP_W, zIndex: 9999 }}
      className="bg-white border border-gray-200 rounded-2xl shadow-xl px-4 py-3"
    >
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Message Info</p>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-gray-400" strokeWidth={2.5} />
            <span className="text-[12px] font-semibold text-gray-600">Sent</span>
          </div>
          <span className="text-[11px] text-gray-500 tabular-nums">{sentTime || '—'}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <CheckCheck className="w-3.5 h-3.5 text-gray-400" strokeWidth={2.5} />
            <span className="text-[12px] font-semibold text-gray-600">Delivered</span>
          </div>
          <span className="text-[11px] text-gray-500 tabular-nums">{sentTime || '—'}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <CheckCheck className="w-3.5 h-3.5 text-[#28C840]" strokeWidth={2.5} />
            <span className="text-[12px] font-semibold text-gray-600">Seen</span>
          </div>
          <span className="text-[11px] text-gray-500 tabular-nums">{seenTime || '—'}</span>
        </div>
      </div>
    </div>
  ) : null;

  const contextMenu = showMenu && menuPos && isSent ? (
    <div
      ref={menuRef}
      style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999, width: 180 }}
      className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden py-1"
    >
      {!isDeletedForAll && (
        <button
          onClick={() => { setShowMenu(false); onEdit?.(message.id, message.body); }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          <Pencil className="w-3.5 h-3.5 text-gray-400" />
          Edit
        </button>
      )}
      <button
        onClick={() => { setShowMenu(false); onDeleteForMe?.(message.id); }}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
      >
        <Trash2 className="w-3.5 h-3.5 text-gray-400" />
        Delete for me
      </button>
      {!isDeletedForAll && (
        <button
          onClick={() => { setShowMenu(false); onDeleteForAll?.(message.id); }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors whitespace-nowrap"
        >
          <Trash className="w-3.5 h-3.5" />
          Delete for everyone
        </button>
      )}
    </div>
  ) : null;

  // Deleted-for-all styling
  if (isDeletedForAll) {
    return (
      <div className={`flex items-end gap-2 w-full ${isSent ? 'justify-end' : 'justify-start'}`}>
        {!isSent && (
          showAvatar ? (
            <div className="w-7 h-7 rounded-full bg-gray-200 border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden mb-1">
              {userAvatar ? <img src={userAvatar} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold text-gray-500">?</span>}
            </div>
          ) : <div className="w-7 flex-shrink-0" />
        )}
        <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'} max-w-[75%]`}>
          <div className={`px-4 py-2.5 text-[13px] italic border rounded-2xl ${isSent ? 'rounded-br-sm border-gray-300 text-gray-400 bg-gray-50' : 'rounded-bl-sm border-gray-200 text-gray-400 bg-gray-50'}`}>
            🚫 This message was deleted
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 w-full ${isSent ? 'justify-end' : 'justify-start'}`}>
      {!isSent && (
        showAvatar ? (
          <div className="w-7 h-7 rounded-full bg-gray-200 border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden mb-1">
            {userAvatar ? <img src={userAvatar} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold text-gray-500">?</span>}
          </div>
        ) : <div className="w-7 flex-shrink-0" />
      )}

      <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'} max-w-[75%]`}>
        {/* Bubble */}
        <div className="relative group flex items-center gap-1">
          {/* Three-dot menu button — only for sender, shows on hover */}
          {isSent && (
            <button
              onClick={openMenu}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 mr-1"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          )}

          <div
            ref={bubbleRef}
            onClick={isSent ? (showInfo ? () => setShowInfo(false) : openInfo) : undefined}
            className={`px-4 py-2.5 text-[13px] leading-relaxed shadow-sm transition-opacity active:opacity-75 ${
              isSent
                ? 'bg-gray-900 border border-gray-800 text-white rounded-2xl rounded-br-sm cursor-pointer select-none'
                : 'bg-white border text-gray-900 rounded-2xl rounded-bl-sm border-gray-200 cursor-default'
            }`}
          >
            {message.body}
          </div>
        </div>

        {/* Time + read status */}
        <div className="flex items-center gap-1 mt-1 px-1">
          <span className="text-[10px] font-medium text-gray-400">{time}</span>
          {isEdited && <span className="text-[10px] text-gray-400 italic">· edited</span>}
          {isSent && (
            message.is_read ? (
              <CheckCheck className="w-[11px] h-[11px] text-[#28C840]" strokeWidth={3} />
            ) : (
              <Check className="w-[11px] h-[11px] text-gray-400" strokeWidth={3} />
            )
          )}
        </div>
      </div>

      {typeof document !== 'undefined' && createPortal(infoPopup, document.body)}
      {typeof document !== 'undefined' && createPortal(contextMenu, document.body)}
    </div>
  );
}
