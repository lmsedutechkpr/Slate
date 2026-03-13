'use client';

function fmtDate(isoStr: string) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const now = new Date();
  
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[d.getDay()];
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface ConversationItemProps {
  conversation: any;
  isActive: boolean;
  onClick: () => void;
}

export default function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const profile = conversation.otherProfile;
  if (!profile) return null;

  const lastTime = fmtDate(conversation.last_message_at);
  const unreadCount = conversation.myUnreadCount || 0;

  return (
    <div
      onClick={onClick}
      className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-all border-b border-gray-100 ${
        isActive 
          ? 'bg-white border-l-2 border-l-gray-900' 
          : 'bg-transparent border-l-2 border-l-transparent hover:bg-white'
      }`}
    >
      {/* Avatar */}
      <div className="relative w-10 h-10 rounded-full bg-gray-200 border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="font-bold text-[14px] text-gray-400">
            {profile.full_name?.charAt(0) || '?'}
          </span>
        )}
        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#28C840] border-2 border-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`text-[13px] font-bold truncate ${unreadCount > 0 ? 'text-gray-900' : 'text-gray-600'}`}>
            {profile.full_name || 'Unknown User'}
          </p>
          <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">
            {lastTime}
          </span>
        </div>

        <div className="flex items-center justify-between mt-0.5">
          <p className={`text-[12px] truncate ${unreadCount > 0 ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>
            {conversation.last_message_preview || (unreadCount > 0 ? 'New message' : 'Tap to start chatting')}
          </p>
          
          {unreadCount > 0 && (
            <span className="ml-2 bg-[#FF5F57] text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
