import { Progress } from '@/components/ui/progress';
import type { AdherenceStats } from '@/types';

interface AdherenceOverviewProps {
  stats: AdherenceStats;
}

export function AdherenceOverview({ stats }: AdherenceOverviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Adherence</span>
          <span className="text-sm font-bold text-primary">{stats.adherence_rate}%</span>
        </div>
        <Progress value={stats.adherence_rate} className="h-2" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Taken</p>
          <p className="text-2xl font-bold text-success">{stats.taken_doses}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Missed</p>
          <p className="text-2xl font-bold text-destructive">{stats.missed_doses}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Skipped</p>
          <p className="text-2xl font-bold text-warning">{stats.skipped_doses}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total_doses}</p>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Current Streak</span>
          <span className="text-lg font-bold text-secondary">{stats.current_streak} days</span>
        </div>
      </div>
    </div>
  );
}
