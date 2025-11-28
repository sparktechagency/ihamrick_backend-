export interface ISearchQuery {
  keyword: string;
  page?: number;
  limit?: number;
  filters?: {
    type?: ("blog" | "publication" | "podcast" | "video")[];
    dateFrom?: string;
    dateTo?: string;
    status?: boolean;
  };
}

export interface ISearchResult {
  id: string;
  type: "blog" | "publication" | "podcast" | "video";
  title: string;
  description?: string;
  coverImage?: string;
  thumbnailUrl?: string;
  author?: string;
  publicationDate?: string;
  uploadDate?: Date;
  date?: Date;
  status?: boolean;
  relevanceScore: number;
  matchedFields: string[];
  highlights: {
    title?: string;
    description?: string;
    transcription?: string;
    author?: string;
  };
  metadata?: {
    views?: number;
    duration?: number;
    fileType?: string;
    isLive?: boolean;
    currentListeners?: number;
  };
  createdAt: Date;
}

export interface ISearchResponse {
  totalResults: number;
  page: number;
  limit: number;
  totalPages: number;
  results: ISearchResult[];
  aggregations: {
    byType: {
      blog: number;
      publication: number;
      podcast: number;
      video: number;
    };
    totalMatches: number;
  };
  searchMetadata: {
    keyword: string;
    executionTime: number;
  };
}

export interface IFieldWeight {
  title: number;
  description: number;
  transcription: number;
  author: number;
}
