import React from 'react';
import type { Announcement } from '../types';
import { PriorityBadge, StatusBadge, AudienceBadge } from './Badge';
import { formatDateTime, formatRelativeTime } from '../utils/date';
import { X, Calendar, Clock, User as UserIcon, Sparkles } from 'lucide-react';

interface AnnouncementDetailModalProps {
  announcement: Announcement | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AnnouncementDetailModal: React.FC<AnnouncementDetailModalProps> = ({
  announcement,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !announcement) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-indigo-50/40 border-b border-slate-200/80 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <PriorityBadge priority={announcement.priority} />
              <StatusBadge status={announcement.status} />
              <AudienceBadge type={announcement.audience_type} value={announcement.audience_value} />
              {announcement.is_recent && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs animate-bounce">
                  <Sparkles className="w-3 h-3" /> NEW
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {announcement.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Metadata Bar */}
        <div className="px-6 py-3 bg-slate-100/60 border-b border-slate-200/60 flex flex-wrap items-center justify-between gap-y-2 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
            <span>Posted by: <strong className="text-slate-800">{announcement.creator_name || 'Administrator'}</strong></span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1" title={formatDateTime(announcement.publish_at)}>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Published: <strong>{formatRelativeTime(announcement.publish_at)}</strong></span>
            </div>

            {announcement.expires_at && (
              <div className="flex items-center gap-1 text-rose-600" title={formatDateTime(announcement.expires_at)}>
                <Calendar className="w-3.5 h-3.5" />
                <span>Expires: <strong>{formatDateTime(announcement.expires_at)}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap font-normal">
            {announcement.content}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
