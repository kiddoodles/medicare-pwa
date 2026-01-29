import { DashboardLayout } from './DashboardLayout';
import ProtectedRoute from '@/ProtectedRoute';

export default function ProtectedLayout() {
    return (
        <ProtectedRoute>
            <DashboardLayout />
        </ProtectedRoute>
    );
}
