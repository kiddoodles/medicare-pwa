
import SignInPage from '@/pages/SignInPage';
import SignUpPage from '@/pages/SignUpPage';
import OnboardingPage from '@/pages/OnboardingPage';
import DashboardPage from '@/pages/DashboardPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import MedicationListPage from '@/pages/MedicationListPage';
import MedicationDetailPage from '@/pages/MedicationDetailPage';
import AddMedicationPage from '@/pages/AddMedicationPage';
import ScannerPage from '@/pages/ScannerPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import HealthJournalPage from '@/pages/HealthJournalPage';
import DrugInfoPage from '@/pages/DrugInfoPage';
import MedicalHistoryPage from '@/pages/MedicalHistoryPage';
import AdminPage from '@/pages/AdminPage';
import NotFound from '@/pages/NotFound';

import SplashPage from '@/pages/SplashPage';
import ProtectedLayout from '@/components/layouts/ProtectedLayout';

const routes = [
  // ✅ ROOT FIX
  {
    path: '/',
    element: <SplashPage />,
  },

  // 🔓 Public
  { path: '/signin', element: <SignInPage /> },
  { path: '/signup', element: <SignUpPage /> },

  // ⚠️ Onboarding (Separate layout)
  { path: '/onboarding', element: <OnboardingPage /> },

  // 🔒 Protected (Nested under /dashboard)
  {
    path: '/dashboard',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'medications', element: <MedicationListPage /> },
      { path: 'medications/add', element: <AddMedicationPage /> },
      { path: 'medications/edit/:id', element: <AddMedicationPage /> },
      { path: 'medications/:id', element: <MedicationDetailPage /> },
      { path: 'scanner', element: <ScannerPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'health-journal', element: <HealthJournalPage /> },
      { path: 'drug-info', element: <DrugInfoPage /> },
      { path: 'medical-history', element: <MedicalHistoryPage /> }, // New Route
      { path: 'admin', element: <AdminPage /> },
    ],
  },

  // ❌ 404
  { path: '*', element: <NotFound /> },
];

export default routes;