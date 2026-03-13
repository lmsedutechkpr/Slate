import {create} from 'zustand';

export interface Notification {
  id: string;
  type: string;
  title: string;
  title_ta: string | null;
  message: string;
  message_ta: string | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (n: Notification[]) => void;
  addNotification: (n: Notification) => void;
  markRead: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length
    }),
  addNotification: (notification) =>
    set((state) => {
      const isDuplicate = state.notifications.some((n) => n.id === notification.id);
      if (isDuplicate) return state;

      const newNotifications = [notification, ...state.notifications];
      return {
        notifications: newNotifications,
        unreadCount: state.unreadCount + (notification.is_read ? 0 : 1)
      };
    }),
  markRead: (id) =>
    set((state) => {
      let newlyRead = false;
      const updated = state.notifications.map((n) => {
        if (n.id === id && !n.is_read) {
          newlyRead = true;
          return {...n, is_read: true};
        }
        return n;
      });

      return {
        notifications: updated,
        unreadCount: Math.max(0, state.unreadCount - (newlyRead ? 1 : 0))
      };
    }),
  clearAll: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({...n, is_read: true})),
      unreadCount: 0
    }))
}));
