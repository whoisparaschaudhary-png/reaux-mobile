import { create } from 'zustand';
import { postsApi } from '../api/endpoints/posts';
import type { Post, User } from '../types/models';
import type { CreatePostRequest } from '../types/api';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const FEED_CATEGORY_KEY_FOR_YOU = 'for_you';

/** Cache key for feed category (undefined -> 'for_you', else e.g. 'workout', 'admin', 'nutrition') */
export function getFeedCategoryKey(category: string | undefined): string {
  return category === undefined ? FEED_CATEGORY_KEY_FOR_YOU : category;
}

interface CategoryCache {
  posts: Post[];
  pagination: Pagination;
}

const defaultPagination: Pagination = { page: 1, limit: 10, total: 0, pages: 0 };

interface FeedState {
  /** Posts and pagination per category so tab switch keeps data */
  postsByCategory: Record<string, CategoryCache>;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  fetchPosts: (page?: number, category?: string) => Promise<void>;
  refreshPosts: (category?: string) => Promise<void>;
  likePost: (id: string) => Promise<void>;
  createPost: (data: CreatePostRequest, currentUser?: User | null) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  postsByCategory: {},
  isLoading: false,
  isRefreshing: false,
  error: null,

  fetchPosts: async (page = 1, category?: string) => {
    const key = getFeedCategoryKey(category);
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (category) params.category = category;

      const response = await postsApi.list(params);
      set((state) => {
        const prev = state.postsByCategory[key];
        const posts = page === 1 ? response.data : [...(prev?.posts ?? []), ...response.data];
        return {
          postsByCategory: {
            ...state.postsByCategory,
            [key]: { posts, pagination: response.pagination },
          },
          isLoading: false,
        };
      });
    } catch (err: any) {
      const message = err.message || 'Failed to load posts';
      set({ error: message, isLoading: false });
    }
  },

  refreshPosts: async (category?: string) => {
    const key = getFeedCategoryKey(category);
    set({ isRefreshing: true, error: null });
    try {
      const params: Record<string, any> = { page: 1, limit: 10 };
      if (category) params.category = category;

      const response = await postsApi.list(params);
      set((state) => ({
        postsByCategory: {
          ...state.postsByCategory,
          [key]: { posts: response.data, pagination: response.pagination },
        },
        isRefreshing: false,
      }));
    } catch (err: any) {
      const message = err.message || 'Failed to refresh posts';
      set({ error: message, isRefreshing: false });
    }
  },

  likePost: async (id: string) => {
    const prevByCategory = get().postsByCategory;
    const nextByCategory: Record<string, CategoryCache> = {};

    for (const [k, cache] of Object.entries(prevByCategory)) {
      nextByCategory[k] = {
        ...cache,
        posts: cache.posts.map((post) => {
          if (post._id !== id) return post;
          return {
            ...post,
            isLiked: !post.isLiked,
            likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
          };
        }),
      };
    }
    set({ postsByCategory: nextByCategory });

    try {
      const response = await postsApi.like(id);
      const serverPost = response.data;
      const serverAuthorPopulated =
        typeof serverPost.author === 'object' && serverPost.author && (serverPost.author as User).name;
      set((state) => {
        const merged: Record<string, CategoryCache> = {};
        for (const [k, cache] of Object.entries(state.postsByCategory)) {
          merged[k] = {
            ...cache,
            posts: cache.posts.map((p) => {
              if (p._id !== id) return p;
              const mergedPost: Post = { ...p, ...serverPost };
              if (!serverAuthorPopulated && p.author) mergedPost.author = p.author;
              return mergedPost;
            }),
          };
        }
        return { postsByCategory: merged };
      });
    } catch {
      set({ postsByCategory: prevByCategory });
    }
  },

  createPost: async (data: CreatePostRequest, currentUser?: User | null) => {
    set({ isLoading: true, error: null });
    try {
      const response = await postsApi.create(data);
      const newPost = response.data;
      const authorPopulated =
        typeof newPost.author === 'object' && newPost.author && (newPost.author as User).name;
      const postToPrepend: Post = authorPopulated
        ? newPost
        : { ...newPost, author: currentUser ?? newPost.author };

      const category = (newPost as Post).category;
      const keyForYou = FEED_CATEGORY_KEY_FOR_YOU;
      const keyCategory = category ? getFeedCategoryKey(category) : null;

      set((state) => {
        const next: Record<string, CategoryCache> = { ...state.postsByCategory };
        const prepend = (k: string) => {
          const cur = next[k] ?? { posts: [], pagination: defaultPagination };
          next[k] = { ...cur, posts: [postToPrepend, ...cur.posts] };
        };
        prepend(keyForYou);
        if (keyCategory && keyCategory !== keyForYou) prepend(keyCategory);
        return { postsByCategory: next, isLoading: false };
      });
    } catch (err: any) {
      const message = err.message || 'Failed to create post';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  deletePost: async (id: string) => {
    try {
      await postsApi.delete(id);
      set((state) => {
        const next: Record<string, CategoryCache> = {};
        for (const [k, cache] of Object.entries(state.postsByCategory)) {
          next[k] = {
            ...cache,
            posts: cache.posts.filter((p) => p._id !== id),
          };
        }
        return { postsByCategory: next };
      });
    } catch (err: any) {
      const message = err.message || 'Failed to delete post';
      set({ error: message });
      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),
}));
