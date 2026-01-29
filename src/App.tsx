import { useRoutes, BrowserRouter } from 'react-router-dom';
import { Suspense } from 'react';
import routes from './routes';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { MedicationReminder } from '@/components/MedicationReminder';

function AppRoutes() {
  const element = useRoutes(routes);
  return element;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MedicationReminder />
        <Suspense fallback={<div>Loading...</div>}>
          <AppRoutes />
        </Suspense>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}