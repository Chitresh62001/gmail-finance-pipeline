import CountUp from './reactbits/CountUp'

export default function SummaryCards({ totalSpent, totalReceived, netValue, netClass, netLabel }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 stagger-children">
      {/* Spent */}
      <div className="card bg-base-200 rounded-2xl border-[0.5px] border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.08)] group relative overflow-hidden transition-all duration-300 hover:border-red-400/50 hover:shadow-[0_0_15px_rgba(248,113,113,0.3)]">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="card-body p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">Total Spent</p>
          <p className="text-2xl font-bold text-red-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.2)]">
            <CountUp from={0} to={totalSpent} duration={1.2} prefix="₹" decimals={2} />
          </p>
        </div>
      </div>

      {/* Received */}
      <div className="card bg-base-200 rounded-2xl border-[0.5px] border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.08)] group relative overflow-hidden transition-all duration-300 hover:border-emerald-400/50 hover:shadow-[0_0_15px_rgba(52,211,153,0.3)]">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="card-body p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">Received</p>
          <p className="text-2xl font-bold text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.2)]">
            <CountUp from={0} to={totalReceived} duration={1.2} prefix="₹" decimals={2} />
          </p>
        </div>
      </div>

      {/* Net */}
      <div className="card bg-base-200 rounded-2xl border-[0.5px] border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.08)] group relative overflow-hidden transition-all duration-300 hover:border-blue-400/50 hover:shadow-[0_0_15px_rgba(96,165,250,0.3)]">
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${netClass === 'credit' ? 'from-emerald-400' : 'from-blue-400'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        <div className="card-body p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">{netLabel}</p>
          <p className={`text-2xl font-bold ${netClass === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
            <CountUp from={0} to={netValue} duration={1.2} prefix="₹" decimals={2} />
          </p>
        </div>
      </div>
    </div>
  )
}
