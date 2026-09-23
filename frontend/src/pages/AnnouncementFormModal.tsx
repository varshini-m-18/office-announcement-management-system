import React, { useState, useEffect } from 'react';
import type { Announcement, AnnouncementFormData, AudienceType, Priority } from '../types';
import { formatToInputDateTime } from '../utils/date';
import { X, Calendar, Clock, AlertCircle, Save, Send, Sparkles } from 'lucide-react';

interface AnnouncementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AnnouncementFormData, isDraft: boolean) => Promise<void>;
  initialData?: Announcement | null;
  isLoading?: boolean;
}

const DEPARTMENTS = ['IT', 'HR', 'Finance', 'Marketing', 'Operations'];
const ROLES = ['employee', 'admin'];

export const AnnouncementFormModal: React.FC<AnnouncementFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [audienceType, setAudienceType] = useState<AudienceType>('everyone');
  const [audienceValue, setAudienceValue] = useState('everyone');
  const [pubMode, setPubMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [publishAt, setPublishAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
      setPriority(initialData.priority);
      setAudienceType(initialData.audience_type);
      setAudienceValue(initialData.audience_value);

      if (initialData.status === 'scheduled' && initialData.publish_at) {
        setPubMode('scheduled');
        setPublishAt(formatToInputDateTime(initialData.publish_at));
      } else {
        setPubMode('immediate');
        setPublishAt('');
      }

      setExpiresAt(initialData.expires_at ? formatToInputDateTime(initialData.expires_at) : '');
    } else {
      // Reset form
      setTitle('');
      setContent('');
      setPriority('normal');
      setAudienceType('everyone');
      setAudienceValue('everyone');
      setPubMode('immediate');
      setPublishAt('');
      setExpiresAt('');
    }
    setValidationError(null);
  }, [initialData, isOpen]);

  const handleAudienceTypeChange = (type: AudienceType) => {
    setAudienceType(type);
    if (type === 'everyone') {
      setAudienceValue('everyone');
    } else if (type === 'department') {
      setAudienceValue(DEPARTMENTS[0]);
    } else if (type === 'role') {
      setAudienceValue(ROLES[0]);
    }
  };

  const handleSubmit = async (isDraftAction: boolean) => {
    setValidationError(null);

    if (!title.trim()) {
      setValidationError('Announcement title is required.');
      return;
    }

    if (!content.trim()) {
      setValidationError('Announcement content cannot be empty.');
      return;
    }

    let pubDateIso: string | undefined = undefined;
    if (pubMode === 'scheduled' && !isDraftAction) {
      if (!publishAt) {
        setValidationError('Please select a scheduled publication date and time.');
        return;
      }
      const pubDate = new Date(publishAt);
      if (isNaN(pubDate.getTime())) {
        setValidationError('Invalid publication date.');
        return;
      }
      pubDateIso = pubDate.toISOString();
    } else if (pubMode === 'immediate' && !isDraftAction) {
      pubDateIso = new Date().toISOString();
    }

    let expDateIso: string | null = null;
    if (expiresAt) {
      const expDate = new Date(expiresAt);
      if (isNaN(expDate.getTime())) {
        setValidationError('Invalid expiry date.');
        return;
      }
      const basePubTime = pubDateIso ? new Date(pubDateIso).getTime() : Date.now();
      if (expDate.getTime() <= basePubTime) {
        setValidationError('Expiry date & time must be after the publication date & time.');
        return;
      }
      expDateIso = expDate.toISOString();
    }

    const payload: AnnouncementFormData = {
      title: title.trim(),
      content: content.trim(),
      priority,
      audience_type: audienceType,
      audience_value: audienceValue,
      publish_at: pubDateIso,
      expires_at: expDateIso,
      is_draft: isDraftAction,
    };

    try {
      await onSubmit(payload, isDraftAction);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string'
        ? detail
        : (Array.isArray(detail) ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ') : 'Failed to save announcement.');
      setValidationError(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-indigo-50/50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {initialData ? 'Edit Announcement' : 'Create New Announcement'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">Broadcast office updates, news and departmental notices</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {validationError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="announcement-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Server Maintenance Tonight"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Content <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="announcement-content-input"
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the full announcement details..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-y"
            />
          </div>

          {/* Grid: Priority & Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority Level
              </label>
              <select
                id="announcement-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              >
                <option value="normal">Normal (Informational)</option>
                <option value="important">Important (Action Needed)</option>
                <option value="urgent">Urgent (Critical Notice)</option>
              </select>
            </div>

            {/* Target Audience Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Audience
              </label>
              <select
                id="announcement-audience-type-select"
                value={audienceType}
                onChange={(e) => handleAudienceTypeChange(e.target.value as AudienceType)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              >
                <option value="everyone">Everyone (Organization-Wide)</option>
                <option value="department">Specific Department</option>
                <option value="role">Specific Role</option>
              </select>
            </div>
          </div>

          {/* Sub-Audience Select if Department or Role */}
          {audienceType === 'department' && (
            <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1.5">
                Select Department <span className="text-rose-500">*</span>
              </label>
              <select
                id="announcement-department-select"
                value={audienceValue}
                onChange={(e) => setAudienceValue(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-purple-300 rounded-xl text-sm text-purple-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept} Department
                  </option>
                ))}
              </select>
            </div>
          )}

          {audienceType === 'role' && (
            <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-2xl animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-teal-900 uppercase tracking-wider mb-1.5">
                Select Role <span className="text-rose-500">*</span>
              </label>
              <select
                id="announcement-role-select"
                value={audienceValue}
                onChange={(e) => setAudienceValue(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-teal-300 rounded-xl text-sm text-teal-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Publication Schedule & Expiry */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Publication Schedule
              </label>
              <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPubMode('immediate')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    pubMode === 'immediate'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Publish Immediately
                </button>
                <button
                  type="button"
                  onClick={() => setPubMode('scheduled')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    pubMode === 'scheduled'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Schedule for Later
                </button>
              </div>
            </div>

            {pubMode === 'scheduled' && (
              <div className="animate-in fade-in duration-150">
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  Scheduled Date & Time
                </label>
                <input
                  id="announcement-publish-at-input"
                  type="datetime-local"
                  value={publishAt}
                  onChange={(e) => setPublishAt(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Optional Expiry Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Optional Expiry Date & Time
              </label>
              <input
                id="announcement-expires-at-input"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                placeholder="Leave blank for no expiration"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Announcements automatically expire and become hidden from employees after this timestamp.
              </span>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="save-draft-btn"
              onClick={() => handleSubmit(true)}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-200/80 hover:bg-slate-300 border border-slate-300 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              id="publish-submit-btn"
              onClick={() => handleSubmit(false)}
              disabled={isLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{initialData ? 'Update & Publish' : 'Publish Announcement'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
