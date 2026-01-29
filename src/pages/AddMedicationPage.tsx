import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { medicationApi } from '@/db/api';
import { supabase } from '@/lib/supabaseClient';
import { MainLayout } from '@/components/layouts/MainLayout';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

import type { MedicationFrequency } from '@/types';

export default function AddMedicationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'once_daily' as MedicationFrequency,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    reminder_times: ['09:00'],
    notes: '',
    remaining_quantity: '',
  });

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setFetching(true);
      medicationApi.getMedication(id)
        .then((med) => {
          if (med) {
            setFormData({
              name: med.name,
              dosage: med.dosage,
              frequency: med.frequency,
              start_date: med.start_date,
              end_date: med.end_date || '',
              reminder_times: med.reminder_times || ['09:00'],
              notes: med.notes || '',
              remaining_quantity: med.remaining_quantity?.toString() || '',
            });
            setPhotoUrl(med.photo_url);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch medication for editing", err);
          toast({
            title: "Error",
            description: "Failed to load medication details.",
            variant: "destructive"
          });
        })
        .finally(() => setFetching(false));
    }
  }, [id, toast]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('app-90t1jgnsbt35_medication_images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('app-90t1jgnsbt35_medication_images')
        .getPublicUrl(fileName);

      setPhotoUrl(data.publicUrl);
      toast({
        title: 'Image uploaded',
        description: 'Medication photo uploaded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const commonData = {
        user_id: user.id,
        name: formData.name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        reminder_times: formData.reminder_times,
        photo_url: photoUrl,
        notes: formData.notes || null,
        remaining_quantity: formData.remaining_quantity ? parseInt(formData.remaining_quantity) : null,
        refill_reminder_threshold: 7,
        active: true,
      };

      if (id) {
        await medicationApi.updateMedication(id, commonData);
        toast({
          title: 'Medication updated',
          description: 'Your medication has been updated successfully.',
        });
      } else {
        await medicationApi.createMedication(commonData);
        toast({
          title: 'Medication added',
          description: 'Your medication has been added successfully.',
        });
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving medication:', error);
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to save medication. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReminderTimeChange = (index: number, value: string) => {
    const newTimes = [...formData.reminder_times];
    newTimes[index] = value;
    setFormData({ ...formData, reminder_times: newTimes });
  };

  const addReminderTime = () => {
    setFormData({
      ...formData,
      reminder_times: [...formData.reminder_times, '09:00'],
    });
  };

  const removeReminderTime = (index: number) => {
    const newTimes = formData.reminder_times.filter((_, i) => i !== index);
    setFormData({ ...formData, reminder_times: newTimes });
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/medications')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{id ? 'Edit Medication' : 'Add Medication'}</h1>
            <p className="text-muted-foreground">{id ? 'Update your medication details' : 'Enter your medication details'}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Medication Information</CardTitle>
            <CardDescription>Fill in the details about your medication</CardDescription>
          </CardHeader>
          <CardContent>
            {fetching ? (
              <div className="flex justify-center p-8">Loading...</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Medication Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Aspirin"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage *</Label>
                  <Input
                    id="dosage"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    placeholder="e.g., 500mg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency *</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) => setFormData({ ...formData, frequency: value as MedicationFrequency })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once_daily">Once Daily</SelectItem>
                      <SelectItem value="twice_daily">Twice Daily</SelectItem>
                      <SelectItem value="three_times_daily">Three Times Daily</SelectItem>
                      <SelectItem value="four_times_daily">Four Times Daily</SelectItem>
                      <SelectItem value="as_needed">As Needed</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date (Optional)</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Reminder Times *</Label>
                  {formData.reminder_times.map((time, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => handleReminderTimeChange(index, e.target.value)}
                        required
                      />
                      {formData.reminder_times.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeReminderTime(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addReminderTime} className="w-full">
                    Add Another Time
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remaining_quantity">Remaining Quantity (Optional)</Label>
                  <Input
                    id="remaining_quantity"
                    type="number"
                    value={formData.remaining_quantity}
                    onChange={(e) => setFormData({ ...formData, remaining_quantity: e.target.value })}
                    placeholder="e.g., 30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Medication Photo (Optional)</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {photoUrl && (
                    <img src={photoUrl} alt="Medication" className="mt-2 h-32 w-32 object-cover rounded-lg" />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any special instructions or notes..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => navigate('/dashboard/medications')} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (id ? 'Updating...' : 'Adding...') : (id ? 'Update Medication' : 'Add Medication')}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
