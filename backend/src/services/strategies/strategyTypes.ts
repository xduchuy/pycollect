export interface MediaItem {
  id?: string;
  type: 'image' | 'video';
  thumbnailUrl: string;
  downloadUrl: string;
  size?: number | null;
  filename?: string;
  selected?: boolean;
}

export interface ExtractionResult {
  platform?: string;
  title: string;
  media: MediaItem[];
  authorName?: string;
  authorAvatar?: string;
  likeCount?: number;
  commentCount?: number;
}

export interface ExtractionStrategy {
  name: string;
  run(url: string, cookie?: string): Promise<ExtractionResult>;
}
