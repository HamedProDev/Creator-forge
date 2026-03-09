export type Role = 'user' | 'admin';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  profile_pic?: string;
  subscription_status?: 'free' | 'pro' | 'enterprise';
  created_at?: string;
}

export type ContentType = 'thumbnail' | 'image' | 'title' | 'script' | 'hashtags' | 'audio';
export type Platform = 'youtube' | 'tiktok' | 'instagram';
export type Status = 'draft' | 'approved' | 'published';

export interface ContentItem {
  id: number;
  user_id: number;
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
