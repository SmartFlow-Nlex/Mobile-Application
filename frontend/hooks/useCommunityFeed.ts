import { useCallback, useEffect, useState } from 'react';
import {
  ActiveCommunityTab,
  CommunityPost,
  ReportIncidentPayload,
  ShareUpdatePayload,
} from '@smartflow/shared';
import {
  PostKind,
  createIncident,
  createUpdate,
  fetchPosts,
  setLiked,
} from '../lib/communityApi';

const kindForTab = (tab: ActiveCommunityTab): PostKind =>
  tab === 'incidents' ? 'incident' : 'update';

export const useCommunityFeed = (): {
  posts: CommunityPost[];
  isLoading: boolean;
  /** Non-null when the feed could not be loaded or a post could not be saved. */
  error: string | null;
  /** True while a post is being submitted, so the UI can show progress. */
  isSubmitting: boolean;
  activeTab: ActiveCommunityTab;
  setActiveTab: (tab: ActiveCommunityTab) => void;
  handleLike: (id: string) => void;
  handleShareUpdate: (payload: ShareUpdatePayload) => Promise<void>;
  handleReportIncident: (payload: ReportIncidentPayload) => Promise<void>;
  refresh: () => void;
} => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveCommunityTab>('community');
  const [refreshToken, setRefreshToken] = useState<number>(0);

  const refresh = useCallback((): void => {
    setRefreshToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const next = await fetchPosts(kindForTab(activeTab));
        if (!cancelled) {
          setPosts(next);
        }
      } catch (caught) {
        if (!cancelled) {
          // No seed data to hide behind any more: an empty feed now means
          // "nothing posted yet", so a failure has to say so out loud.
          setPosts([]);
          setError(caught instanceof Error ? caught.message : 'Could not load the feed.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [activeTab, refreshToken]);

  const handleLike = useCallback(
    (id: string): void => {
      const target = posts.find((post) => post.id === id);
      if (target === undefined) {
        return;
      }
      const nextLiked = !target.likedByUser;

      // Optimistic: a like should feel instant. Rolled back below if it fails.
      setPosts((current) =>
        current.map((post) =>
          post.id === id
            ? {
                ...post,
                likedByUser: nextLiked,
                likes: nextLiked ? post.likes + 1 : Math.max(0, post.likes - 1),
              }
            : post,
        ),
      );

      void setLiked(id, nextLiked).catch(() => {
        setPosts((current) =>
          current.map((post) =>
            post.id === id
              ? {
                  ...post,
                  likedByUser: target.likedByUser,
                  likes: target.likes,
                }
              : post,
          ),
        );
      });
    },
    [posts],
  );

  const submit = useCallback(
    async (
      create: () => Promise<CommunityPost>,
      belongsToTab: ActiveCommunityTab,
    ): Promise<void> => {
      setIsSubmitting(true);
      setError(null);
      try {
        const saved = await create();
        // Only prepend when the user is looking at the tab it belongs to;
        // switching tabs refetches anyway.
        setPosts((current) => (activeTab === belongsToTab ? [saved, ...current] : current));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not save your post.');
        throw caught;
      } finally {
        setIsSubmitting(false);
      }
    },
    [activeTab],
  );

  const handleShareUpdate = useCallback(
    async (payload: ShareUpdatePayload): Promise<void> => {
      await submit(() => createUpdate(payload), 'community');
    },
    [submit],
  );

  const handleReportIncident = useCallback(
    async (payload: ReportIncidentPayload): Promise<void> => {
      await submit(() => createIncident(payload), 'incidents');
    },
    [submit],
  );

  return {
    posts,
    isLoading,
    error,
    isSubmitting,
    activeTab,
    setActiveTab,
    handleLike,
    handleShareUpdate,
    handleReportIncident,
    refresh,
  };
};
