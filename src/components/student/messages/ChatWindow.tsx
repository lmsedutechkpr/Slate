'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, MoreHorizontal, ArrowLeft, Trash2, User, BellOff, Info, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { toast } from 'sonner';
import { sendMessage } from '@/app/(student)/student/messages/actions';

interface ChatWindowProps {
  conversation: any;
  userId: string;
  onBack: () => void;
  setConversations: React.Dispatch<React.SetStateAction<any[]>>;
}

const DELETED_FOR_ALL = '__deleted_for_all__';

export default function ChatWindow({ conversation, userId, onBack, setConversations }: ChatWindowProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    endRef.current?.scrollIntoView({ behavior });
  };

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // 1. Fetch messages whenever conversation changes
  useEffect(() => {
    if (!conversation) return;
    
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('id, body, created_at, is_read, sender_id, read_at, edited_at, deleted_for_sender, deleted_for_all')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })
        .limit(200);
        
      if (!error && data) {
        // Filter out messages deleted for this sender
        const visible = data.filter((m: any) => !(m.deleted_for_sender && m.sender_id === userId));
        setMessages(visible);
        setTimeout(() => scrollToBottom('instant'), 50);
      }
      setLoading(false);

      // Always reset unread count for this conversation when opened, 
      // just in case the db unread_count got out of sync with actual message is_read status
      const isP1 = conversation.participant_1 === userId;
      setConversations(prev => prev.map(c =>
        c.id === conversation.id
          ? { ...c, [isP1 ? 'unread_count_p1' : 'unread_count_p2']: 0, myUnreadCount: 0 }
          : c
      ));

      await supabase
        .from('conversations')
        .update({ [isP1 ? 'unread_count_p1' : 'unread_count_p2']: 0 })
        .eq('id', conversation.id);

      // Mark incoming unread messages as read
      const unread = data?.filter(m => !m.is_read && m.sender_id !== userId);
      if (unread && unread.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in('id', unread.map((u: any) => u.id));
      }
    };

    fetchMessages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id]);

  // 2. Real-time subscriptions
  useEffect(() => {
    if (!conversation) return;

    // Messages channel (INSERT + UPDATE)
    const msgChannel = supabase.channel(`chat-${conversation.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        async (payload) => {
          const newMsg = payload.new as any;
          
          // If received from other user, add it and mark read right away
          if (newMsg.sender_id !== userId) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            setTimeout(() => scrollToBottom(), 80);
            setOtherTyping(false);

            // Mark as read since window is open
            const { data: updated } = await supabase
              .from('messages')
              .update({ is_read: true, read_at: new Date().toISOString() })
              .eq('id', newMsg.id)
              .select('id, body, created_at, is_read, sender_id, read_at')
              .single();

            if (updated) {
              setMessages(prev => prev.map(m => m.id === newMsg.id ? updated : m));
            }

            // Update conversation list last message preview
            setConversations(prev => prev.map(c => {
              if (c.id === conversation.id) {
                return {
                  ...c,
                  last_message_at: newMsg.created_at,
                  last_message_preview: newMsg.body,
                };
              }
              return c;
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          // This picks up is_read / read_at changes so sender sees checkmarks update live
          setMessages(prev => prev.map(m =>
            m.id === payload.new.id ? { ...m, ...payload.new } : m
          ));
        }
      )
      .subscribe();

    // Presence channel (online/offline + typing)
    const presenceChannel = supabase.channel(`presence-${conversation.id}`, {
      config: { presence: { key: userId } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState<{ online: boolean; typing?: boolean; user_id: string }>();
        const otherUserId = conversation.participant_1 === userId
          ? conversation.participant_2
          : conversation.participant_1;
        const otherState = state[otherUserId];
        setIsOnline(!!otherState);
        const isTyping = otherState
          ? (Array.isArray(otherState) ? (otherState[0] as any)?.typing : (otherState as any)?.typing)
          : false;
        setOtherTyping(!!isTyping);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        const otherUserId = conversation.participant_1 === userId
          ? conversation.participant_2
          : conversation.participant_1;
        if (key === otherUserId) setIsOnline(true);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        const otherUserId = conversation.participant_1 === userId
          ? conversation.participant_2
          : conversation.participant_1;
        if (key === otherUserId) { setIsOnline(false); setOtherTyping(false); }
      });

    presenceChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({ online: true, typing: false, user_id: userId });
      }
    });

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(presenceChannel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id, userId]);

  const handleTyping = async () => {
    // We'd broadcast typing via presence track — lightweight
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      // typing stopped
    }, 2000);
  };

  const handleSend = async (text: string) => {
    if (!conversation) return;

    const tempId = 'temp-' + Date.now();
    const now = new Date().toISOString();
    const optimisticMsg = {
      id: tempId,
      body: text,
      sender_id: userId,
      created_at: now,
      is_read: false,
      read_at: null,
      conversation_id: conversation.id,
      _sending: true,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom(), 30);

    setConversations(prev => prev.map(c =>
      c.id === conversation.id ? { ...c, last_message_at: now, last_message_preview: text } : c
    ));

    try {
      const inserted = await sendMessage(conversation.id, text);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...inserted, read_at: inserted.read_at ?? null } : m));
    } catch (err: any) {
      toast.error('Failed to send: ' + err.message);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  // ── Edit / Delete handlers ──────────────────────────────────────────
  const handleEdit = (msgId: string, currentBody: string) => {
    setEditingId(msgId);
    setEditText(currentBody);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const submitEdit = async () => {
    if (!editingId || !editText.trim()) return;
    const newBody = editText.trim();
    setMessages(prev => prev.map(m => m.id === editingId ? { ...m, body: newBody, edited_at: new Date().toISOString() } : m));
    setEditingId(null);
    await supabase.from('messages').update({ body: newBody, edited_at: new Date().toISOString() }).eq('id', editingId);
  };

  const handleDeleteForMe = (msgId: string) => {
    // Client-side only — filter from list
    setMessages(prev => prev.filter(m => m.id !== msgId));
    toast.success('Message deleted for you');
  };

  const handleDeleteForAll = async (msgId: string) => {
    // Mark with sentinel body so both sides see "this message was deleted"
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, body: DELETED_FOR_ALL } : m));
    await supabase.from('messages').update({ body: DELETED_FOR_ALL }).eq('id', msgId);
    toast.success('Message deleted for everyone');
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 h-full">
        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto" />
        <h2 className="font-bold text-[18px] text-gray-900 mt-5">Select a conversation</h2>
        <p className="text-[13px] text-gray-500 mt-2 max-w-[250px] text-center">
          Choose a message from the list on the left or start a new conversation with an instructor.
        </p>
      </div>
    );
  }

  const profile = conversation.otherProfile;

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Chat Header */}
      <div className="px-5 py-4 border-b border-gray-200 flex-shrink-0 flex items-center justify-between bg-white z-10 w-full">
        <div className="flex items-center gap-4">
          
          <button onClick={onBack} className="md:hidden text-gray-500 p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="hidden md:flex items-center gap-1.5 mr-2">
            <div className="w-2 h-2 rounded-full bg-[#FF5F57]" />
            <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
            <div className="w-2 h-2 rounded-full bg-[#28C840]" />
          </div>

          <div className="relative w-9 h-9 rounded-full bg-gray-200 overflow-hidden border border-gray-200">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[12px] font-bold text-gray-500 flex justify-center items-center h-full">
                {profile?.full_name?.charAt(0) || '?'}
              </span>
            )}
            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white transition-colors ${
              isOnline ? 'bg-[#28C840]' : 'bg-gray-300'
            }`} />
          </div>
          
          <div>
            <h2 className="font-bold text-[15px] text-gray-900 leading-tight">
              {profile?.full_name || 'Unknown User'}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-medium text-gray-500 capitalize">
                {profile?.role || 'Instructor'}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              {otherTyping ? (
                <span className="text-[10px] text-[#28C840] font-bold px-1.5 py-0.5 rounded bg-green-50 border border-green-100 flex items-center gap-1">
                  <span className="flex gap-0.5 items-end h-3">
                    <span className="w-1 h-1.5 bg-[#28C840] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1.5 bg-[#28C840] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1.5 bg-[#28C840] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  typing
                </span>
              ) : isOnline ? (
                <span className="text-[10px] bg-green-50 text-[#28C840] font-bold px-1.5 py-0.5 rounded border border-green-100 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#28C840] animate-pulse" />
                  Online
                </span>
              ) : (
                <span className="text-[10px] bg-gray-50 text-gray-400 font-bold px-1.5 py-0.5 rounded border border-gray-100 uppercase tracking-widest">
                  Offline
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Three-dots menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="More options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="p-1.5">
                <button
                  onClick={() => { setMenuOpen(false); toast.info(`${profile?.full_name}'s profile is not available here.`); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  View Profile
                </button>
                <button
                  onClick={() => { setMenuOpen(false); toast.info('Message info: Click any bubble to see its timestamps.'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <Info className="w-4 h-4 text-gray-400" />
                  Message Info
                </button>
                <button
                  onClick={() => { setMenuOpen(false); toast.info('Mute notifications coming soon.'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <BellOff className="w-4 h-4 text-gray-400" />
                  Mute Notifications
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => { setMenuOpen(false); setMessages([]); toast.info('Chat cleared.'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-3 bg-white">
        {loading ? (
          <div className="m-auto text-gray-400 text-[13px] font-medium">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="m-auto text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-100">
              <span className="text-[18px]">👋</span>
            </div>
            <p className="text-[13px] font-medium text-gray-500">Say hello to {profile?.full_name}!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isSent = msg.sender_id === userId;
            const prev = messages[idx - 1];
            const showAvatar = !prev || prev.sender_id !== msg.sender_id;

            // Inline edit UI
            if (editingId === msg.id) {
              return (
                <div key={msg.id} className={`flex items-end gap-2 w-full ${isSent ? 'justify-end' : 'justify-start'}`}>
                  <div className="flex flex-col items-end max-w-[75%] gap-1">
                    <div className="flex items-center gap-2">
                      <input
                        ref={editInputRef}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') submitEdit(); if (e.key === 'Escape') setEditingId(null); }}
                        className="bg-gray-900 text-white text-[13px] px-4 py-2.5 rounded-2xl rounded-br-sm border border-gray-700 outline-none focus:border-gray-500 min-w-[120px]"
                      />
                      <button onClick={submitEdit} className="p-1.5 text-[#28C840] hover:bg-green-50 rounded-full transition"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-full transition"><X className="w-4 h-4" /></button>
                    </div>
                    <span className="text-[10px] text-gray-400 px-1">Press Enter to save · Esc to cancel</span>
                  </div>
                </div>
              );
            }
            
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isSent={isSent}
                showAvatar={showAvatar}
                userAvatar={isSent ? null : profile?.avatar_url}
                onEdit={handleEdit}
                onDeleteForMe={handleDeleteForMe}
                onDeleteForAll={handleDeleteForAll}
              />
            );
          })
        )}

        {/* Typing indicator (animated dots) */}
        {otherTyping && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-200 border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-gray-500">{profile?.full_name?.charAt(0) || '?'}</span>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <MessageInput onSend={handleSend} onTyping={handleTyping} />
    </div>
  );
}
