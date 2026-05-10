// components/StatCard.js
export default function StatCard({ label, value, unit, sub, trend, color = 'cyan', icon: Icon }) {
  const colors = {
    cyan:   'text-accent-cyan   border-accent-cyan/30   bg-accent-cyan/5',
    green:  'text-accent-green  border-accent-green/30  bg-accent-green/5',
    amber:  'text-accent-amber  border-accent-amber/30  bg-accent-amber/5',
    red:    'text-accent-red    border-accent-red/30    bg-accent-red/5',
    purple: 'text-accent-purple border-accent-purple/30 bg-accent-purple/5',
  };
  const c = colors[color] || colors.cyan;

  return (
    <div className={`card border ${c} animate-slide-up`}>
      <div className="flex items-start justify-between mb-3">
        <span className="stat-label">{label}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg ${c} border flex items-center justify-center`}>
            <Icon size={15} className={c.split(' ')[0]} />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`font-mono text-2xl font-semibold ${c.split(' ')[0]}`}>{value}</span>
        {unit && <span className="text-sm text-text-secondary font-mono">{unit}</span>}
      </div>
      {(sub || trend !== undefined) && (
        <div className="mt-2 flex items-center gap-2">
          {trend !== undefined && (
            <span className={`text-xs font-mono ${trend > 0 ? 'text-accent-red' : trend < 0 ? 'text-accent-green' : 'text-text-muted'}`}>
              {trend > 0 ? '▲' : trend < 0 ? '▼' : '—'} {Math.abs(trend)}%
            </span>
          )}
          {sub && <span className="text-xs text-text-muted">{sub}</span>}
        </div>
      )}
    </div>
  );
}
