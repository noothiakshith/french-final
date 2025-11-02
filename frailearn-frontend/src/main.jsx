import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './components/NotificationSystem';
import './index.css';

import App from './App';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import LevelSelectPage from './pages/LevelSelectPage'; // 1. Import the new page
import DashboardPage from './pages/DashboardPage'; // 2. Import the dashboard page
import PlacementTestPage from './pages/PlacementTestPage'; // 3. Import the placement test page
import ChapterDetailPage from './pages/ChapterDetailPage'; // 4. Import the chapter detail page
import LessonPage from './pages/LessonPage'; // 5. Import the lesson page
import BridgeCoursePage from './pages/BridgeCoursePage'; // 6. Import the bridge course page
import BridgeChapterDetailPage from './pages/BridgeChapterDetailPage'; // 7. Import the bridge chapter detail page
import ProgressTestPage from './pages/ProgressTestPage'; // 8. Import the progress test page
import BridgeFinalTestPage from './pages/BridgeFinalTestPage'; // 9. Import the bridge final test page
import RemedialChapterPage from './pages/RemedialChapterPage'; // 10. Import the remedial chapter page
import RemedialListPage from './pages/RemedialListPage'; // 10b. Import the remedial list page
import RemedialManagementPage from './pages/RemedialManagementPage'; // 10c. Import the remedial management page
import FlashcardReviewPage from './pages/FlashcardReviewPage'; // 11. Import the flashcard review page
import StatsPage from './pages/StatsPage'; // 12. Import the stats page
import CurriculumPage from './pages/CurriculumPage'; // 13. Import the curriculum page
import ProtectedRoute from './components/ProtectedRoute'; // 14. Import the protector

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/login", element: <LoginPage /> },
  
  // 3. Add the protected route
  {
    element: <ProtectedRoute />, // This layout component checks for auth
    children: [
      // All routes inside here are now protected
      {
        path: "/level-select",
        element: <LevelSelectPage />,
      },
      // 4. Add the dashboard route
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      // 5. Add the placement test route
      {
        path: "/placement-test",
        element: <PlacementTestPage />,
      },
      // 6. Add the dynamic chapter detail route
      {
        path: "/chapters/:chapterId",
        element: <ChapterDetailPage />,
      },
      // 7. Add the dynamic lesson route
      {
        path: "/lessons/:lessonId",
        element: <LessonPage />,
      },
      // 8. Add bridge course routes
      {
        path: "/bridge-course",
        element: <BridgeCoursePage />,
      },
      {
        path: "/bridge-course/chapters/:chapterId",
        element: <BridgeChapterDetailPage />,
      },
      // 9. Add progress test route
      {
        path: "/progress-test/:range",
        element: <ProgressTestPage />,
      },
      // 10. Add bridge final test route
      {
        path: "/bridge-final-test",
        element: <BridgeFinalTestPage />,
      },
      // 11. Add remedial routes
      {
        path: "/remedial",
        element: <RemedialManagementPage />,
      },
      {
        path: "/remedial/:chapterId",
        element: <RemedialChapterPage />,
      },
      // 12. Add flashcard review route
      {
        path: "/flashcards/review",
        element: <FlashcardReviewPage />,
      },
      // 13. Add stats page route
      {
        path: "/stats",
        element: <StatsPage />,
      },
      // 14. Add curriculum page route
      {
        path: "/curriculum",
        element: <CurriculumPage />,
      },
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <NotificationProvider>
        <RouterProvider router={router} />
      </NotificationProvider>
    </ErrorBoundary>
  </React.StrictMode>
);