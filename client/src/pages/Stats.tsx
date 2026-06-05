import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getLibraryStats } from '../api/backend';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';
import { C, STATUS_COLORS } from '../constants/colors';
import type { UserStats } from '../types';

const COLORS = ['#8B5CF6','#10B981','#F59E0B','#EF4444','#3B82F6','#EC4899','#14B8A6','#F97316'];

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
      padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ fontSize: 24, fontWeight: 800, color, margin: 0 }}>{value}</p>
        <p style={{ fontSize: 12, color: C.muted, margin: '2px 0 0' }}>{label}</p>
      </div>
    </div>
  );
}

export default function Stats() {
  const navigate      = useNavigate();
  const { user }      = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    getLibraryStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  if (!user)   return null;
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={44} /></div>;
  if (!stats)  return <p style={{ color: C.muted }}>No stats yet. Start tracking!</p>;

  const genreData   = Object.entries(stats.genreDistribution).map(([name, val])  => ({ name, val }));
  const scoreData   = Object.entries(stats.scoreDistribution).map(([name, val])  => ({ name, val }));
  const statusData  = Object.entries(stats.statusDistribution).map(([name, val]) => ({ name, val }));
  const radarData   = genreData.slice(0, 8).map((g) => ({ subject: g.name, count: g.val }));

  const chartStyle = { background: 'transparent' };
  const tooltip = { contentStyle: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 } };

  return (
    <div style={{ maxWidth: 1100 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: '0 0 22px' }}>📊 My Statistics</h1>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginBottom: 28 }}>
        <StatCard label="Anime Watched"    value={stats.animeWatched}                    color={C.accent}  icon="▶" />
        <StatCard label="Episodes Watched" value={stats.episodesWatched.toLocaleString()} color={C.success} icon="📺" />
        <StatCard label="Hours Watched"    value={stats.hoursWatched.toLocaleString()}    color={C.warning} icon="⏱" />
        <StatCard label="Manga Read"       value={stats.mangaRead}                        color="#3B82F6"   icon="📖" />
        <StatCard label="Chapters Read"    value={stats.chaptersRead.toLocaleString()}    color="#EC4899"   icon="📄" />
        <StatCard label="Avg Score"        value={`${stats.avgScore}/10`}                color={C.warning} icon="⭐" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>

        {/* Score Distribution */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 16px' }}>Score Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={scoreData} style={chartStyle}>
              <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltip} />
              <Bar dataKey="val" fill={C.accent} radius={[4,4,0,0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 16px' }}>Library Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart style={chartStyle} margin={{ top: 12, bottom: 12, left: 16, right: 16 }}>
              <Pie data={statusData} dataKey="val" nameKey="name" cx="50%" cy="50%"
                innerRadius={42} outerRadius={65} paddingAngle={3} labelLine={false}
                label={({ cx, cy, midAngle, outerRadius: or, percent, name }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = or + 12;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  const textAnchor = x > cx ? 'start' : 'end';
                  const labelName = name.replace('_', ' ');
                  return (
                    <text x={x} y={y} fill={C.text} textAnchor={textAnchor} dominantBaseline="central" style={{ fontSize: 10, fontWeight: 700 }}>
                      {`${labelName} ${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltip} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Genre Radar */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 16px' }}>Genre Profile</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} style={chartStyle}>
              <PolarGrid stroke={C.border} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: C.muted, fontSize: 10 }} />
              <Radar name="Count" dataKey="count" stroke={C.accent} fill={C.accent} fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Genres Bar */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 16px' }}>Top Genres</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {genreData.slice(0, 8).map((g, i) => {
              const max = genreData[0]?.val || 1;
              const pct = Math.round((g.val / max) * 100);
              return (
                <div key={g.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: C.text }}>{g.name}</span>
                    <span style={{ fontSize: 11, color: C.muted }}>{g.val}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: C.bg2 }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3,
                      background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
