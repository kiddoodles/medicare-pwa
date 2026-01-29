import { medicationLogApi } from '@/db/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { MedicationWithLogs, MedicationLog } from '@/types';

interface MedicationScheduleProps {
  medications: MedicationWithLogs[];
  upcomingDoses: MedicationLog[];
}

export function MedicationSchedule({ medications, upcomingDoses }: MedicationScheduleProps) {
  const { toast } = useToast();

  const handleMarkAsTaken = async (logId: string, medicationId: string) => {
    try {
      await medicationLogApi.markAsTaken(logId, medicationId);
      toast({
        title: 'Marked as taken',
        description: 'Medication logged successfully.',
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark medication as taken.',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsSkipped = async (logId: string) => {
    try {
      await medicationLogApi.markAsSkipped(logId);
      toast({
        title: 'Marked as skipped',
        description: 'Medication skipped.',
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark medication as skipped.',
        variant: 'destructive',
      });
    }
  };

  if (upcomingDoses.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
        <p className="text-muted-foreground">No upcoming doses for today!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {upcomingDoses.map((dose) => {
        const medication = medications.find(m => m.id === dose.medication_id);
        if (!medication) return null;

        return (
          <div
            key={dose.id}
            className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between p-4 border border-border rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{medication.name}</p>
                <p className="text-sm text-muted-foreground">{medication.dosage}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(dose.scheduled_time).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleMarkAsTaken(dose.id, medication.id)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Take
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkAsSkipped(dose.id)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Skip
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
