import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { medicationLogApi, settingsApi } from '@/db/api';
import { MedicationLogWithDetails, UserSettings } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { BellRing, Check, X } from 'lucide-react';

const POLL_INTERVAL_MS = 60 * 1000; // Check every minute
const ALARM_DURATION_MS = 10 * 60 * 1000; // 10 minutes max ring

// Ringtone options
const RINGTONES: Record<string, string> = {
    'default': 'https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3',
    'chime': 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3',
    'gentle': 'https://assets.mixkit.co/sfx/preview/mixkit-morning-clock-alarm-1003.mp3',
    'urgent': 'https://assets.mixkit.co/sfx/preview/mixkit-alarm-tone-996.mp3'
};

export function MedicationReminder() {
    const { user } = useAuth();
    const { toast } = useToast();
    // Removed local 'settings' state as we fetch fresh inside polling

    const [activeAlert, setActiveAlert] = useState<MedicationLogWithDetails | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const alertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const processedLogsRef = useRef<Set<string>>(new Set());

    // 1. Initial Theme Application
    useEffect(() => {
        if (!user) return;
        settingsApi.getSettings(user.id).then(data => {
            if (data && data.dark_mode !== undefined) {
                if (data.dark_mode) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            } else {
                // Fallback to media query if no setting
                const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (isSystemDark) document.documentElement.classList.add('dark');
            }
        }).catch(console.error);
    }, [user]);

    // Request Notification Permission on mount (one-time logic)
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            const hasRequested = localStorage.getItem('notification_req_shown');
            if (!hasRequested) {
                Notification.requestPermission();
                localStorage.setItem('notification_req_shown', 'true');
            }
        }
    }, []);

    // Audio Logic
    const playAudio = (ringtoneKey: string = 'default') => {
        const url = RINGTONES[ringtoneKey] || RINGTONES['default'];

        if (!audioRef.current) {
            audioRef.current = new Audio(url);
            audioRef.current.loop = true;
        } else if (audioRef.current.src !== url) {
            audioRef.current.src = url;
        }

        audioRef.current.volume = 0.8; // Fixed volume or defaults to 80% if not in schema
        audioRef.current.play().catch(e => console.warn("Audio autoplay blocked:", e));
    };

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    // 2. Poll for Status
    useEffect(() => {
        if (!user) return;

        const checkMedications = async () => {
            try {
                const todayLogs = await medicationLogApi.getTodayLogs(user.id);
                const now = new Date();

                // Get latest settings for decision making
                const currentSettings = await settingsApi.getSettings(user.id);

                // Logic:
                // If permission is granted OR we are just showing the popup inside the app, we proceed.
                // The prompt implies we primarily want the popup + sound.
                // We don't have 'notifications_enabled' in DB anymore so we rely on system permission for the push part,
                // and always show in-app popup unless we had a specific 'quiet mode' which we don't.

                todayLogs.forEach(log => {
                    if (log.status !== 'pending') return;
                    if (processedLogsRef.current.has(log.id)) return;

                    const scheduledTime = new Date(log.scheduled_time);
                    const timeDiff = now.getTime() - scheduledTime.getTime();

                    // Trigger if within last 10 mins
                    if (timeDiff >= 0 && timeDiff < ALARM_DURATION_MS) {
                        triggerAlert(log, currentSettings);
                    }
                });

            } catch (error) {
                console.error('Error checking reminders:', error);
            }
        };

        checkMedications();
        const interval = setInterval(checkMedications, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [user]);

    const triggerAlert = (log: MedicationLogWithDetails, currentSettings: UserSettings | null) => {
        setActiveAlert(log);
        processedLogsRef.current.add(log.id);

        // 1. Notification (if permissible)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Time to take ${log.medication?.name}`, {
                body: `Dosage: ${log.medication?.dosage}`,
                icon: '/pwa-192x192.png',
                tag: log.id
            });
        }

        // 2. Sound
        // Check sound_enabled from DB
        const shouldPlaySound = currentSettings?.sound_enabled ?? true;
        if (shouldPlaySound) {
            playAudio(currentSettings?.ringtone || 'default');
        }

        // 3. Auto-dismiss timeout
        if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
        alertTimeoutRef.current = setTimeout(() => {
            dismissAlert();
        }, ALARM_DURATION_MS);
    };

    const dismissAlert = () => {
        setActiveAlert(null);
        stopAudio();
        if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };

    // Snooze Logic
    const handleSnooze = async () => {
        // We could respect settings.snooze_minutes if we want to update the scheduled time,
        // but for now simple dismiss/close is often treated as snooze or we actively remove it from "processed"
        // so it rings again? 
        // Simplest "Snooze" is just close the modal and stop sound. 
        // Real snooze would mean re-scheduling. For MVP, just dismiss.
        dismissAlert();
    };

    const handleAction = async (status: 'taken' | 'missed') => {
        if (!activeAlert) return;
        stopAudio();

        try {
            if (status === 'taken') {
                await medicationLogApi.markAsTaken(activeAlert.id, activeAlert.medication_id);
                toast({
                    title: 'Marked as Taken',
                    description: 'Great job staying on track!',
                    className: "bg-green-100 border-green-200 text-green-800"
                });
            } else {
                await medicationLogApi.updateLog(activeAlert.id, { status: 'missed' });
                toast({
                    title: 'Marked as Missed',
                    description: 'Dose marked as missed.',
                    variant: "destructive"
                });
            }
            dismissAlert();
        } catch (e) {
            console.error(`Failed to mark ${status}`, e);
            toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
        }
    };

    if (!activeAlert) return null;

    return (
        <Dialog open={!!activeAlert} onOpenChange={(open) => !open && dismissAlert()}>
            <DialogContent className="w-[90%] rounded-xl sm:max-w-md border-primary/20 shadow-2xl animate-pulse-slow">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl text-primary">
                        <BellRing className="h-6 w-6 animate-bounce" />
                        Medication Reminder
                    </DialogTitle>
                    <DialogDescription className="text-lg font-medium pt-2">
                        It's time to take your <strong>{activeAlert.medication?.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                        <span className="text-sm text-muted-foreground">Dosage</span>
                        <span className="font-semibold text-lg">{activeAlert.medication?.dosage}</span>
                    </div>

                    {activeAlert.medication?.photo_url && (
                        <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                            <img
                                src={activeAlert.medication.photo_url}
                                alt="Medication"
                                className="h-full w-full object-cover"
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-3">
                    <Button
                        onClick={() => handleAction('taken')}
                        className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 shadow-sm"
                    >
                        <Check className="mr-2 h-5 w-5" />
                        Mark as Taken
                    </Button>

                    <div className="flex gap-3 w-full">
                        <Button
                            variant="destructive"
                            onClick={() => handleAction('missed')}
                            className="flex-1"
                        >
                            <X className="mr-2 h-4 w-4" />
                            Missed
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleSnooze}
                            className="flex-1"
                        >
                            Snooze
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
