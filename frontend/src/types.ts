export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  thumbnailUrl: string;
  downloadUrl: string;
  size: number; // in MB
  filename: string;
}

export interface AnalysisResult {
  platform: string;
  title: string;
  media: MediaItem[];
  authorName?: string;
  authorAvatar?: string;
  likeCount?: number;
  commentCount?: number;
}
