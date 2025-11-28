import { Blog } from "../blog/blog.model";
import { Publications as Publication } from "../publications/publications.model";
import { Video } from "../videos/videos.model";
import Podcast from "../podcast/podcast.model";
import {
  ISearchQuery,
  ISearchResult,
  ISearchResponse,
  IFieldWeight,
} from "./search.interface";

const FIELD_WEIGHTS: IFieldWeight = {
  title: 10,
  description: 5,
  transcription: 3,
  author: 7,
};

const calculateRelevanceScore = (
  item: any,
  keyword: string,
  type: string
): number => {
  let score = 0;
  const normalizedKeyword = keyword.toLowerCase();

  // Title Match (Highest Priority)
  if (item.title?.toLowerCase().includes(normalizedKeyword)) {
    score += FIELD_WEIGHTS.title;
    if (item.title?.toLowerCase() === normalizedKeyword) score += 20; // Exact match bonus
  }

  // Description Match
  if (item.description?.toLowerCase().includes(normalizedKeyword)) {
    score += FIELD_WEIGHTS.description;
  }

  // Transcription Match (for Video/Podcast)
  if (
    (type === "video" || type === "podcast") &&
    item.transcription?.toLowerCase().includes(normalizedKeyword)
  ) {
    score += FIELD_WEIGHTS.transcription;
  }

  // Author Match (for Publications)
  if (
    type === "publication" &&
    item.author?.toLowerCase().includes(normalizedKeyword)
  ) {
    score += FIELD_WEIGHTS.author;
  }

  return score;
};

const generateHighlights = (
  text: string,
  keyword: string,
  maxLength: number = 150
): string => {
  if (!text) return "";
  const normalizedText = text.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  const index = normalizedText.indexOf(normalizedKeyword);

  if (index === -1) return text.substring(0, maxLength) + "...";

  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + keyword.length + 100);
  let snippet = text.substring(start, end);

  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";

  // Highlight using HTML mark tag
  const regex = new RegExp(`(${keyword})`, "gi");
  return snippet.replace(regex, "<mark>$1</mark>");
};

const globalSearch = async (query: ISearchQuery): Promise<ISearchResponse> => {
  const startTime = Date.now();
  const {
    keyword,
    page = 1,
    limit = 10,
    filters = { type: [], status: true },
  } = query;

  if (!keyword) {
    throw new Error("Search keyword is required");
  }

  const searchRegex = new RegExp(keyword, "i");
  const baseQuery = {
    $or: [
      { title: searchRegex },
      { description: searchRegex },
      // Add specific fields per model dynamically below if needed,
      // but $or at root level usually covers common fields if they exist
    ],
  };

  // We need specific queries for each model because fields differ
  const blogQuery = {
    $or: [{ title: searchRegex }, { description: searchRegex }],
    ...(filters.status !== undefined && { isPublished: filters.status }),
  };

  const publicationQuery = {
    $or: [
      { title: searchRegex },
      { description: searchRegex },
      { author: searchRegex },
    ],
    ...(filters.status !== undefined && {
      status: filters.status ? "published" : "draft",
    }), // Adjust based on actual status values
  };

  const videoQuery = {
    $or: [
      { title: searchRegex },
      { description: searchRegex },
      { transcription: searchRegex },
    ],
    ...(filters.status !== undefined && { isPublished: filters.status }),
  };

  const podcastQuery = {
    $or: [
      { title: searchRegex },
      { description: searchRegex },
      { transcription: searchRegex },
    ],
    ...(filters.status !== undefined && { isPublished: filters.status }),
  };

  // Execute queries in parallel
  const [blogs, publications, videos, podcasts] = await Promise.all([
    !filters.type?.length || filters.type.includes("blog")
      ? Blog.find(blogQuery).lean()
      : [],
    !filters.type?.length || filters.type.includes("publication")
      ? Publication.find(publicationQuery).lean()
      : [],
    !filters.type?.length || filters.type.includes("video")
      ? Video.find(videoQuery).lean()
      : [],
    !filters.type?.length || filters.type.includes("podcast")
      ? Podcast.find(podcastQuery).lean()
      : [],
  ]);

  // Normalize and Score Results
  let allResults: ISearchResult[] = [];

  // Process Blogs
  blogs.forEach((item: any) => {
    allResults.push({
      id: item._id.toString(),
      type: "blog",
      title: item.title,
      description: item.description,
      coverImage: item.coverImage,
      date: item.createdAt,
      status: item.isPublished,
      relevanceScore: calculateRelevanceScore(item, keyword, "blog"),
      matchedFields: [], // Can be populated if needed
      highlights: {
        title: generateHighlights(item.title, keyword),
        description: generateHighlights(item.description, keyword),
      },
      createdAt: item.createdAt,
    });
  });

  // Process Publications
  publications.forEach((item: any) => {
    allResults.push({
      id: item._id.toString(),
      type: "publication",
      title: item.title,
      description: item.description,
      author: item.author,
      publicationDate: item.publicationDate,
      date: item.createdAt,
      status: item.status === "published",
      relevanceScore: calculateRelevanceScore(item, keyword, "publication"),
      matchedFields: [],
      highlights: {
        title: generateHighlights(item.title, keyword),
        description: generateHighlights(item.description, keyword),
        author: generateHighlights(item.author, keyword),
      },
      createdAt: item.createdAt,
    });
  });

  // Process Videos
  videos.forEach((item: any) => {
    allResults.push({
      id: item._id.toString(),
      type: "video",
      title: item.title,
      description: item.description,
      thumbnailUrl: item.thumbnailUrl,
      date: item.createdAt,
      status: item.isPublished,
      relevanceScore: calculateRelevanceScore(item, keyword, "video"),
      matchedFields: [],
      highlights: {
        title: generateHighlights(item.title, keyword),
        description: generateHighlights(item.description, keyword),
        transcription: generateHighlights(item.transcription, keyword),
      },
      metadata: {
        views: item.views,
        duration: item.duration,
      },
      createdAt: item.createdAt,
    });
  });

  // Process Podcasts
  podcasts.forEach((item: any) => {
    allResults.push({
      id: item._id.toString(),
      type: "podcast",
      title: item.title,
      description: item.description,
      thumbnailUrl: item.thumbnailUrl,
      date: item.createdAt,
      status: item.isPublished,
      relevanceScore: calculateRelevanceScore(item, keyword, "podcast"),
      matchedFields: [],
      highlights: {
        title: generateHighlights(item.title, keyword),
        description: generateHighlights(item.description, keyword),
        transcription: generateHighlights(item.transcription, keyword),
      },
      metadata: {
        fileType: item.fileType,
      },
      createdAt: item.createdAt,
    });
  });

  // Sort by Relevance Score (Descending)
  allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Pagination
  const totalResults = allResults.length;
  const totalPages = Math.ceil(totalResults / limit);
  const startIndex = (page - 1) * limit;
  const paginatedResults = allResults.slice(startIndex, startIndex + limit);

  const executionTime = Date.now() - startTime;

  return {
    totalResults,
    page,
    limit,
    totalPages,
    results: paginatedResults,
    aggregations: {
      byType: {
        blog: blogs.length,
        publication: publications.length,
        video: videos.length,
        podcast: podcasts.length,
      },
      totalMatches: totalResults,
    },
    searchMetadata: {
      keyword,
      executionTime,
    },
  };
};

export const SearchService = {
  globalSearch,
};
