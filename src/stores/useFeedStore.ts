import { create } from 'zustand';
import { postsApi } from '../api/endpoints/posts';
import type { Post } from '../types/models';
import type { CreatePostRequest } from '../types/api';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface FeedState {
  posts: Post[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  pagination: Pagination;

  fetchPosts: (page?: number, category?: string) => Promise<void>;
  refreshPosts: (category?: string) => Promise<void>;
  likePost: (id: string) => Promise<void>;
  createPost: (data: CreatePostRequest) => Promise<void>;
  clearError: () => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0, pages: 0 },

  fetchPosts: async (page = 1, category?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (category) params.category = category;

      const response = await postsApi.list(params);
      set((state) => ({
        posts: page === 1 ? response.data : [...state.posts, ...response.data],
        pagination: response.pagination,
        isLoading: false,
      }));
    } catch (err: any) {
      const message = err.message || 'Failed to load posts';
      set({ error: message, isLoading: false });
    }
  },

  refreshPosts: async (category?: string) => {
    set({ isRefreshing: true, error: null });
    try {
      const params: Record<string, any> = { page: 1, limit: 10 };
      if (category) params.category = category;

      const response = await postsApi.list(params);
      set({
        posts: response.data,
        pagination: response.pagination,
        isRefreshing: false,
      });
    } catch (err: any) {
      const message = err.message || 'Failed to refresh posts';
      set({ error: message, isRefreshing: false });
    }
  },

  likePost: async (id: string) => {
    const { posts } = get();
    // Optimistic update: toggle isLiked and count
    const updatedPosts = posts.map((post) => {
      if (post._id !== id) return post;
      return {
        ...post,
        isLiked: !post.isLiked,
        likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
      };
    });
    set({ posts: updatedPosts });

    try {
      const response = await postsApi.like(id);
      const serverPost = response.data;
      set((state) => ({
        posts: state.posts.map((p) =>
          p._id === id
            ? { ...p, isLiked: serverPost.isLiked, likesCount: serverPost.likesCount }
            : p,
        ),
      }));
    } catch {
      // Revert optimistic update on failure
      set({ posts });
    }
  },

  createPost: async (data: CreatePostRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await postsApi.create(data);
      const newPost = response.data;
      set((state) => ({
        posts: [newPost, ...state.posts],
        isLoading: false,
      }));
    } catch (err: any) {
      const message = err.message || 'Failed to create post';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),
}));
