import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { medicationApi, medicationLogApi, medicationInfoApi } from '@/db/api';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, Trash2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Medication, MedicationLog, MedicationInfo } from '@/types';
import { useMedicationAI } from '@/hooks/useAI';
import { Bot, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function MedicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [medication, setMedication] = useState<Medication | null>(null);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [medicationInfo, setMedicationInfo] = useState<MedicationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const { getInfo: getAIInfo, data: aiData, loading: aiLoading, error: aiError } = useMedicationAI();

  useEffect(() => {
    if (!id || !user) return;

    const loadData = async () => {
      try {
        const [medData, logsData] = await Promise.all([
          medicationApi.getMedication(id),
          medicationLogApi.getLogsByMedication(id),
        ]);

        setMedication(medData);
        setLogs(logsData);

        if (medData) {
          const info = await medicationInfoApi.getMedicationInfo(medData.name);
          setMedicationInfo(info);
        }
      } catch (error) {
        console.error('Error loading medication:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, user]);

  const handleDelete = async () => {
    if (!id) return;

    try {
      await medicationApi.deleteMedication(id);
      toast({
        title: 'Medication deleted',
        description: 'The medication has been removed.',
      });
      navigate('/dashboard/medications');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete medication.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-muted" />
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  if (!medication) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Medication not found</p>
          <Button onClick={() => navigate('/dashboard/medications')} className="mt-4">
            Back to Medications
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/medications')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{medication.name}</h1>
          <p className="text-muted-foreground">{medication.dosage}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(`/dashboard/medications/edit/${id}`)}>
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Medication</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this medication? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="info">Information</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medication Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {medication.photo_url && (
                <img
                  src={medication.photo_url}
                  alt={medication.name}
                  className="h-48 w-48 rounded-lg object-cover"
                />
              )}
              <div className="grid gap-4 xl:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Frequency</p>
                  <p className="text-base">{medication.frequency.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                  <p className="text-base">{new Date(medication.start_date).toLocaleDateString()}</p>
                </div>
                {medication.end_date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">End Date</p>
                    <p className="text-base">{new Date(medication.end_date).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reminder Times</p>
                  <p className="text-base">{medication.reminder_times.join(', ')}</p>
                </div>
                {medication.remaining_quantity !== null && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Remaining Quantity</p>
                    <p className="text-base">{medication.remaining_quantity}</p>
                  </div>
                )}
              </div>
              {medication.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-base">{medication.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medication History</CardTitle>
              <CardDescription>Your recent medication logs</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No history yet</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {new Date(log.scheduled_time).toLocaleString()}
                        </p>
                        {log.taken_time && (
                          <p className="text-sm text-muted-foreground">
                            Taken at: {new Date(log.taken_time).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          log.status === 'taken'
                            ? 'default'
                            : log.status === 'missed'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medication Information</CardTitle>
              <CardDescription>Important details about this medication</CardDescription>
            </CardHeader>
            <CardContent>
              {medicationInfo ? (
                <div className="space-y-4">
                  {medicationInfo.uses && (
                    <div>
                      <h3 className="font-semibold mb-2">Uses</h3>
                      <p className="text-muted-foreground">{medicationInfo.uses}</p>
                    </div>
                  )}
                  {medicationInfo.side_effects && (
                    <div>
                      <h3 className="font-semibold mb-2">Side Effects</h3>
                      <p className="text-muted-foreground">{medicationInfo.side_effects}</p>
                    </div>
                  )}
                  {medicationInfo.contraindications && (
                    <div>
                      <h3 className="font-semibold mb-2">Contraindications</h3>
                      <p className="text-muted-foreground">{medicationInfo.contraindications}</p>
                    </div>
                  )}
                  {medicationInfo.drug_interactions && (
                    <div>
                      <h3 className="font-semibold mb-2">Drug Interactions</h3>
                      <p className="text-muted-foreground">{medicationInfo.drug_interactions}</p>
                    </div>
                  )}
                  {medicationInfo.dosage_recommendations && (
                    <div>
                      <h3 className="font-semibold mb-2">Dosage Recommendations</h3>
                      <p className="text-muted-foreground">{medicationInfo.dosage_recommendations}</p>
                    </div>
                  )}
                  {medicationInfo.storage_instructions && (
                    <div>
                      <h3 className="font-semibold mb-2">Storage Instructions</h3>
                      <p className="text-muted-foreground">{medicationInfo.storage_instructions}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No detailed information available for this medication</p>

                  {/* AI Integration */}
                  {!aiData && !aiLoading && (
                    <Button
                      variant="outline"
                      onClick={() => medication && getAIInfo(medication.name)}
                      className="gap-2"
                    >
                      <Bot className="h-4 w-4" />
                      Ask AI about this medication
                    </Button>
                  )}

                  {aiLoading && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Fetching AI explanation...
                    </div>
                  )}

                  {aiError && (
                    <p className="text-sm text-destructive mt-2">{aiError}</p>
                  )}

                  {aiData && (
                    <div className="mt-6 text-left p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">AI Explanation</h4>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-line text-sm">
                        {aiData}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
