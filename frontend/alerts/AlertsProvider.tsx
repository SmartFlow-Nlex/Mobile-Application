import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

/**
 * Alert state, lifted out of the Alerts screen.
 *
 * The tab bar has to show an unread badge, and a tab bar cannot reach into a
 * screen's local state - nor can it rely on that screen being mounted, since a
 * user who has never opened Alerts still needs to see the badge. So the state
 * lives above both.
 */

export type AlertTone = 'critical' | 'warning';

/**
 * Maintenance notices are grouped separately because they behave differently
 * from traffic alerts: scheduled rather than urgent, and they arrive steadily.
 * Mixed into one list they bury the incidents a driver needs to see now.
 */
export type AlertCategory = 'maintenance' | 'traffic';

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  priority: 'high priority' | 'medium priority';
  icon: keyof typeof Ionicons.glyphMap;
  tone: AlertTone;
  unread: boolean;
  category: AlertCategory;
}

const initialAlerts: AlertItem[] = [
  {
    id: 'high-traffic-bocaue',
    title: 'High Traffic Predicted',
    message:
      'Severe congestion expected at Bocaue Exit tomorrow 5-8 PM due to Philippine Arena concert.',
    timeAgo: '30m ago',
    priority: 'high priority',
    icon: 'trending-up-outline',
    tone: 'critical',
    unread: true,
    category: 'traffic',
  },
  {
    id: 'incident-cluster-marilao',
    title: 'Incident Cluster Detected',
    message:
      'Multiple accident reports near Marilao. ML system suggests avoiding this segment.',
    timeAgo: '45m ago',
    priority: 'high priority',
    icon: 'warning-outline',
    tone: 'critical',
    unread: true,
    category: 'traffic',
  },
  {
    id: 'maintenance-balintawak',
    title: 'Scheduled Maintenance Tonight',
    message:
      'Road resurfacing at Balintawak begins at 11 PM. Expect lane reductions and slower flow.',
    timeAgo: '1h ago',
    priority: 'medium priority',
    icon: 'construct-outline',
    tone: 'warning',
    unread: false,
    category: 'maintenance',
  },
  {
    id: 'maintenance-candaba',
    title: 'Candaba Viaduct Re-blocking',
    message:
      'Right lane closed northbound at the Candaba Viaduct until Friday 5 AM for deck repairs.',
    timeAgo: '3h ago',
    priority: 'medium priority',
    icon: 'construct-outline',
    tone: 'warning',
    unread: true,
    category: 'maintenance',
  },
  {
    id: 'maintenance-sta-rita-joints',
    title: 'Bridge Joint Repairs at Sta. Rita',
    message:
      'Right lane closed southbound near Sta. Rita Guiguinto this weekend for bridge joint replacement.',
    timeAgo: '5h ago',
    priority: 'medium priority',
    icon: 'construct-outline',
    tone: 'warning',
    unread: false,
    category: 'maintenance',
  },
  {
    id: 'maintenance-marilao-drainage',
    title: 'Drainage Works at Marilao',
    message:
      'Shoulder closed southbound near Marilao Exit for drainage clearing, 9 PM to 4 AM nightly.',
    timeAgo: '6h ago',
    priority: 'medium priority',
    icon: 'construct-outline',
    tone: 'warning',
    unread: false,
    category: 'maintenance',
  },
];

interface AlertsContextValue {
  alerts: AlertItem[];
  /** Every unread alert, both categories - what the tab badge counts. */
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const AlertsContext = createContext<AlertsContextValue | null>(null);

export const AlertsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);

  const markAsRead = useCallback((id: string): void => {
    setAlerts((current) =>
      current.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
  }, []);

  const markAllAsRead = useCallback((): void => {
    setAlerts((current) => current.map((item) => ({ ...item, unread: false })));
  }, []);

  const unreadCount = useMemo(
    () => alerts.filter((item) => item.unread).length,
    [alerts]
  );

  const value = useMemo(
    () => ({ alerts, unreadCount, markAsRead, markAllAsRead }),
    [alerts, unreadCount, markAsRead, markAllAsRead]
  );

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
};

export function useAlerts(): AlertsContextValue {
  const value = useContext(AlertsContext);
  if (value === null) {
    throw new Error('useAlerts must be used inside an AlertsProvider');
  }
  return value;
}
