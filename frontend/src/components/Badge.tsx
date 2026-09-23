import React from 'react';
import type { Priority, Status, AudienceType } from '../types';
import { AlertCircle, AlertTriangle, Info, Globe, Building2, UserCheck, Clock, CheckCircle2, Archive, XCircle, FileEdit } from 'lucide-react';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs font-semibold' : 'px-2.5 py-1 text-xs font-semibold';

  switch (priority) {
    case 'urgent':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 shadow-sm ${sizeClasses}`}>
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
          Urgent
        </span>
      );
    case 'important':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 shadow-sm ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          Important
        </span>
      );
    case 'normal':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          <Info className="w-3.5 h-3.5 text-slate-500" />
          Normal
        </span>
      );
  }
};

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs font-semibold' : 'px-2.5 py-1 text-xs font-semibold';

  switch (status) {
    case 'active':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Active
        </span>
      );
    case 'scheduled':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          Scheduled
        </span>
      );
    case 'draft':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}>
          <FileEdit className="w-3.5 h-3.5 text-slate-500" />
          Draft
        </span>
      );
    case 'inactive':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5 text-orange-600" />
          Inactive
        </span>
      );
    case 'expired':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 ${sizeClasses}`}>
          <Archive className="w-3.5 h-3.5 text-gray-500" />
          Expired
        </span>
      );
    default:
      return null;
  }
};

interface AudienceBadgeProps {
  type: AudienceType;
  value: string;
}

export const AudienceBadge: React.FC<AudienceBadgeProps> = ({ type, value }) => {
  if (type === 'everyone') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 text-xs font-medium border border-sky-200">
        <Globe className="w-3 h-3 text-sky-600" />
        Everyone
      </span>
    );
  }

  if (type === 'department') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-medium border border-purple-200">
        <Building2 className="w-3 h-3 text-purple-600" />
        Dept: {value}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 text-xs font-medium border border-teal-200">
      <UserCheck className="w-3 h-3 text-teal-600" />
      Role: {value}
    </span>
  );
};
