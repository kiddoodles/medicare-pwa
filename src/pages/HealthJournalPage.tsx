import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { healthJournalApi } from '@/db/api';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, BookHeart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { HealthJournalEntry } from '@/types';

export default function HealthJournalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<HealthJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    symptoms: '',
    mood: '',
    wellness_score: '5',
    notes: '',
  });

  useEffect(() => {
    if (!user) return;

    const loadEntries = async () => {
      try {
        const data = await healthJournalApi.getEntries(user.id);
        setEntries(data);
      } catch (error) {
        console.error('Error loading journal entries:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const newEntry = await healthJournalApi.createEntry({
        user_id: user.id,
        entry_date: formData.entry_date,
        symptoms: formData.symptoms || null,
        mood: formData.mood || null,
        wellness_score: parseInt(formData.wellness_score),
        notes: formData.notes || null,
      });

      setEntries([newEntry, ...entries]);
      setDialogOpen(false);
      setFormData({
        entry_date: new Date().toISOString().split('T')[0],
        symptoms: '',
        mood: '',
        wellness_score: '5',
        notes: '',
      });
      toast({
        title: 'Entry added',
        description: 'Your health journal entry has been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add entry. Please try again.',
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Health Journal</h1>
          <p className="text-muted-foreground">Track your daily health and wellness</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full xl:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New Journal Entry</DialogTitle>
              <DialogDescription>Record your health status for today</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="entry_date">Date</Label>
                <Input
                  id="entry_date"
                  type="date"
                  value={formData.entry_date}
                  onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mood">Mood</Label>
                <Select value={formData.mood} onValueChange={(value) => setFormData({ ...formData, mood: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your mood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="great">😊 Great</SelectItem>
                    <SelectItem value="good">🙂 Good</SelectItem>
                    <SelectItem value="okay">😐 Okay</SelectItem>
                    <SelectItem value="bad">😟 Bad</SelectItem>
                    <SelectItem value="terrible">😢 Terrible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wellness_score">Wellness Score (1-10)</Label>
                <Input
                  id="wellness_score"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.wellness_score}
                  onChange={(e) => setFormData({ ...formData, wellness_score: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="symptoms">Symptoms</Label>
                <Input
                  id="symptoms"
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  placeholder="Any symptoms you're experiencing..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="submit">Save Entry</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookHeart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No journal entries yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start tracking your health and wellness journey
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Entry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                  <CardTitle>{new Date(entry.entry_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardTitle>
                  <div className="flex items-center gap-4">
                    {entry.mood && (
                      <span className="text-sm text-muted-foreground">
                        Mood: {entry.mood}
                      </span>
                    )}
                    {entry.wellness_score && (
                      <span className="text-sm font-medium">
                        Wellness: {entry.wellness_score}/10
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {entry.symptoms && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Symptoms</p>
                    <p>{entry.symptoms}</p>
                  </div>
                )}
                {entry.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p>{entry.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
