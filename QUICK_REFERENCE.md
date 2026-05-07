# SmartFlow NLEX - Quick Reference

## 📁 Complete Project Structure

```
Mobile/
├── shared/
│   ├── package.json
│   ├── types/
│   │   └── index.ts ⭐ (Shared types - THE SINGLE SOURCE OF TRUTH)
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── app.json
│   ├── app/
│   │   ├── _layout.tsx ⭐ (Root navigation)
│   │   ├── index.tsx (Splash screen)
│   │   └── (tabs)/
│   │       ├── _layout.tsx (Tab navigation)
│   │       ├── dashboard.tsx ⭐ (Main screen - your dashboard)
│   │       ├── alerts.tsx
│   │       └── profile.tsx
│   ├── components/ ⭐ (Reusable components)
│   │   ├── TrafficCard.tsx
│   │   ├── SegmentStatusCard.tsx
│   │   ├── EventForecastCard.tsx
│   │   └── HotspotCard.tsx
│   └── constants/
│       ├── colors.ts ⭐ (All colors used in app)
│       └── typography.ts ⭐ (Font sizes, weights)
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── index.ts ⭐ (Express server)
│       └── routes/ ⭐ (API endpoints)
│           ├── dashboard.ts
│           ├── traffic.ts
│           ├── segments.ts
│           ├── forecasts.ts
│           ├── hotspots.ts
│           └── users.ts
│
├── package.json ⭐ (Root workspace)
├── README.md
├── DEVELOPER_GUIDE.md
├── SETUP_SUMMARY.md
└── .gitignore
```

## ⚡ Essential Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install all dependencies |
| `npm run frontend` | Start Expo dev server |
| `npm run backend` | Start Express server (port 3000) |
| `npm run dev` | Start both frontend & backend |
| `npm run type-check` | Check TypeScript types |

## 🔌 API Quick Reference

| Endpoint | Method | Response Type |
|----------|--------|---------------|
| `/api/v1/dashboard` | GET | `DashboardResponse` |
| `/api/v1/traffic` | GET | `TrafficResponse` |
| `/api/v1/segments` | GET | `SegmentsResponse` |
| `/api/v1/forecasts` | GET | `ForecastsResponse` |
| `/api/v1/hotspots` | GET | `HotspotsResponse` |
| `/api/v1/users/current` | GET | `UserResponse` |

## 🎨 Colors Quick Reference

```tsx
import { Colors } from '@constants/colors';

Colors.primary       // #007AFF (Blue)
Colors.success       // #34C759 (Green)
Colors.warning       // #FF9500 (Orange)
Colors.danger        // #FF3B30 (Red)
Colors.background    // #1a1a1a (Dark)
Colors.surface       // #2a2a2a (Light Dark)
Colors.text          // #FFFFFF (White)
Colors.textSecondary // #A0A0A0 (Gray)
```

## 📝 Common Code Snippets

### Create Typed Component
```tsx
interface MyComponentProps {
  title: string;
  onPress?: () => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: Colors.surface },
  title: { fontSize: Typography.fontSize.lg, color: Colors.text },
});

export default MyComponent;
```

### Fetch Data from Backend
```tsx
const [data, setData] = useState<TrafficData[] | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetch = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/v1/traffic');
      const json = (await res.json()) as TrafficResponse;
      if (json.success) setData(json.data);
      else throw new Error(json.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };
  fetch();
}, []);

return loading ? <ActivityIndicator /> : data ? <View>...</View> : <Text>{error}</Text>;
```

### Create API Route
```ts
import { Router, Request, Response } from 'express';
import { MyDataResponse, MyData } from '@smartflow/shared';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  const response: MyDataResponse = {
    success: true,
    data: [],
  };
  res.json(response);
});

export default router;
```

### Use Navigation
```tsx
import { useRouter } from 'expo-router';

const MyComponent = () => {
  const router = useRouter();

  return (
    <TouchableOpacity onPress={() => router.push('/(tabs)/dashboard')}>
      <Text>Go to Dashboard</Text>
    </TouchableOpacity>
  );
};
```

## 🚨 Common Errors

| Error | Solution |
|-------|----------|
| "Cannot find module" | Check import path, run `npm install` |
| "Port 3000 in use" | Kill process: `lsof -ti:3000 \| xargs kill -9` |
| "Implicit any" | Add explicit type annotation |
| "No Internet" on Expo | Check backend is running on `localhost:3000` |
| "CORS error" | Backend has CORS enabled by default |

## 📚 File Purpose Guide

| File | Purpose |
|------|---------|
| `shared/types/index.ts` | API contracts - NEVER duplicate types |
| `frontend/constants/colors.ts` | All colors - import instead of hardcoding |
| `frontend/constants/typography.ts` | Font styles - use for consistency |
| `backend/src/index.ts` | Server setup - register routes here |
| `backend/src/routes/*.ts` | API endpoints - one file per resource |

## 🔄 Workflow: Adding a New Feature

### 1. Define Types
```ts
// shared/types/index.ts
export interface MyFeature { /* ... */ }
export interface MyFeatureResponse extends ApiResponse<MyFeature[]> {}
```

### 2. Create API Route
```ts
// backend/src/routes/myfeature.ts
router.get('/', (req, res) => {
  const response: MyFeatureResponse = { success: true, data: [] };
  res.json(response);
});
```

### 3. Register Route
```ts
// backend/src/index.ts
import myfeatureRoutes from '@routes/myfeature';
app.use('/api/v1/myfeature', myfeatureRoutes);
```

### 4. Use in Frontend
```tsx
// frontend/app/(tabs)/myscreen.tsx
const [data, setData] = useState<MyFeature[]>([]);
useEffect(() => {
  fetch('http://localhost:3000/api/v1/myfeature')
    .then(r => r.json() as Promise<MyFeatureResponse>)
    .then(j => setData(j.data || []));
}, []);
```

## ✅ Checklist: Before Committing Code

- [ ] No `any` types (run `npm run type-check`)
- [ ] All components have typed Props interface
- [ ] All API responses use shared types
- [ ] Styles use `StyleSheet.create()`
- [ ] Colors imported from `constants/colors`
- [ ] Typography imported from `constants/typography`
- [ ] No hardcoded strings (extract to constants if needed)
- [ ] No console.log statements (for production code)
- [ ] imports are organized (React, RN, local, types)

## 🎯 Architecture: Data Flow

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (React Native / Expo)                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Screen Component (e.g., dashboard.tsx)          │   │
│  │ - useState for data/loading/error                │   │
│  │ - useEffect for API calls                        │   │
│  │ - Renders child components                       │   │
│  └─────────────────────────────────────────────────┘   │
│         │                                               │
│         ↓ (fetch/axios)                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Network Request (http://localhost:3000/api...)  │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ↓ (HTTP)
┌────────────────────────────────────────────────────────┐
│  BACKEND (Express.js / Node.js)                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Route Handler (e.g., routes/dashboard.ts)       │  │
│  │ - Validates request                              │  │
│  │ - Retrieves data (mock/database)                 │  │
│  │ - Sends typed response                           │  │
│  └─────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ↓ (JSON)
┌────────────────────────────────────────────────────────┐
│  SHARED TYPES                                          │
│  (shared/types/index.ts)                               │
│  - Defines all request/response shapes                 │
│  - Used by both frontend & backend                     │
└────────────────────────────────────────────────────────┘
```

## 🎨 Component Hierarchy

```
App (_layout.tsx)
├── RootStack (Stack Navigator)
└── Tabs (_layout.tsx)
    ├── Dashboard (dashboard.tsx)
    │   ├── TrafficCard
    │   ├── SegmentStatusCard
    │   ├── EventForecastCard
    │   └── HotspotCard
    ├── Alerts (alerts.tsx)
    └── Profile (profile.tsx)
```

## 💡 Pro Tips

1. **Always check TypeScript errors first** - `npm run type-check`
2. **Keep components small** - Single responsibility principle
3. **Reuse colors and typography** - Never hardcode values
4. **Test API endpoints** - Use `http://localhost:3000/health` to check backend
5. **Use Expo Go app** - Fastest way to test on your phone
6. **Keep shared types updated** - Single source of truth
7. **Use path aliases** - Makes imports cleaner and refactoring easier

## 🆘 Getting Help

- **React Native**: https://reactnative.dev/docs
- **Expo**: https://docs.expo.dev/
- **Expo Router**: https://expo.github.io/router/
- **Express.js**: https://expressjs.com/
- **TypeScript**: https://www.typescriptlang.org/docs/

---

**Last Updated**: January 2025 | **Version**: 1.0.0
