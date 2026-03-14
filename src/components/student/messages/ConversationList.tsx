'use client';

import { useState } from 'react';
import { Search, PenSquare, MessageSquare } from 'lucide-react';
import ConversationItem from './ConversationItem';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ConversationListProps {
  conversations: any[];
  instructors: any[];
  userId: string;
  activeId: string | null;
  onSelect: (id: string) => void;
  setConversations: React.Dispatch<React.SetStateAction<any[]>>;
  contactLabel?: string;   // "Message an Instructor" (default) or "Message a Student"
  emptyHint?: string;      // bottom hint text in empty state
}

export default function ConversationList({
  conversations,
  instructors,
  userId,
  activeId,
  onSelect,
  setConversations,
  contactLabel = 'Message an Instructor',
  emptyHint = 'Message an instructor from one of your courses to get started.',
}: ConversationListProps) {
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const supabase = createClient();

  const filtered = conversations.filter(c => 
    c.otherProfile?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = conversations.reduce((acc, c) => acc + (c.myUnreadCount || 0), 0);

  const openOrCreate = async (instructorId: string) => {
    // Check if exists
    const existing = conversations.find(c => 
      c.participant_1 === instructorId || c.participant_2 === instructorId
    );

    if (existing) {
      onSelect(existing.id);
      setShowNew(false);
      return;
    }

    // Create new conversation
    // To satisfy the conversations_check constraint, we must ensure
    // participant_1 is alphabetically before participant_2.
    const sortedParticipants = [userId, instructorId].sort();
    const p1 = sortedParticipants[0];
    const p2 = sortedParticipants[1];
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participant_1: p1,
          participant_2: p2,
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
        .single();
        
      if (error) throw error;
      
      setConversations(prev => [data, ...prev]);
      onSelect(data.id);
      setShowNew(false);
    } catch (err: any) {
      toast.error('Failed to start conversation: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-1.5 px-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        
        <div className="flex items-center mt-3 px-1">
          <h1 className="font-bold text-[18px] text-gray-900">Messages</h1>
          {totalUnread > 0 && (
            <span className="ml-2 bg-gray-900 text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {totalUnread}
            </span>
          )}
        </div>

        <button
          onClick={() => setShowNew(!showNew)}
          className="mt-4 w-full border border-gray-200 text-gray-700 font-semibold text-[13px] rounded-xl py-2 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <PenSquare className="w-4 h-4" />
          New Message
        </button>

        <div className="mt-3 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-gray-400 placeholder-gray-400"
            placeholder="Search messages..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* New Message Extender */}
      {showNew && (
        <div className="bg-white border-b border-gray-200 p-4 shadow-sm z-10">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">
            {contactLabel}
          </p>
          {/* Search contacts */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-400 placeholder-gray-400"
              placeholder="Search by name..."
              value={contactSearch}
              onChange={e => setContactSearch(e.target.value)}
              autoFocus
            />
          </div>
          {(() => {
            const filtered = instructors.filter(i =>
              (i.full_name || i.display_name || '').toLowerCase().includes(contactSearch.toLowerCase())
            );
            return filtered.length === 0 ? (
              <p className="text-[12px] text-gray-500 italic py-1">
                {contactSearch ? `No results for "${contactSearch}"` : 'No contacts found.'}
              </p>
            ) : (
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {filtered.map(inst => (
                  <div
                    key={inst.id}
                    onClick={() => { openOrCreate(inst.id); setContactSearch(''); }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
                      {inst.avatar_url ? (
                        <img src={inst.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[12px] font-bold text-gray-500">{inst.full_name?.[0] || '?'}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900">{inst.full_name || inst.display_name}</p>
                      <p className="text-[11px] text-gray-500 capitalize">{inst.role || 'Student'}</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto bg-gray-50 pb-4">
        {conversations.length === 0 ? (
          <div className="p-8 text-center mt-6">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="font-semibold text-[15px] text-gray-900 mt-4">No messages yet</p>
            <p className="text-[13px] text-gray-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
                {emptyHint}
              </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-[13px]">No matching conversations.</div>
        ) : (
          filtered.map(c => (
            <ConversationItem
              key={c.id}
              conversation={c}
              isActive={activeId === c.id}
              onClick={() => onSelect(c.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
