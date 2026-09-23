import React, { useState, useEffect, useCallback } from 'react';
import type { Announcement, AnnouncementFormData, DashboardStats } from '../types';
import { announcementApi, adminApi } from '../services/api';
import { PriorityBadge, StatusBadge, AudienceBadge } from '../components/Badge';
import { AnnouncementDetailModal } from '../components/AnnouncementDetailModal';
import { AnnouncementFormModal } from './AnnouncementFormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatDateTime, formatRelativeTime } from '../utils/date';
import {
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  Send,
  PowerOff,
  Layers,
  CheckCircle2,
  Clock,
  FileEdit,
  Archive,
  Filter,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [audienceFilter, setAudienceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    variant: 'danger' | 'warning' | 'info';
    confirmText: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
    variant: 'danger',
    confirmText: 'Confirm',
  });

  // Feedback toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        announcementApi.list({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          audience: audienceFilter !== 'all' ? audienceFilter : undefined,
          search: searchQuery.trim() || undefined,
        }),
        adminApi.getStats(),
      ]);
      setAnnouncements(listRes);
      setStats(statsRes);
    } catch {
      showToast('Failed to load announcements data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, audienceFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateOrUpdate = async (formData: AnnouncementFormData, isDraft: boolean) => {
    setFormSubmitting(true);
    try {
      if (editingAnnouncement) {
        await announcementApi.update(editingAnnouncement.id, formData);
        showToast(`Announcement successfully updated${isDraft ? ' as draft' : ''}!`);
      } else {
        await announcementApi.create(formData);
        showToast(`Announcement successfully ${isDraft ? 'saved as draft' : 'published'}!`);
      }
      setIsFormOpen(false);
      setEditingAnnouncement(null);
      await loadData();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string'
        ? detail
        : (Array.isArray(detail) ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ') : 'Failed to save announcement.');
      showToast(msg, 'error');
      throw err;
    } finally {
      setFormSubmitting(false);
    }
  };

  const handlePublishNow = (item: Announcement) => {
    setConfirmModal({
      isOpen: true,
      title: 'Publish Announcement',
      message: `Are you sure you want to immediately publish "${item.title}" to target audience?`,
      variant: 'info',
      confirmText: 'Publish Now',
      action: async () => {
        try {
          await announcementApi.publish(item.id);
          showToast('Announcement published successfully!');
          await loadData();
        } catch {
          showToast('Failed to publish announcement.', 'error');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeactivate = (item: Announcement) => {
    setConfirmModal({
      isOpen: true,
      title: 'Deactivate Announcement',
      message: `Deactivating "${item.title}" will hide it immediately from all employees. You can reactivate or edit it later.`,
      variant: 'warning',
      confirmText: 'Deactivate',
      action: async () => {
        try {
          await announcementApi.deactivate(item.id);
          showToast('Announcement deactivated.');
          await loadData();
        } catch {
          showToast('Failed to deactivate announcement.', 'error');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDelete = (item: Announcement) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Announcement',
      message: `Are you sure you want to permanently delete "${item.title}"? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete Permanently',
      action: async () => {
        try {
          await announcementApi.delete(item.id);
          showToast('Announcement permanently deleted.');
          await loadData();
        } catch {
          showToast('Failed to delete announcement.', 'error');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const statusTabs: { key: string; label: string; count?: number; icon: any }[] = [
    { key: 'all', label: 'All', count: stats?.total, icon: Layers },
    { key: 'active', label: 'Active', count: stats?.active, icon: CheckCircle2 },
    { key: 'scheduled', label: 'Scheduled', count: stats?.scheduled, icon: Clock },
    { key: 'draft', label: 'Drafts', count: stats?.draft, icon: FileEdit },
    { key: 'inactive', label: 'Inactive', count: stats?.inactive, icon: Archive },
    { key: 'expired', label: 'Expired', count: stats?.expired, icon: Archive },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-rose-600 text-white border-rose-500'
          }`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Management Console</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                Admin Control
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">Create, broadcast, schedule and moderate organization-wide communications</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData()}
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition shadow-xs"
              title="Refresh announcements list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              id="create-announcement-btn"
              onClick={() => {
                setEditingAnnouncement(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Announcement</span>
            </button>
          </div>
        </div>

        {/* Top Stats Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-200 transition">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total</span>
              <Layers className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats?.total ?? 0}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs hover:border-emerald-300 transition">
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{stats?.active ?? 0}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs hover:border-indigo-300 transition">
            <div className="flex items-center justify-between text-indigo-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Scheduled</span>
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-indigo-600">{stats?.scheduled ?? 0}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Drafts</span>
              <FileEdit className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-700">{stats?.draft ?? 0}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-xs hover:border-orange-300 transition">
            <div className="flex items-center justify-between text-orange-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Inactive</span>
              <Archive className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-black text-orange-600">{stats?.inactive ?? 0}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs hover:border-gray-300 transition">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Expired</span>
              <Archive className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-black text-gray-600">{stats?.expired ?? 0}</div>
          </div>
        </div>

        {/* Controls & Filtering Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 mb-6 shadow-xs space-y-4">
          
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
            {statusTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  id={`filter-status-${tab.key}`}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-indigo-700 text-white' : 'bg-slate-200/70 text-slate-700'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search & Audience Dropdown */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              <input
                id="search-input"
                type="text"
                placeholder="Search announcements by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                id="filter-audience-select"
                value={audienceFilter}
                onChange={(e) => setAudienceFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Audiences</option>
                <option value="everyone">Everyone</option>
                <option value="department">Departments Only</option>
                <option value="role">Roles Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Announcements Table */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No announcements found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No records match the current filters. Try changing your search query or create a new announcement.
              </p>
              <button
                onClick={() => {
                  setEditingAnnouncement(null);
                  setIsFormOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Announcement</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Title & Summary</th>
                    <th className="py-3.5 px-3">Audience</th>
                    <th className="py-3.5 px-3">Priority</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-3">Published / Date</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {announcements.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-indigo-50/30 transition group"
                    >
                      {/* Title & Preview */}
                      <td className="py-4 px-4 sm:px-6 max-w-xs sm:max-w-md">
                        <div
                          className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer line-clamp-1"
                          onClick={() => {
                            setSelectedAnnouncement(item);
                            setIsDetailOpen(true);
                          }}
                        >
                          {item.title}
                        </div>
                        <p className="text-slate-500 line-clamp-1 mt-0.5 text-[11px]">
                          {item.content}
                        </p>
                      </td>

                      {/* Audience */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <AudienceBadge type={item.audience_type} value={item.audience_value} />
                      </td>

                      {/* Priority */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <PriorityBadge priority={item.priority} size="sm" />
                      </td>

                      {/* Status */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <StatusBadge status={item.status} size="sm" />
                      </td>

                      {/* Date */}
                      <td className="py-4 px-3 whitespace-nowrap text-slate-500 text-[11px]">
                        <div>{formatRelativeTime(item.publish_at)}</div>
                        <div className="text-[10px] text-slate-400">{formatDateTime(item.publish_at)}</div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* View button */}
                          <button
                            onClick={() => {
                              setSelectedAnnouncement(item);
                              setIsDetailOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Publish button if draft or scheduled */}
                          {(item.status === 'draft' || item.status === 'scheduled' || item.status === 'inactive') && (
                            <button
                              onClick={() => handlePublishNow(item)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="Publish announcement now"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}

                          {/* Deactivate button if active */}
                          {item.status === 'active' && (
                            <button
                              onClick={() => handleDeactivate(item)}
                              className="p-1.5 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition"
                              title="Deactivate announcement"
                            >
                              <PowerOff className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit button */}
                          <button
                            onClick={() => {
                              setEditingAnnouncement(item);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="Edit announcement"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete announcement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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

      {/* Create / Edit Form Modal */}
      <AnnouncementFormModal
        isOpen={isFormOpen}
        initialData={editingAnnouncement}
        isLoading={formSubmitting}
        onClose={() => {
          setIsFormOpen(false);
          setEditingAnnouncement(null);
        }}
        onSubmit={handleCreateOrUpdate}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
