import { useEffect, useState } from 'react';
import {
  ActiveCommunityTab,
  CommunityPost,
  ReportIncidentPayload,
  ShareUpdatePayload,
} from '@smartflow/shared';

const API_BASE_URL = 'http://localhost:3000';

const seedPosts: CommunityPost[] = [
  {
    id: 'community-1',
    authorName: 'Maria Santos',
    authorInitial: 'M',
    avatarColor: '#2563EB',
    location: 'Bocaue',
    timeAgo: '5m ago',
    message: 'Traffic moving smoothly now, accident cleared! 🔥',
    status: 'smooth',
    likes: 12,
    likedByUser: false,
  },
  {
    id: 'community-2',
    authorName: 'Juan Dela Cruz',
    authorInitial: 'J',
    avatarColor: '#0F766E',
    location: 'Balintawak Cloverleaf',
    timeAgo: '12m ago',
    message: 'Heavy traffic here, been stuck for 15 mins already. Plan ahead!',
    status: 'heavy',
    likes: 8,
    likedByUser: false,
  },
  {
    id: 'incident-1',
    authorName: 'Ana Reyes',
    authorInitial: 'A',
    avatarColor: '#1D4ED8',
    location: 'San Fernando',
    timeAgo: '20m ago',
    message: 'Minor collision reported on the shoulder lane. Expect brief slowdown.',
    status: 'incident',
    likes: 5,
    likedByUser: true,
  },
];

export const useCommunityFeed = (): {
  posts: CommunityPost[];
  isLoading: boolean;
  activeTab: ActiveCommunityTab;
  setActiveTab: (tab: ActiveCommunityTab) => void;
  handleLike: (id: string) => void;
  handleShareUpdate: (payload: ShareUpdatePayload) => void;
  handleReportIncident: (payload: ReportIncidentPayload) => void;
  refresh: () => void;
} => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ActiveCommunityTab>('community');

  const refresh = (): void => {
    setIsLoading(true);

    void (async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/community/posts?tab=${activeTab}&page=1&limit=20`
        );

        if (!response.ok) {
          throw new Error('Failed to load community feed');
        }

        const payload = (await response.json()) as { data?: CommunityPost[] };
        if (payload.data) {
          setPosts(payload.data);
        } else {
          throw new Error('No community data returned');
        }
      } catch {
        setPosts(
          seedPosts.filter((post) =>
            activeTab === 'community' ? post.status !== 'incident' : post.status === 'incident'
          )
        );
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const handleLike = (id: string): void => {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === id
          ? {
              ...post,
              likedByUser: !post.likedByUser,
              likes: post.likedByUser ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );

    void fetch(`${API_BASE_URL}/api/community/posts/${id}/like`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: 'current-user' }),
    }).catch(() => undefined);
  };

  const handleShareUpdate = (payload: ShareUpdatePayload): void => {
    const newPost: CommunityPost = {
      id: `community-${Date.now()}`,
      authorName: payload.postedBy,
      authorInitial: payload.postedBy[0]?.toUpperCase() ?? 'U',
      avatarColor: '#2563EB',
      location: payload.location,
      timeAgo: 'Just now',
      message: payload.message,
      status: payload.status,
      likes: 0,
      likedByUser: false,
    };

    if (activeTab === 'community') {
      setPosts((currentPosts) => [newPost, ...currentPosts]);
    }

    void fetch(`${API_BASE_URL}/api/community/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(() => undefined);
  };

  const handleReportIncident = (payload: ReportIncidentPayload): void => {
    const newIncident: CommunityPost = {
      id: `incident-${Date.now()}`,
      authorName: payload.reportedBy,
      authorInitial: payload.reportedBy[0]?.toUpperCase() ?? 'U',
      avatarColor: '#1D4ED8',
      location: payload.location,
      timeAgo: 'Just now',
      message: payload.description,
      status: payload.status,
      likes: 0,
      likedByUser: false,
    };

    if (activeTab === 'incidents') {
      setPosts((currentPosts) => [newIncident, ...currentPosts]);
    }

    void fetch(`${API_BASE_URL}/api/community/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(() => undefined);
  };

  useEffect(() => {
    refresh();
  }, [activeTab]);

  return {
    posts,
    isLoading,
    activeTab,
    setActiveTab,
    handleLike,
    handleShareUpdate,
    handleReportIncident,
    refresh,
  };
};
