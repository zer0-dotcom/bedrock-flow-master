'use client'

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'

const data = [
  { name: 'Sovereign', value: 70 },
  { name: 'Verification', value: 20 },
  { name: 'Community', value: 10 },
]

const COLORS = ['#10B981', '#8B5CF6', '#06B6D4']

export default function BpsChartInner() {
  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {(data ?? []).map((_: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS?.[index % (COLORS?.length ?? 1)] ?? '#888'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#111',
              border: '1px solid #333',
              borderRadius: '8px',
              fontSize: 11,
              color: '#fff',
            }}
            formatter={(value: any) => [`${value ?? 0}%`, 'BPS Split']}
          />
          <Legend
            verticalAlign="top"
            wrapperStyle={{ fontSize: 11, color: '#999' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
