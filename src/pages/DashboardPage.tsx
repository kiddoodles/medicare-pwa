import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi, medicationLogApi } from '@/db/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Pill,
  Calendar,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { DashboardData } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { useCounsellingAI } from '@/hooks/useAI';
import { MessageCircle, Send, User, Bot, FileHeart } from 'lucide-react';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  // Wellness Assistant State
  const { sendMessage, response: aiResponse, loading: aiLoading } = useCounsellingAI();
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: "Hi! I'm your wellness assistant. How are you feeling today?" }
  ]);

  useEffect(() => {
    if (aiResponse) {
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    }
  }, [aiResponse]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setChatInput('');
    sendMessage(msg);
  };

  const loadDashboard = async () => {
    if (!user) return;
    try {
      const dashboardData = await dashboardApi.getDashboardData(user.id);
      setData(dashboardData);
      setError(null);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const handleMarkAsTaken = async (logId: string, medicationId: string) => {
    setMarkingId(logId);
    try {
      await medicationLogApi.markAsTaken(logId, medicationId);
      toast({ title: 'Medication Taken', description: 'Great job staying on track! 🎉' });
      // Refresh data
      await loadDashboard();
    } catch (err) {
      console.error('Error marking as taken:', err);
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } finally {
      setMarkingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse p-4">
        <Skeleton className="h-20 w-3/4 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-destructive/5 rounded-xl border border-destructive/20 m-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="text-xl font-semibold text-destructive">Unable to Load Dashboard</h3>
        <p className="text-muted-foreground max-w-md">{error}</p>
        <Button onClick={() => { setLoading(true); loadDashboard(); }} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  const todayDate = format(new Date(), 'EEEE, MMMM do');
  const upcomingDose = data?.upcoming_doses?.[0];
  const stats = data?.adherence_stats;

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">
            Hello, {profile?.full_name?.split(' ')[0] || 'Friend'} 👋
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Calendar className="h-4 w-4" />
            {todayDate}
          </p>
        </div>
        {/* Quick Streak Badge */}
        {stats && stats.current_streak > 0 && (
          <Badge variant="outline" className="w-fit px-4 py-1 gap-2 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Trophy className="h-4 w-4" />
            <span className="font-semibold">{stats.current_streak} Day Streak!</span>
          </Badge>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Adherence"
          value={`${stats?.adherence_rate || 0}%`}
          icon={Activity}
          description="Last 30 days"
          className="bg-blue-500/5 border-blue-200"
          iconClass="text-blue-500"
        />
        <StatsCard
          title="Doses Taken"
          value={stats?.taken_doses || 0}
          icon={CheckCircle2}
          description="Total completed"
          className="bg-green-500/5 border-green-200"
          iconClass="text-green-500"
        />
        <StatsCard
          title="Missed"
          value={stats?.missed_doses || 0}
          icon={XCircle}
          description="Needs attention"
          className="bg-red-500/5 border-red-200"
          iconClass="text-red-500"
        />
        <StatsCard
          title="Streak"
          value={stats?.current_streak || 0}
          icon={TrendingUp}
          description="Consecutive days"
          className="bg-orange-500/5 border-orange-200"
          iconClass="text-orange-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content: Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Today's Schedule
          </h2>

          {data?.today_medications && data.today_medications.length > 0 ? (
            <div className="space-y-4">
              {data.today_medications.map((med) => (
                <Card key={med.id} className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-all">
                  <CardContent className="p-0">
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Med Info */}
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Pill className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{med.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Badge variant="secondary" className="rounded-md">
                              {med.dosage}
                            </Badge>
                            <span>•</span>
                            <span className="capitalize">{med.frequency.replace(/_/g, ' ')}</span>
                          </div>
                          {/* Logs for this med */}
                          {med.logs && med.logs.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {med.logs.map(log => (
                                <div key={log.id} className="flex items-center gap-2">
                                  <Badge
                                    className={cn(
                                      "capitalize cursor-pointer transition-colors",
                                      log.status === 'taken' ? "bg-green-100 text-green-700 hover:bg-green-200" :
                                        log.status === 'skipped' ? "bg-gray-100 text-gray-700 hover:bg-gray-200" :
                                          log.status === 'missed' ? "bg-red-100 text-red-700 hover:bg-red-200" :
                                            "bg-blue-100 text-blue-700 hover:bg-blue-200" // pending
                                    )}
                                    onClick={() => log.status === 'pending' && handleMarkAsTaken(log.id, med.id)}
                                  >
                                    {format(parseISO(log.scheduled_time), 'h:mm a')}
                                    {log.status === 'taken' && <CheckCircle2 className="ml-1 h-3 w-3" />}
                                    {log.status === 'pending' && markingId === log.id && <Activity className="ml-1 h-3 w-3 animate-spin" />}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Sidebar: Upcoming & Info */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg">Next Dose</CardTitle>
              <CardDescription>Don't miss your upcoming medication</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingDose ? (
                <div className="bg-card rounded-lg p-4 border shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-lg text-primary">
                      {upcomingDose.medication?.name || 'Unknown Medication'}
                    </h4>
                    <Badge variant="outline">{format(parseISO(upcomingDose.scheduled_time), 'h:mm a')}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {upcomingDose.medication?.dosage ? `Dosage: ${upcomingDose.medication.dosage}` : 'Check dosage details'}
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => handleMarkAsTaken(upcomingDose.id, upcomingDose.medication_id)}
                    disabled={markingId === upcomingDose.id}
                  >
                    {markingId === upcomingDose.id ? 'Marking...' : 'Mark as Taken Now'}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500/50" />
                  <p>All caught up for now!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Mini-List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] pr-4">
                {data?.recent_achievements && data.recent_achievements.length > 0 ? (
                  <div className="space-y-4">
                    {data.recent_achievements.map(achievement => (
                      <div key={achievement.id} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                          <Trophy className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize">{achievement.badge_type.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">{format(parseISO(achievement.earned_date), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Complete your daily goals to earn badges!
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Drug Info Link */}
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/dashboard/drug-info'}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Pill className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold">Drug Search</h4>
                <p className="text-xs text-muted-foreground">Look up medical info & side effects</p>
              </div>
            </CardContent>
          </Card>

          {/* Medical History Link */}
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/dashboard/medical-history'}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <FileHeart className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold">Medical History</h4>
                <p className="text-xs text-muted-foreground">Conditions, allergies & records</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg p-0 bg-primary hover:bg-primary/90 transition-transform hover:scale-105"
            size="icon"
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col h-[90vh] sm:h-full w-full sm:w-[400px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Wellness Assistant
            </SheetTitle>
            <SheetDescription>
              I'm here to support you in your health journey.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-2 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === 'user' ? "bg-primary text-white" : "bg-muted text-primary"
                )}>
                  {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={cn(
                  "p-3 rounded-2xl text-sm",
                  msg.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted text-foreground rounded-tl-none"
                )}>
                  {msg.text}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex items-start gap-2 mr-auto max-w-[85%]">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted p-3 rounded-2xl rounded-tl-none text-sm animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-auto pt-2">
            <Input
              placeholder="Type a message..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              disabled={aiLoading}
            />
            <Button size="icon" onClick={handleSendMessage} disabled={aiLoading || !chatInput.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, description, className, iconClass }: any) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h2 className="text-3xl font-bold mt-1">{value}</h2>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className={cn("h-12 w-12 rounded-full flex items-center justify-center bg-background/80", iconClass)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Pill className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No Medications Scheduled</h3>
        <p className="text-muted-foreground max-w-sm mt-2 mb-6">
          You haven't added any medications or schedules for today yet.
        </p>
        <Button asChild>
          <a href="/dashboard/medications">Add Medication</a>
        </Button>
      </CardContent>
    </Card>
  );
}
