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
}

export interface ExtractionStrategy {
  name: string;
  run(url: string): Promise<ExtractionResult>;
}
