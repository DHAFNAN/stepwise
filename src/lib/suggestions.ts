export const IDENTITY_SUGGESTIONS = [
  'a reader',
  'a mindful person',
  'an active person',
  'a learner',
  'a good listener',
  'a saver',
  'a writer',
  'someone who rests well',
];

export const DEFAULT_ACTION_SUGGESTIONS = [
  'Read 2 pages',
  'Take 3 slow breaths',
  'Stretch for 2 mins',
  'Drink 1 glass of water',
  'Write 2 sentences',
  'Walk for 5 mins',
];

export const WHEN_WHERE_SUGGESTIONS = [
  'on time',
  'when I wake up',
  'after morning coffee',
  'at my desk',
  'after lunch',
  'before bed',
];

export const GOAL_UNIT_OPTIONS = [
  'times',
  'minutes',
  'pages',
  'steps',
  'glasses',
  'reps',
  'sessions',
];

export const ACTION_SUGGESTIONS_BY_IDENTITY: Record<string, string[]> = {
  'a reader': ['Read 2 pages', 'Read 1 paragraph before bed', 'Open my book for 2 mins'],
  'a mindful person': ['Take 3 slow breaths', 'Sit quietly for 2 mins', 'Notice 3 things I appreciate'],
  'an active person': ['Stretch for 2 mins', 'Walk around the block', 'Do 5 gentle squats'],
  'a learner': ['Practice 3 flashcards', 'Watch 2 mins of a lesson', 'Write 1 new thing I learned'],
  'a good listener': ['Ask 1 thoughtful question', 'Put my phone away at dinner', 'Pause 2 seconds before replying'],
  'a saver': ['Move $5 to savings', 'Log today’s spending', 'Skip one impulse buy'],
  'a writer': ['Write 2 sentences', 'Jot 1 quick idea', 'Journal for 2 mins'],
  'someone who rests well': ['Plug phone in outside bedroom', 'Dim lights at 10 PM', 'Drink herbal tea after dinner'],
};

export function getActionsForIdentity(identity: string): string[] {
  const normalized = identity.trim().toLowerCase();
  if (ACTION_SUGGESTIONS_BY_IDENTITY[normalized]) {
    return ACTION_SUGGESTIONS_BY_IDENTITY[normalized];
  }
  for (const [key, actions] of Object.entries(ACTION_SUGGESTIONS_BY_IDENTITY)) {
    const keyword = key.replace(/^an?\s+/, '');
    if (normalized.includes(keyword)) {
      return actions;
    }
  }
  return DEFAULT_ACTION_SUGGESTIONS;
}

export function suggestTwoMinuteVersion(action: string): string {
  const trimmed = action.trim();
  if (!trimmed) return 'Do just 2 minutes of it';

  const lower = trimmed.toLowerCase();
  const pageMatch = lower.match(/read\s+(\d+)\s+pages?/);
  if (pageMatch) return 'Read 1 page';

  const minMatch = lower.match(/(.*?)\s+for\s+\d+\s*(min|mins|minutes|hr|hour|hours)/i);
  if (minMatch && minMatch[1]) {
    return `${minMatch[1].trim()} for 2 mins`;
  }

  const countMatch = lower.match(/^(do|write|run|walk)\s+(\d+)\s+(.+)$/i);
  if (countMatch) {
    const verb = countMatch[1][0].toUpperCase() + countMatch[1].slice(1);
    return `${verb} 1 ${countMatch[3].replace(/s$/, '')}`;
  }

  if (lower.includes('run') || lower.includes('jog')) return 'Put on running shoes and step outside';
  if (lower.includes('meditat')) return 'Take 3 slow breaths';
  if (lower.includes('journal') || lower.includes('write')) return 'Write 1 honest sentence';
  if (lower.includes('clean') || lower.includes('tidy')) return 'Put away 3 items';

  return `${trimmed} for just 2 mins`;
}

export type HowItWorksExample = {
  action: string;
  whenWhere: string;
  identity: string;
};

export const HOW_IT_WORKS_EXAMPLES: HowItWorksExample[] = [
  {
    action: 'read 2 pages',
    whenWhere: 'after I pour morning tea at the kitchen table',
    identity: 'a reader',
  },
  {
    action: 'take 3 slow breaths',
    whenWhere: 'at my desk at 9:00 AM',
    identity: 'a mindful person',
  },
  {
    action: 'stretch for 2 minutes',
    whenWhere: 'right after I brush my teeth at night',
    identity: 'an active person',
  },
  {
    action: 'write two sentences',
    whenWhere: 'after I close my laptop in the living room',
    identity: 'a writer',
  },
  {
    action: 'log today’s spending',
    whenWhere: 'after dinner at the dining table',
    identity: 'a saver',
  },
];
