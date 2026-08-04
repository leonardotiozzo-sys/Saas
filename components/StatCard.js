export default function StatCard({ label, value, icon: Icon, tone = "gold" }) {
  const toneClasses = {
    gold: "text-gold",
    sage: "text-sage",
    rust: "text-rust",
  };
  return (
    <div className="bg-panel border border-white/10 rounded-2xl p-5 flex items-start justify-between">
      <div>
        <p className="text-muted text-xs mb-1">{label}</p>
        <p className="text-cream text-2xl font-display">{value}</p>
      </div>
      {Icon && <Icon className={`w-5 h-5 ${toneClasses[tone]}`} />}
    </div>
  );
}
