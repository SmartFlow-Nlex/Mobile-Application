import { Router, Request, Response } from 'express';
import { DashboardResponse, DashboardData, TrafficCondition, SegmentStatus, AlertSeverity } from '@smartflow/shared';

const router: Router = Router();

/**
 * Dashboard Routes
 * GET /api/v1/dashboard - Fetch aggregated dashboard data
 */
router.get('/', (_req: Request, res: Response): void => {
  try {
    // Mock aggregated dashboard data
    const dashboardData: DashboardData = {
      traffic: [
        {
          id: '1',
          roadName: 'NLEX Traffic',
          duration: 12,
          condition: 'normal' as TrafficCondition,
          lastUpdated: new Date().toISOString(),
          coordinates: { latitude: 14.5994, longitude: 120.9842 },
        },
      ],
      segments: [
        {
          id: 'seg1',
          direction: 'northbound' as SegmentStatus,
          startingPoint: 'Manila',
          destination: 'Quezon City',
          condition: 'normal' as TrafficCondition,
          distance: 15,
          estimatedTime: 25,
        },
        {
          id: 'seg2',
          direction: 'southbound' as SegmentStatus,
          startingPoint: 'Quezon City',
          destination: 'Manila',
          condition: 'congested' as TrafficCondition,
          distance: 15,
          estimatedTime: 45,
        },
      ],
      forecasts: [
        {
          id: 'fc1',
          title: 'Featured at DMS Panalo Grounds',
          description: 'Event expected at 6:10 a.m.',
          severity: 'medium' as AlertSeverity,
          timestamp: new Date().toISOString(),
          affectedSegments: ['seg1'],
        },
      ],
      hotspots: [
        {
          id: 'hs1',
          name: 'Sideroad Entry',
          location: { latitude: 14.5994, longitude: 120.9842 },
          reason: 'congestion',
          severity: 'medium' as AlertSeverity,
          timestamp: new Date().toISOString(),
        },
      ],
      user: {
        id: '1',
        displayName: 'NLEX Traveler',
        username: 'nlextraveler',
        email: 'user@example.com',
        avatarUri: undefined,
      },
    };

    const response: DashboardResponse = {
      success: true,
      data: dashboardData,
    };

    res.json(response);
  } catch (error) {
    console.error('[Dashboard Error]', error);
    const response: DashboardResponse = {
      success: false,
      error: 'Failed to fetch dashboard data',
    };
    res.status(500).json(response);
  }
});

export default router;
