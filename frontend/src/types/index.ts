export type Role = 'admin' | 'employee';

export type Department = 'IT' | 'HR' | 'Finance' | 'Marketing' | 'Operations' | 'General';

export type Priority = 'normal' | 'important' | 'urgent';

export type Status = 'draft' | 'scheduled' | 'active' | 'inactive' | 'expired';

export type AudienceType = 'everyone' | 'department' | 'role';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  department: Department;
  created_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  status: Status;
  priority: Priority;
  audience_type: AudienceType;
  audience_value: string;
  publish_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: number;
  creator_name?: string;
  is_recent?: boolean;
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  priority: Priority;
  audience_type: AudienceType;
  audience_value: string;
  publish_at?: string;
  expires_at?: string | null;
  is_draft?: boolean;
}

export interface DashboardStats {
  total: number;
  active: number;
  scheduled: number;
  draft: number;
  inactive: number;
  expired: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
