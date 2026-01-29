import { Award, Flame, Star, Trophy, Zap, Moon, Sun } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Achievement, BadgeType } from '@/types';

interface AchievementBadgeProps {
  achievement: Achievement;
}

const badgeConfig: Record<BadgeType, { icon: React.ElementType; color: string; label: string }> = {
  first_dose: { icon: Star, color: 'text-primary', label: 'First Dose' },
  week_streak: { icon: Flame, color: 'text-warning', label: 'Week Streak' },
  month_streak: { icon: Trophy, color: 'text-secondary', label: 'Month Streak' },
  perfect_week: { icon: Award, color: 'text-success', label: 'Perfect Week' },
  perfect_month: { icon: Trophy, color: 'text-primary', label: 'Perfect Month' },
  hundred_doses: { icon: Zap, color: 'text-warning', label: '100 Doses' },
  early_bird: { icon: Sun, color: 'text-warning', label: 'Early Bird' },
  night_owl: { icon: Moon, color: 'text-primary', label: 'Night Owl' },
};

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  const config = badgeConfig[achievement.badge_type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center gap-2 p-4 border border-border rounded-lg bg-card hover:shadow-hover transition-shadow">
      <div className={`p-3 bg-muted rounded-full ${config.color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-sm">{config.label}</p>
        {achievement.streak_count > 0 && (
          <p className="text-xs text-muted-foreground">{achievement.streak_count} days</p>
        )}
        <p className="text-xs text-muted-foreground">
          {new Date(achievement.earned_date).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
