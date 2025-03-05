import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('../components/pages/Home/Home'));
const CommunityPage = React.lazy(() => import('../components/pages/Community/Community'));
const MarketPage = React.lazy(() => import('../components/pages/Market/Market'));
const ProfilePage = React.lazy(() => import('../components/pages/Profile/Profile'));
const AuthPage = React.lazy(() => import('../components/pages/Auth/Auth'));
const NotFoundPage = React.lazy(() => import('../components/pages/NotFound/NotFound'));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: (
          <React.Suspense fallback={<LoadingFallback />}>
            <HomePage />
          </React.Suspense>
        ),
      },
      {
        path: 'community',
        element: (
          <React.Suspense fallback={<LoadingFallback />}>
            <CommunityPage />
          </React.Suspense>
        ),
      },
      {
        path: 'market',
        element: (
          <React.Suspense fallback={<LoadingFallback />}>
            <MarketPage />
          </React.Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <React.Suspense fallback={<LoadingFallback />}>
            <ProfilePage />
          </React.Suspense>
        ),
      },
    ],
  },
  {
    path: '/auth',
    element: (
      <React.Suspense fallback={<LoadingFallback />}>
        <AuthPage />
      </React.Suspense>
    ),
  },
  {
    path: '*',
    element: (
      <React.Suspense fallback={<LoadingFallback />}>
        <NotFoundPage />
      </React.Suspense>
    ),
  },
]);