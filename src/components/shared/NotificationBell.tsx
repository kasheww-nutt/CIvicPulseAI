import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppNotification, subscribeToNotifications, markNotificationAsRead } from '../../lib/notifications';
import { useNavigate } from 'react-router-dom';

export function NotificationBell({ buttonClassName }: { buttonClassName?: string }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // If not logged in, we use 'me' as fallback for demo context
    const uId = user?.uid || 'me';
    const unsubscribe = subscribeToNotifications(uId, (notifs) => {
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification.id);
    }
    setIsOpen(false);
    navigate(`/case/${notification.caseId}`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={buttonClassName || "relative text-slate-500 hover:text-slate-900 transition-colors p-1"}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-bold text-white">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-10 right-0 w-80 bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden z-50 flex flex-col max-h-[400px]">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-sm text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold bg-[#0f284b] text-white px-2 py-0.5 rounded-full">{unreadCount} new</span>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-6 text-center flex flex-col items-center text-slate-500">
                <Bell className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No notifications yet.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map(notif => (
                  <button 
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 items-start ${!notif.isRead ? 'bg-blue-50/50' : 'opacity-80'}`}
                  >
                    <div className={`mt-0.5 w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${notif.type === 'claimed' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {notif.type === 'claimed' ? <Shield className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col gap-1 pr-2">
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">{notif.title}</h4>
                      <p className="text-[11px] text-slate-600 leading-snug">{notif.message}</p>
                    </div>
                    {!notif.isRead && <div className="w-2 h-2 bg-[#0f284b] rounded-full shrink-0 ml-auto mt-2"></div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
