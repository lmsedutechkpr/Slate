'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';

interface MessagesClientProps {
  initialConversations: any[];
  instructors: any[];
  userId: string;
  userProfile: any;
  contactLabel?: string;
  emptyHint?: string;
  initialToUserId?: string;
}

export default function MessagesClient({
  initialConversations,
  instructors,
  userId,
  userProfile,
  contactLabel,
  emptyHint,
  initialToUserId,
}: MessagesClientProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);
  const supabase = createClient();
  const didAutoOpen = useRef(false);

  // ── Auto-open conversation when coming from ?to=userId (e.g. Students page message button) ──
  useEffect(() => {
    if (!initialToUserId || didAutoOpen.current) return;
    didAutoOpen.current = true;

    // Check if a conversation already exists
    const existing = initialConversations.find(c =>
      c.participant_1 === initialToUserId || c.participant_2 === initialToUserId
    );

    if (existing) {
      setActiveId(existing.id);
      setIsMobileListOpen(false);
      return;
    }

    // Create a new conversation with that user
    const sorted = [userId, initialToUserId].sort();
    supabase
      .from('conversations')
      .insert({
        participant_1: sorted[0],
        participant_2: sorted[1],
        last_message_at: new Date().toISOString(),
        unread_count_p1: 0,
        unread_count_p2: 0,
      })
      .select(`
        id, participant_1, participant_2, last_message_at,
        unread_count_p1, unread_count_p2, created_at,
        p1:profiles!participant_1(id, full_name, display_name, avatar_url, role),
        p2:profiles!participant_2(id, full_name, display_name, avatar_url, role)
      `)
      .single()
      .then(({ data, error }) => {
        if (error || !data) return;
        setConversations(prev => [data, ...prev]);
        setActiveId(data.id);
        setIsMobileListOpen(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToUserId]);

  const activeConversation = conversations.find(c => c.id === activeId) || null;

  useEffect(() => {
    // Listen for updates to conversations (last_message_at changes from DB trigger etc.)
    const convChannel = supabase.channel('conversations-list-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        (payload) => {
          setConversations(prev => {
            const idx = prev.findIndex(c => c.id === payload.new.id);
            if (idx === -1) return prev;
            const next = [...prev];
            next[idx] = { ...next[idx], ...payload.new };
            return next.sort(
              (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
            );
          });
        }
      )
      .subscribe();

    // Listen for new messages across ALL conversations (to update previews for non-active chats)
    const msgChannel = supabase.channel('global-messages-preview')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as any;
          // Only care about messages sent by someone else to us
          if (msg.sender_id === userId) return;

          setConversations(prev => {
            const idx = prev.findIndex(c => c.id === msg.conversation_id);
            if (idx === -1) return prev;
            const next = [...prev];
            const isP1 = next[idx].participant_1 === userId;
            next[idx] = {
              ...next[idx],
              last_message_at: msg.created_at,
              last_message_preview: msg.body,
              [isP1 ? 'unread_count_p1' : 'unread_count_p2']:
                // Don't increment if the conversation is currently open
                activeId === msg.conversation_id
                  ? 0
                  : (next[idx][isP1 ? 'unread_count_p1' : 'unread_count_p2'] || 0) + 1,
            };
            return next.sort(
              (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(convChannel);
      supabase.removeChannel(msgChannel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, userId, activeId]);

  const selectConversation = (id: string) => {
    setActiveId(id);
    setIsMobileListOpen(false);
  };

  const backToList = () => {
    setIsMobileListOpen(true);
  };

  // Pre-process conversations to identify the "other" user
  const processedConversations = conversations.map(c => {
    const isP1 = c.participant_1 === userId;
    return {
      ...c,
      otherProfile: isP1 ? c.p2 : c.p1,
      myUnreadCount: isP1 ? c.unread_count_p1 : c.unread_count_p2,
    };
  });
  
  const activeProcessed = activeConversation ? processedConversations.find(c => c.id === activeId) : null;

  return (
    <div className="flex w-full h-full bg-white relative">

      {/* LEFT PANEL */}
      <div 
        className={`w-full md:w-[320px] lg:w-[350px] flex-shrink-0 h-full flex flex-col border-r border-gray-200 bg-gray-50 transition-transform ${
          !isMobileListOpen ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ConversationList
          conversations={processedConversations}
          instructors={instructors}
          userId={userId}
          activeId={activeId}
          onSelect={selectConversation}
          setConversations={setConversations}
          contactLabel={contactLabel}
          emptyHint={emptyHint}
        />
      </div>

      {/* RIGHT PANEL */}
      <div 
        className={`flex-1 h-full min-w-0 bg-white flex flex-col ${
          isMobileListOpen ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ChatWindow
          conversation={activeProcessed}
          userId={userId}
          onBack={backToList}
          setConversations={setConversations}
        />
      </div>
      
    </div>
  );
}
