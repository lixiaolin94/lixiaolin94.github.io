import { createBrowserRouter } from 'react-router';
import { ErrorBoundary } from '@/routes/error';

export const router = createBrowserRouter([
  {
    path: '/',
    lazy: () => import('@/routes/root'),
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, lazy: () => import('@/routes/home') },
      { path: 'tools', lazy: () => import('@/routes/tools/index') },
      { path: 'tools/scroll-target', lazy: () => import('@/routes/tools/scroll-target') },
      { path: 'tools/calculate-scroll-target', lazy: () => import('@/routes/tools/scroll-target') },
      { path: 'tools/path-interpolator', lazy: () => import('@/routes/tools/path-interpolator') },
      { path: 'tools/blur-to-gradient', lazy: () => import('@/routes/tools/blur-to-gradient') },
      { path: 'tools/lottie-base64', lazy: () => import('@/routes/tools/lottie-base64') },
      { path: 'tools/lottie-image-to-base64', lazy: () => import('@/routes/tools/lottie-base64') },
      { path: 'tools/timing', lazy: () => import('@/routes/tools/timing') },
      { path: 'demos', lazy: () => import('@/routes/demos/index') },
      { path: 'demos/squircles', lazy: () => import('@/routes/demos/squircles') },
      { path: 'demos/rounded-polygon', lazy: () => import('@/routes/demos/rounded-polygon') },
      { path: 'demos/voice-visualizer', lazy: () => import('@/routes/demos/voice-visualizer') },
      { path: 'demos/openai-voice-visualizer', lazy: () => import('@/routes/demos/voice-visualizer') },
      { path: 'blog', lazy: () => import('@/routes/blog/index') },
      { path: 'blog/:slug', lazy: () => import('@/routes/blog/post') },
      { path: '*', lazy: () => import('@/routes/not-found') }
    ]
  }
]);
