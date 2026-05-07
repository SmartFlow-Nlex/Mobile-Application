# SmartFlow NLEX - Developer Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Frontend Development](#frontend-development)
4. [Backend Development](#backend-development)
5. [Working with Shared Types](#working-with-shared-types)
6. [Component Development](#component-development)
7. [API Integration](#api-integration)
8. [Debugging](#debugging)
9. [Common Tasks](#common-tasks)

---

## Project Overview

**SmartFlow NLEX** is a real-time traffic management mobile application built with:
- **Frontend**: React Native + Expo + Expo Router
- **Backend**: Node.js + Express
- **Shared Types**: Central TypeScript type definitions

### Key Principles
✅ **Type Safety**: Strict TypeScript everywhere (no `any` types)
✅ **Single Source of Truth**: Shared types between frontend and backend
✅ **Component-Driven**: Reusable, well-organized components
✅ **Mobile-First**: Optimized for touch interactions
✅ **Dark Theme**: Eye-friendly dark UI

---

## Architecture

### Monorepo Structure

```
root/
├── frontend/        React Native app (Expo + Expo Router)
├── backend/         Node.js API server (Express)
├── shared/          Shared type definitions
└── package.json     Root workspace configuration
```

### Data Flow

```
React Native UI Component
    ↓
Custom Hook (useEffect, useState)
    ↓
API Call (fetch / axios)
    ↓
Express Route Handler
    ↓
Mock Data / Database
    ↓
Response (typed with shared types)
    ↓
Component Updates
```

### Type System

```
shared/types/index.ts (Single Source of Truth)
    ↙                          ↘
Frontend Components         Backend Routes
(Import types)              (Import types)
```

---

## Frontend Development

### File Structure

```
frontend/
├── app/                    Expo Router pages
│   ├── _layout.tsx        Root layout
│   ├── index.tsx          Splash screen
│   └── (tabs)/            Tab-based screens
│       ├── _layout.tsx
│       ├── dashboard.tsx
│       ├── alerts.tsx
│       └── profile.tsx
├── components/            Reusable components
│   ├── TrafficCard.tsx
│   ├── SegmentStatusCard.tsx
│   ├── EventForecastCard.tsx
│   └── HotspotCard.tsx
├── constants/             Theme & constants
│   ├── colors.ts
│   └── typography.ts
├── hooks/                 Custom React hooks
├── types/                 Local TypeScript types
└── app.json              Expo configuration
```

### Creating a New Component

**Step 1: Define Props Interface**
```tsx
// components/MyCard.tsx
interface MyCardProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  isLoading?: boolean;
}
```

**Step 2: Create Component**
```tsx
const MyCard: React.FC<MyCardProps> = ({ 
  title, 
  subtitle, 
  onPress, 
  isLoading 
}) => {
  return (
    // Component JSX
  );
};
```

**Step 3: Define Styles**
```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // All styles here
});
```

**Step 4: Export Component**
```tsx
export default MyCard;
```

### Styling Rules

✅ **DO**: Use `StyleSheet.create()` for all styles
```tsx
const styles = StyleSheet.create({
  container: { flex: 1 },
});
```

❌ **DON'T**: Use inline style objects
```tsx
// ❌ Wrong
<View style={{ flex: 1 }}>
```

❌ **DON'T**: Use hardcoded colors
```tsx
// ❌ Wrong
<View style={{ backgroundColor: '#007AFF' }}>

// ✅ Right
<View style={{ backgroundColor: Colors.primary }}>
```

### Screen Structure

```tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '@constants/colors';
import { Typography } from '@constants/typography';
import { SomeComponent } from '@components/SomeComponent';
import { SomeData } from '@smartflow/shared';

interface DashboardScreenProps {}

const DashboardScreen: React.FC<DashboardScreenProps> = () => {
  const [data, setData] = useState<SomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      // API call here
      const response = await fetch('http://localhost:3000/api/v1/...');
      const json = await response.json();
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingComponent />;
  if (error) return <ErrorComponent error={error} />;

  return (
    <ScrollView style={styles.container}>
      {/* Screen content */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

export default DashboardScreen;
```

### Routing with Expo Router

**File-based routing:**
- `app/index.tsx` → `/`
- `app/(tabs)/dashboard.tsx` → `/(tabs)/dashboard`
- `app/(tabs)/alerts.tsx` → `/(tabs)/alerts`

**Programmatic navigation:**
```tsx
import { useRouter } from 'expo-router';

const MyComponent = () => {
  const router = useRouter();

  const handleNavigate = () => {
    router.push('/(tabs)/dashboard');
    // or
    router.replace('/(tabs)/dashboard');
    // or back
    router.back();
  };

  return <TouchableOpacity onPress={handleNavigate} />;
};
```

---

## Backend Development

### File Structure

```
backend/
├── src/
│   ├── routes/             Route handlers
│   │   ├── dashboard.ts
│   │   ├── traffic.ts
│   │   ├── segments.ts
│   │   ├── forecasts.ts
│   │   ├── hotspots.ts
│   │   └── users.ts
│   ├── controllers/        Business logic (optional)
│   ├── services/           Services (optional)
│   ├── middleware/         Express middleware
│   └── index.ts           Server entry point
└── tsconfig.json
```

### Creating a New Route

**Step 1: Create Route File**
```ts
// backend/src/routes/myfeature.ts
import { Router, Request, Response } from 'express';
import { MyFeatureResponse, MyFeatureData } from '@smartflow/shared';

const router: Router = Router();

router.get('/', (req: Request, res: Response): void => {
  const response: MyFeatureResponse = {
    success: true,
    data: [],
  };
  res.json(response);
});

export default router;
```

**Step 2: Register Route in Index**
```ts
// backend/src/index.ts
import myfeatureRoutes from '@routes/myfeature';

// Add this line after other routes
app.use('/api/v1/myfeature', myfeatureRoutes);
```

**Step 3: Add Types to Shared**
```ts
// shared/types/index.ts
export interface MyFeatureData {
  id: string;
  name: string;
}

export interface MyFeatureResponse extends ApiResponse<MyFeatureData[]> {}
```

### Error Handling

```ts
// ✅ Good error handling
router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    
    if (!id) {
      const response: MyResponse = {
        success: false,
        error: 'Missing ID parameter',
      };
      res.status(400).json(response);
      return;
    }

    // Process request
    const data = { /* ... */ };
    const response: MyResponse = {
      success: true,
      data,
    };
    res.json(response);
  } catch (error) {
    const response: MyResponse = {
      success: false,
      error: 'Internal server error',
    };
    res.status(500).json(response);
  }
});
```

### Middleware

```ts
// Custom middleware for logging
app.use((req: Request, res: Response, next: NextFunction): void => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Route-specific middleware
router.get('/', authenticateUser, (req: Request, res: Response) => {
  // Only called if authenticateUser passes
});
```

---

## Working with Shared Types

### What Goes in Shared Types

✅ **DO** define in `shared/types/index.ts`:
- API request/response shapes
- Data models
- Enums for status codes, directions, etc.
- Common interfaces used by both frontend and backend

```ts
// shared/types/index.ts
export interface TrafficData {
  id: string;
  roadName: string;
  duration: number;
  condition: TrafficCondition;
  lastUpdated: string;
  coordinates: { latitude: number; longitude: number };
}

export interface TrafficResponse extends ApiResponse<TrafficData[]> {}
```

### Using Shared Types

**In Frontend:**
```tsx
import { TrafficData, TrafficResponse } from '@smartflow/shared';

const MyComponent: React.FC = () => {
  const [data, setData] = useState<TrafficData[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/v1/traffic')
      .then((res) => res.json() as Promise<TrafficResponse>)
      .then((json) => setData(json.data || []));
  }, []);

  return (
    // Use data
  );
};
```

**In Backend:**
```ts
import { TrafficData, TrafficResponse } from '@smartflow/shared';

router.get('/', (req: Request, res: Response): void => {
  const data: TrafficData[] = [
    // traffic data
  ];
  
  const response: TrafficResponse = {
    success: true,
    data,
  };
  
  res.json(response);
});
```

### Adding New Types

1. Define in `shared/types/index.ts`
2. Both frontend and backend get the types via npm workspace link
3. Run `npm install` in both workspaces to update

---

## Component Development

### Component Template

```tsx
import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@constants/colors';
import { Typography } from '@constants/typography';
import { SomeType } from '@smartflow/shared';

/**
 * MyComponent
 * 
 * Description of what this component does
 * 
 * @props item - The data item to display
 * @props onPress - Callback when item is pressed
 */
interface MyComponentProps {
  item: SomeType;
  onPress?: () => void;
  isLoading?: boolean;
}

const MyComponent: React.FC<MyComponentProps> = ({
  item,
  onPress,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </TouchableOpacity>
  );
};

export default MyComponent;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginVertical: 8,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
});
```

### Props Best Practices

```tsx
// ✅ Good: Explicit types
interface CardProps {
  title: string;
  description?: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

// ❌ Bad: Implicit any
interface CardProps {
  title: any;
  onPress: any;
}

// ❌ Bad: Using any
const Card: React.FC<any> = (props) => {};
```

---

## API Integration

### Fetch Pattern (Frontend)

```tsx
const [data, setData] = useState<TrafficData[] | null>(null);
const [error, setError] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/traffic');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const json = (await response.json()) as TrafficResponse;
      
      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch data');
      }
      
      setData(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, []);
```

### API Response Structure

All API responses follow this pattern:

```ts
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### Success Response
```json
{
  "success": true,
  "data": [...]
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error code",
  "message": "Human readable error message"
}
```

---

## Debugging

### Frontend Debugging

**Expo Debugger:**
```bash
npm run frontend
# Press 'd' to open debugger menu
```

**Console Logging:**
```tsx
import { useEffect } from 'react';

useEffect(() => {
  console.log('Component mounted');
  console.log({ data });
  return () => console.log('Component unmounted');
}, [data]);
```

**Network Inspection:**
- Use React Native Debugger
- Or use browser DevTools for web

### Backend Debugging

**Console Logging:**
```ts
router.get('/', (req: Request, res: Response) => {
  console.log('[API] GET /api/v1/traffic');
  console.log({ query: req.query });
  // ...
});
```

**Error Stack Traces:**
```ts
try {
  // Code
} catch (error) {
  console.error('[ERROR]', error);
  if (error instanceof Error) {
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
}
```

---

## Common Tasks

### Task: Add a New API Endpoint

1. **Add types to shared:**
```ts
// shared/types/index.ts
export interface MyDataType {
  id: string;
  value: string;
}

export interface MyDataResponse extends ApiResponse<MyDataType[]> {}
```

2. **Create route:**
```ts
// backend/src/routes/mydata.ts
import { MyDataResponse, MyDataType } from '@smartflow/shared';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  const data: MyDataType[] = [];
  const response: MyDataResponse = { success: true, data };
  res.json(response);
});

export default router;
```

3. **Register route:**
```ts
// backend/src/index.ts
import mydataRoutes from '@routes/mydata';
app.use('/api/v1/mydata', mydataRoutes);
```

4. **Call from frontend:**
```tsx
// frontend/app/(tabs)/myscreen.tsx
useEffect(() => {
  fetch('http://localhost:3000/api/v1/mydata')
    .then(r => r.json() as Promise<MyDataResponse>)
    .then(json => setData(json.data || []));
}, []);
```

### Task: Update Component Props

1. Update the interface
2. Update all usages of the component
3. Run type checking: `npm run type-check`

### Task: Change Colors/Theme

Update in `frontend/constants/colors.ts`:
```ts
export const Colors = {
  primary: '#FF0000', // Change primary color
  // ...
};
```

All components using `Colors.primary` will update automatically.

### Task: Add Error Boundary

```tsx
// components/ErrorBoundary.tsx
interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Error caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return <Text>Something went wrong!</Text>;
    }
    return this.props.children;
  }
}
```

---

## Code Quality

### Type Checking

```bash
npm run type-check
```

Ensures:
- No implicit `any` types
- All functions have return types
- All variables are properly typed
- No unused variables/imports

### Naming Conventions

- **Components**: PascalCase (`TrafficCard.tsx`)
- **Screens**: PascalCase (`DashboardScreen.tsx`)
- **Files**: camelCase (`myhelper.ts`) or PascalCase for components
- **Variables**: camelCase (`trafficData`)
- **Constants**: UPPER_SNAKE_CASE or camelCase from objects
- **Interfaces**: PascalCase with `I` or `Props` suffix (`CardProps`, `TrafficData`)

### Import Order

```tsx
// 1. React
import React from 'react';

// 2. React Native / Expo
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';

// 3. Local imports (components, constants)
import MyComponent from '@components/MyComponent';
import { Colors } from '@constants/colors';

// 4. Types
import { MyType } from '@smartflow/shared';
```

---

## Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [Expo Router Docs](https://expo.github.io/router/)
- [Express.js Docs](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Last Updated**: 2024
