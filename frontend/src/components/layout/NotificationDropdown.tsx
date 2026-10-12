import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, AlertCircle, CheckSquare, BookOpen, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { AppNotification, NotificationsListResponse } from '@/types/notification';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const data = await apiClient<NotificationsListResponse>('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch {
      // In demo mode or if offline, silent fallback
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (notif: AppNotification) => {
    if (!notif.is_read) {
      try {
        await apiClient(`/notifications/${notif.id}/read`, { method: 'PATCH' });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
    if (notif.link_url) {
      setIsOpen(false);
      navigate(notif.link_url);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient('/notifications/mark-all-read', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'exam_alert':
        return <AlertCircle className="w-4 h-4 text-secondary" />;
      case 'task_deadline':
        return <CheckSquare className="w-4 h-4 text-primary" />;
      case 'document_indexed':
        return <BookOpen className="w-4 h-4 text-accent-blue" />;
      default:
        return <Clock className="w-4 h-4 text-on-surface-variant" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center shadow-glow-primary animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-surface-container-high/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-3 z-50 flex flex-col gap-2 animate-fade-in max-h-[460px]">
          <div className="flex items-center justify-between pb-2 border-b border-white/5 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-headline font-bold text-on-surface">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-primary/20 text-primary font-mono text-[10px] font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-mono text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[360px] pr-0.5">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-on-surface-variant flex flex-col items-center gap-2">
                <Bell className="w-7 h-7 text-on-surface-variant/40" />
                <span>All caught up! No notifications.</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif)}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-3 border ${
                    !notif.is_read
                      ? 'bg-surface-container-highest/80 border-primary/20 shadow-sm'
                      : 'bg-surface-container/40 border-white/5 opacity-70 hover:opacity-100 hover:bg-surface-container/70'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-surface-container-lowest shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-on-surface truncate">
                        {notif.title}
                      </span>
                      {!notif.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 leading-tight line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
