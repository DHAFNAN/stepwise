import {
  BookOpen,
  Brain,
  Coffee,
  Droplets,
  Dumbbell,
  Feather,
  Flame,
  Footprints,
  Heart,
  Leaf,
  Moon,
  Music,
  Palette,
  PenTool,
  PiggyBank,
  Smile,
  Sparkles,
  Sun,
  Target,
  Timer,
  TreePine,
  Utensils,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type HabitIconEntry = {
  id: string;
  label: string;
  Icon: LucideIcon;
};

export const HABIT_ICONS: HabitIconEntry[] = [
  { id: 'book-open', label: 'Reading', Icon: BookOpen },
  { id: 'wind', label: 'Breathing', Icon: Wind },
  { id: 'footprints', label: 'Walking', Icon: Footprints },
  { id: 'droplets', label: 'Hydration', Icon: Droplets },
  { id: 'pen-tool', label: 'Writing', Icon: PenTool },
  { id: 'dumbbell', label: 'Strength', Icon: Dumbbell },
  { id: 'sun', label: 'Morning', Icon: Sun },
  { id: 'moon', label: 'Evening', Icon: Moon },
  { id: 'heart', label: 'Care', Icon: Heart },
  { id: 'brain', label: 'Focus', Icon: Brain },
  { id: 'coffee', label: 'Ritual', Icon: Coffee },
  { id: 'leaf', label: 'Calm', Icon: Leaf },
  { id: 'music', label: 'Practice', Icon: Music },
  { id: 'palette', label: 'Create', Icon: Palette },
  { id: 'piggy-bank', label: 'Save', Icon: PiggyBank },
  { id: 'smile', label: 'Gratitude', Icon: Smile },
  { id: 'target', label: 'Goal', Icon: Target },
  { id: 'timer', label: 'Timer', Icon: Timer },
  { id: 'utensils', label: 'Nourish', Icon: Utensils },
  { id: 'tree-pine', label: 'Outdoors', Icon: TreePine },
  { id: 'feather', label: 'Lightness', Icon: Feather },
  { id: 'zap', label: 'Energy', Icon: Zap },
  { id: 'flame', label: 'Momentum', Icon: Flame },
  { id: 'sparkles', label: 'Clarity', Icon: Sparkles },
];

export function getHabitIconComponent(id: string): LucideIcon {
  return HABIT_ICONS.find((entry) => entry.id === id)?.Icon ?? BookOpen;
}
