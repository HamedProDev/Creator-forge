export type Role = 'user' | 'admin';

export interface User {
  id: string | number;
  email: string;
  name: string;
  role: Role;
  profile_pic?: string;
  subscription_status?: 'free' | 'pro' | 'enterprise';
  credits?: number;
  referral_code?: string;
  created_at?: string;
  settings?: {
    notifications?: {
      generation_complete: boolean;
      weekly_analytics: boolean;
      platform_alerts: boolean;
      security_alerts: boolean;
    };
    two_factor_auth?: boolean;
  };
  connections?: {
    youtube?: { connected: boolean; name?: string; followers?: string };
    tiktok?: { connected: boolean; name?: string; followers?: string };
    instagram?: { connected: boolean; name?: string; followers?: string };
  };
}

export interface FileItem {
  id: number;
  user_id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  created_at: string;
}

export type ContentType = 'thumbnail' | 'image' | 'title' | 'script' | 'hashtags' | 'audio';
export type Platform = 'youtube' | 'tiktok' | 'instagram';
export type Status = 'draft' | 'approved' | 'published';

export interface ContentItem {
  id: string;
  user_id: string;
  type: ContentType;
  title: string;
  description?: string;
  content_data?: string;
  image_url?: string;
  status: Status;
  platform: Platform;
  created_at: string;
}

export interface AdminStats {
  totalUsers: number;
  totalContent: number;
  recentUsers: Partial<User>[];
}
