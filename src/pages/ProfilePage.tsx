import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { profileApi } from '@/db/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PatientPhotoUploader } from '@/components/PatientPhotoUploader';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // ✅ LOCAL PHOTO STATE (CACHE SAFE)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    medical_history: '',
    allergies: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    healthcare_provider: '',
  });

  useEffect(() => {
    if (!profile) return;

    setFormData({
      full_name: profile.full_name || '',
      date_of_birth: profile.date_of_birth || '',
      medical_history: profile.medical_history || '',
      allergies: profile.allergies || '',
      emergency_contact_name: profile.emergency_contact_name || '',
      emergency_contact_phone: profile.emergency_contact_phone || '',
      healthcare_provider: profile.healthcare_provider || '',
    });

    // ✅ CACHE BUSTING (THIS IS THE KEY)
    if (profile.photo_url) {
      setPhotoUrl(`${profile.photo_url}?t=${Date.now()}`);
    } else {
      setPhotoUrl(null);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await profileApi.updateProfile(user.id, formData);
      await refreshProfile();

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error: any) {
      console.error('PROFILE UPDATE ERROR:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return <Skeleton className="h-96 bg-muted" />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your profile details</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ✅ PHOTO */}
            <div className="flex flex-col items-center gap-4">
              <PatientPhotoUploader
                currentPhotoUrl={photoUrl}
                onUploadComplete={async () => {
                  await refreshProfile();
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={profile.username} disabled />
            </div>

            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) =>
                  setFormData({ ...formData, date_of_birth: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Allergies</Label>
              <Textarea
                value={formData.allergies}
                onChange={(e) =>
                  setFormData({ ...formData, allergies: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Medical History</Label>
              <Textarea
                rows={4}
                value={formData.medical_history}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    medical_history: e.target.value,
                  })
                }
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Saving…' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}