import React from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export type HabitSeriesMeta = {
  id: string;
  name: string;
  color: string;
};

type ProgressStackedChartProps = {
  data: Record<string, string | number>[];
  series: HabitSeriesMeta[];
};

const ProgressStackedChart: React.FC<ProgressStackedChartProps> = ({ data, series }) => {
  if (series.length === 0 || data.length === 0) {
    return (
      <div className="h-52 flex items-center justify-center text-sm text-[var(--text-muted)]">
        No completions recorded in this range yet.
      </div>
    );
  }

  return (
    <div className="w-full h-56 min-w-0">
      <ResponsiveContainer width="100%" height={224} minWidth={1}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--bg-subtle)', opacity: 0.55 }}
            contentStyle={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-hairline)',
              borderRadius: '14px',
              fontSize: '12px',
              color: 'var(--text-primary)',
            }}
          />
          {series.map((s, idx) => (
            <Bar
              key={s.id}
              dataKey={s.id}
              name={s.name}
              stackId="habits"
              fill={s.color}
              isAnimationActive={false}
              radius={idx === series.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
              maxBarSize={24}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressStackedChart;
