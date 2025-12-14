export interface AIAnalysis {
  title: string;
  description: string;
  tags: string[];
}

export interface StoredImage {
  id: string; // UUID
  blob?: Blob; // Optional: Only present during upload or if local
  url?: string; // Optional: Remote URL from Firebase Storage
  name: string;
  type: string;
  size: number;
  createdAt: number;
  analysis?: AIAnalysis;
}

export type SortOption = 'newest' | 'oldest' | 'name' | 'size';
