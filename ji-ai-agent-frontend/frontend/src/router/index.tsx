import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Spinner } from '@/components/LoadingAnimation'

const HomePage = lazy(() => import('@/pages/HomePage'))
const LoveAppPage = lazy(() => import('@/pages/LoveAppPage'))
const ManusAppPage = lazy(() => import('@/pages/ManusAppPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner size={32} className="text-primary" />
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<PageLoader />}>
        <HomePage />
      </Suspense>
    ),
  },
  {
    path: '/love',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoveAppPage />
      </Suspense>
    ),
  },
  {
    path: '/manus',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ManusAppPage />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
