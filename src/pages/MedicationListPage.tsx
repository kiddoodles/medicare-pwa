import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { medicationApi } from '@/db/api';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Plus, Pill, Calendar, Clock } from 'lucide-react';
import type { Medication } from '@/types';

export default function MedicationListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadMedications = async () => {
      try {
        const data = await medicationApi.getMedications(user.id);
        setMedications(data);
      } catch (error) {
        console.error('Error loading medications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMedications();
  }, [user]);

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      once_daily: 'Once Daily',
      twice_daily: 'Twice Daily',
      three_times_daily: '3x Daily',
      four_times_daily: '4x Daily',
      as_needed: 'As Needed',
      custom: 'Custom',
    };
    return labels[frequency] || frequency;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-muted" />
        <div className="grid gap-4">
          <Skeleton className="h-32 bg-muted" />
          <Skeleton className="h-32 bg-muted" />
          <Skeleton className="h-32 bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Medications</h1>
          <p className="text-muted-foreground">Manage all your medications</p>
        </div>
        <Button onClick={() => navigate('/dashboard/medications/add')} className="w-full xl:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Medication
        </Button>
      </div>

      {medications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Pill className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No medications yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by adding your first medication to track your adherence
            </p>
            <Button onClick={() => navigate('/dashboard/medications/add')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Medication
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {medications.map((medication) => (
            <Card
              key={medication.id}
              className="cursor-pointer hover:shadow-hover transition-shadow"
              onClick={() => navigate(`/dashboard/medications/${medication.id}`)}
            >
              <CardHeader>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex gap-4">
                    {medication.photo_url && (
                      <img
                        src={medication.photo_url}
                        alt={medication.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <CardTitle className="text-xl">{medication.name}</CardTitle>
                      <CardDescription>{medication.dosage}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">{getFrequencyLabel(medication.frequency)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Started: {new Date(medication.start_date).toLocaleDateString()}
                    </span>
                  </div>
                  {medication.reminder_times.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        Times: {medication.reminder_times.join(', ')}
                      </span>
                    </div>
                  )}
                  {medication.remaining_quantity !== null && (
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      <span>
                        Remaining: {medication.remaining_quantity}
                      </span>
                    </div>
                  )}
                </div>
                {medication.notes && (
                  <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                    {medication.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
