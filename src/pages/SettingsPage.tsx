import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { settingsApi } from '@/db/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  LogOut,
  Bell,
  Volume2,
  Save,
  Moon,
  Smartphone,
  UserCog
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UserSettings } from '@/types';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  // Schema-aligned state
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ringtone, setRingtone] = useState('default');
  const [snoozeMinutes, setSnoozeMinutes] = useState(15);

  useEffect(() => {
    if (!user) return;
    loadSettings();
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      if (!user) return;

      const data = await settingsApi.getSettings(user.id);

      if (data) {
        setDarkMode(data.dark_mode ?? false);
        setSoundEnabled(data.sound_enabled ?? true);
        setRingtone(data.ringtone || 'default');
        setSnoozeMinutes(data.snooze_minutes || 15);

        // Sync dark mode immediately
        toggleDarkModeClass(data.dark_mode ?? false);
      } else {
        // Defaults if no row exists yet
        setDarkMode(false);
        setSoundEnabled(true);
        setRingtone('default');
        setSnoozeMinutes(15);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkModeClass = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked);
    toggleDarkModeClass(checked);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const updates: Partial<UserSettings> = {
      dark_mode: darkMode,
      sound_enabled: soundEnabled,
      ringtone,
      snooze_minutes: snoozeMinutes,
      updated_at: new Date().toISOString()
    };

    try {
      await settingsApi.updateSettings(user.id, updates);
      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Save Failed',
        description: error.message || 'Could not save your preferences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationToggle = (checked: boolean) => {
    // If disabling, just update local state logic (we don't control browser permission revocation via JS)
    // But we can prompt user.

    if (checked) {
      // User wants to enable
      if (!('Notification' in window)) {
        toast({ title: 'Not Supported', description: 'This browser does not support notifications.', variant: 'destructive' });
        return;
      }

      Notification.requestPermission().then((permission) => {
        setPermissionStatus(permission);
        if (permission === 'granted') {
          toast({ title: 'Notifications Enabled', description: 'You will now receive medication reminders.' });
        } else {
          // Denied or Default
          toast({ title: 'Permission required', description: 'Please enable notifications in your browser settings.', variant: 'destructive' });
        }
      });
    } else {
      // User trying to disable
      toast({
        title: 'Cannot Disable via App',
        description: 'To disable notifications, please reset permissions in your browser address bar/settings.',
        variant: 'default'
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your app preferences and account.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Notifications Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Configure how you receive medication alerts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  {permissionStatus === 'granted'
                    ? 'Notifications are enabled on this device.'
                    : 'Enable browser notifications for reminders.'}
                </p>
              </div>
              <Switch
                checked={permissionStatus === 'granted'}
                onCheckedChange={handleNotificationToggle}
              // If denied, we might disable it, or allow user to click to see the error toast again
              // disabled={permissionStatus === 'denied'} 
              />
            </div>

            <Separator />

            <div className="grid gap-2">
              <Label>Snooze Duration</Label>
              <Select
                value={String(snoozeMinutes)}
                onValueChange={(v) => setSnoozeMinutes(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">How long to wait before reminding you again.</p>
            </div>
          </CardContent>
        </Card>

        {/* Sound & Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Volume2 className="h-5 w-5 text-primary" />
              Sound & Appearance
            </CardTitle>
            <CardDescription>Customize the app experience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sound Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Sound Enabled</Label>
                <p className="text-sm text-muted-foreground">Play ringtone for alerts.</p>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>

            {soundEnabled && (
              <div className="grid gap-2 pl-4 border-l-2 border-muted ml-1">
                <Label>Ringtone</Label>
                <Select
                  value={ringtone}
                  onValueChange={setRingtone}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sound" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Beep</SelectItem>
                    <SelectItem value="chime">Soft Chime</SelectItem>
                    <SelectItem value="gentle">Gentle Morning</SelectItem>
                    <SelectItem value="urgent">Urgent Alarm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Switch between light and dark themes.</p>
              </div>
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-muted-foreground" />
                <Switch
                  checked={darkMode}
                  onCheckedChange={handleDarkModeToggle}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-destructive">
              <UserCog className="h-5 w-5" />
              Account Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="w-full sm:w-auto" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Floating Save Button / Footer */}
      <div className="flex justify-end pt-4">
        <Button size="lg" onClick={handleSave} disabled={saving} className="w-full sm:w-auto min-w-[150px]">
          {saving ? (
            <>
              <Smartphone className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
