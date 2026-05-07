/**
 * Shared TypeScript types for SmartFlow NLEX
 * Used by both frontend (React Native) and backend (Node.js/Express)
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export enum SegmentStatus {
  NORTHBOUND = 'northbound',
  SOUTHBOUND = 'southbound',
  EASTBOUND = 'eastbound',
  WESTBOUND = 'westbound',
}

export enum TrafficCondition {
  NORMAL = 'normal',
  CONGESTED = 'congested',
  ACCIDENT = 'accident',
  CONSTRUCTION = 'construction',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

// ============================================================================
// API RESPONSE/REQUEST TYPES
// ============================================================================

export interface TrafficData {
  id: string;
  roadName: string;
  duration: number; // in minutes
  condition: TrafficCondition;
  lastUpdated: string; // ISO 8601 timestamp
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface SegmentStatusData {
  id: string;
  direction: SegmentStatus;
  startingPoint: string;
  destination: string;
  condition: TrafficCondition;
  distance: number; // in km
  estimatedTime: number; // in minutes
}

export interface EventForecast {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  timestamp: string; // ISO 8601 timestamp
  affectedSegments: string[]; // segment IDs
}

export interface HotspotData {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  reason: string; // e.g., "congestion", "accident", "construction"
  severity: AlertSeverity;
  timestamp: string; // ISO 8601 timestamp
}

export interface UserProfile {
  id: string;
  displayName: string;
  username: string;
  email: string;
  avatarUri?: string;
}

export interface SettingsState {
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
  language: string;
}

export type TrafficStatus = 'smooth' | 'moderate' | 'heavy' | 'incident';

export type ActiveCommunityTab = 'community' | 'incidents';

export interface CommunityPost {
  id: string;
  authorName: string;
  authorInitial: string;
  avatarColor: string;
  location: string;
  timeAgo: string;
  message: string;
  status: TrafficStatus;
  likes: number;
  likedByUser: boolean;
}

export interface DashboardData {
  traffic: TrafficData[];
  segments: SegmentStatusData[];
  forecasts: EventForecast[];
  hotspots: HotspotData[];
  user: UserProfile;
}

// ============================================================================
// API ENDPOINTS RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardResponse extends ApiResponse<DashboardData> {}

export interface TrafficResponse extends ApiResponse<TrafficData[]> {}

export interface SegmentsResponse extends ApiResponse<SegmentStatusData[]> {}

export interface ForecastsResponse extends ApiResponse<EventForecast[]> {}

export interface HotspotsResponse extends ApiResponse<HotspotData[]> {}

export interface UserResponse extends ApiResponse<UserProfile> {}

// ============================================================================
// REQUEST PAYLOADS
// ============================================================================

export interface DashboardRequestParams {
  includeForecasts?: boolean;
  includeHotspots?: boolean;
  radius?: number; // in km, for location-based queries
}

export interface UpdateUserRequest {
  displayName?: string;
  username?: string;
  email?: string;
  avatarUri?: string;
}

export interface ReportIncidentPayload {
  location: string;
  description: string;
  status: TrafficStatus;
  reportedBy: string;
}

export interface ShareUpdatePayload {
  location: string;
  message: string;
  status: TrafficStatus;
  postedBy: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
