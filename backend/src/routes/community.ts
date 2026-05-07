import { Router, Request, Response } from 'express';
import {
  ActiveCommunityTab,
  ApiResponse,
  CommunityPost,
  ReportIncidentPayload,
  ShareUpdatePayload,
  TrafficStatus,
} from '@smartflow/shared';

const router: Router = Router();

let communityPosts: CommunityPost[] = [
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

const isIncidentTab = (tab: ActiveCommunityTab, status: TrafficStatus): boolean =>
  tab === 'incidents' ? status === 'incident' : status !== 'incident';

router.get(
  '/posts',
  (
    req: Request<
      Record<string, never>,
      ApiResponse<CommunityPost[]>,
      Record<string, never>,
      { tab?: ActiveCommunityTab; page?: string; limit?: string }
    >,
    res: Response<ApiResponse<CommunityPost[]>>
  ): void => {
    const tab: ActiveCommunityTab = req.query.tab === 'incidents' ? 'incidents' : 'community';
    const page = Math.max(Number.parseInt(req.query.page ?? '1', 10), 1);
    const limit = Math.max(Number.parseInt(req.query.limit ?? '20', 10), 1);

    const filteredPosts = communityPosts.filter((post) => isIncidentTab(tab, post.status));
    const startIndex = (page - 1) * limit;
    const paginatedPosts = filteredPosts.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      data: paginatedPosts,
    });
  }
);

router.post(
  '/posts',
  (
    req: Request<Record<string, never>, ApiResponse<CommunityPost>, ShareUpdatePayload>,
    res: Response<ApiResponse<CommunityPost>>
  ): void => {
    const payload = req.body;
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

    communityPosts = [newPost, ...communityPosts];

    res.status(201).json({
      success: true,
      data: newPost,
    });
  }
);

router.post(
  '/incidents',
  (
    req: Request<Record<string, never>, ApiResponse<CommunityPost>, ReportIncidentPayload>,
    res: Response<ApiResponse<CommunityPost>>
  ): void => {
    const payload = req.body;
    const newPost: CommunityPost = {
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

    communityPosts = [newPost, ...communityPosts];

    res.status(201).json({
      success: true,
      data: newPost,
    });
  }
);

router.patch(
  '/posts/:postId/like',
  (
    req: Request<{ postId: string }, ApiResponse<{ likes: number; liked: boolean }>, { user_id: string }>,
    res: Response<ApiResponse<{ likes: number; liked: boolean }>>
  ): void => {
    const targetPost = communityPosts.find((post) => post.id === req.params.postId);

    if (!targetPost) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Community post not found',
      });
      return;
    }

    targetPost.likedByUser = !targetPost.likedByUser;
    targetPost.likes += targetPost.likedByUser ? 1 : -1;

    res.json({
      success: true,
      data: {
        likes: targetPost.likes,
        liked: targetPost.likedByUser,
      },
    });
  }
);

export default router;
