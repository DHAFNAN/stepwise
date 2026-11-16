import React from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type WeeklyBarChartProps = {
  data: { weekLabel: string; count: number }[];
  accentColor: string;
};

const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({ data, accentColor }) => {
  return (
    <div className="w-full h-44 min-w-0">
      <ResponsiveContainer width="100%" height={176} minWidth={1}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <XAxis
            dataKey="weekLabel"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--bg-subtle)', opacity: 0.6 }}
            contentStyle={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-hairline)',
              borderRadius: '14px',
              fontSize: '12px',
              color: 'var(--text-primary)',
            }}
            formatter={(value) => [`${value} check-ins`, 'Completed']}
          />
          <Bar
            dataKey="count"
            fill={accentColor}
            isAnimationActive={false}
            radius={[8, 8, 4, 4]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyBarChart;
