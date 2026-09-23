import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Announcement } from '../types';
import { announcementApi } from '../services/api';
import { PriorityBadge, AudienceBadge } from '../components/Badge';
import { AnnouncementDetailModal } from '../components/AnnouncementDetailModal';
import { formatDateTime, formatRelativeTime } from '../utils/date';
import {
  Megaphone,
  Search,
  Sparkles,
  RefreshCw,
  Building,
  Globe,
  AlertTriangle,
  Clock,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'priority' | 'department' | 'everyone'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const data = await announcementApi.list({
        search: searchQuery.trim() || undefined,
      });
      setAnnouncements(data);
    } catch (err) {
      console.error('Error loading employee announcements:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Client-side quick filter tabs
  const filteredAnnouncements = announcements.filter((item) => {
    if (activeTab === 'priority') {
      return item.priority === 'urgent' || item.priority === 'important';
    }
    if (activeTab === 'department') {
      return item.audience_type === 'department';
    }
    if (activeTab === 'everyone') {
      return item.audience_type === 'everyone';
    }
    return true;
  });

  const urgentCount = announcements.filter(
    (a) => a.priority === 'urgent' || a.priority === 'important'
  ).length;
  const deptCount = announcements.filter((a) => a.audience_type === 'department').length;
  const everyoneCount = announcements.filter((a) => a.audience_type === 'everyone').length;

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                <span>Employee Communications Feed</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Welcome, {user?.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs sm:text-sm text-slate-300">
                <span className="flex items-center gap-1">
                  <Building className="w-4 h-4 text-indigo-400" />
                  <span><strong>{user?.department}</strong> Department</span>
                </span>
                <span>&bull;</span>
                <span className="text-indigo-200">
                  {announcements.length} active {announcements.length === 1 ? 'notice' : 'notices'} for you
                </span>
              </div>
            </div>

            {/* Quick Actions / Refresh */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchAnnouncements()}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition border border-white/10"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Feed</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Feed Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 mb-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              id="emp-filter-all"
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Notices</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'all' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {announcements.length}
              </span>
            </button>

            <button
              id="emp-filter-priority"
              onClick={() => setActiveTab('priority')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'priority'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Urgent & Important</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'priority' ? 'bg-rose-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {urgentCount}
              </span>
            </button>

            <button
              id="emp-filter-dept"
              onClick={() => setActiveTab('department')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'department'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>{user?.department} Notices</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'department' ? 'bg-purple-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {deptCount}
              </span>
            </button>

            <button
              id="emp-filter-everyone"
              onClick={() => setActiveTab('everyone')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'everyone'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Company-Wide</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'everyone' ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {everyoneCount}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            <input
              id="emp-search-input"
              type="text"
              placeholder="Search active notices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Announcements List / Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse space-y-4">
                <div className="flex gap-2">
                  <div className="w-16 h-5 bg-slate-200 rounded-full" />
                  <div className="w-20 h-5 bg-slate-200 rounded-full" />
                </div>
                <div className="h-6 bg-slate-200 rounded-md w-3/4" />
                <div className="h-16 bg-slate-100 rounded-md w-full" />
                <div className="h-4 bg-slate-200 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No active announcements</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              You are completely caught up! There are currently no active announcements matching your selection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnnouncements.map((item) => (
              <div
                key={item.id}
                id={`announcement-card-${item.id}`}
                onClick={() => {
                  setSelectedAnnouncement(item);
                  setIsDetailOpen(true);
                }}
                className="group bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-indigo-300 transition duration-200 p-6 flex flex-col justify-between cursor-pointer relative overflow-hidden"
              >
                {/* Urgent accent line */}
                {item.priority === 'urgent' && (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500 animate-pulse" />
                )}
                {item.priority === 'important' && (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />
                )}

                <div>
                  {/* Top Badges & NEW Indicator */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={item.priority} size="sm" />
                      <AudienceBadge type={item.audience_type} value={item.audience_value} />
                    </div>

                    {item.is_recent && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs animate-bounce">
                        <Sparkles className="w-3 h-3" /> NEW
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-2 leading-snug mb-2">
                    {item.title}
                  </h3>

                  {/* Content Preview */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                    {item.content}
                  </p>
                </div>

                {/* Footer Metadata */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 font-medium text-slate-700" title={formatDateTime(item.publish_at)}>
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{formatRelativeTime(item.publish_at)}</span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-indigo-600 font-bold group-hover:translate-x-1 transition duration-150">
                      Read full notice <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>

                  {item.expires_at && (
                    <div className="flex items-center gap-1 text-rose-600/90 text-[10px]" title={formatDateTime(item.expires_at)}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Expires: {formatDateTime(item.expires_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnnouncementDetailModal
        isOpen={isDetailOpen}
        announcement={selectedAnnouncement}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedAnnouncement(null);
        }}
      />
    </div>
  );
};
