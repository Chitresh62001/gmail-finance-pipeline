import { motion, AnimatePresence } from 'framer-motion'

const iconBg = {
  groceries: 'bg-blue-500/15', food: 'bg-emerald-500/15',
  pharmacy: 'bg-orange-500/15', services: 'bg-amber-500/15',
  received: 'bg-green-500/15', default: 'bg-base-content/10',
}

const catEmoji = {
  groceries: '🛒', food: '🍱', pharmacy: '💊', services: '👤', received: '💰', default: '📝',
}

function getIconBg(intentKey) {
  return iconBg[intentKey] || iconBg.default
}

export default function TransactionList({ transactions, loading, isDebitTxn }) {
  if (loading) {
    return (
      <div className="card bg-base-200 rounded-2xl border-[0.5px] border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.08)]">
        <div className="card-body p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-3">
            Transactions
          </h3>
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <span className="loading loading-dots loading-lg text-primary"></span>
            <p className="text-base-content/50 text-sm">Loading transactions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card bg-base-200 rounded-2xl border-[0.5px] border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.08)] animate-fade-in-up">
      <div className="card-body p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-3">
          Transactions
        </h3>

        {transactions.length === 0 ? (
          <div className="text-center py-10 text-base-content/50 text-sm">
            No transactions found matching your filters.
          </div>
        ) : (
          <div className="stagger-children">
            <AnimatePresence mode="popLayout">
              {transactions.map((t, idx) => {
                const dateStr = String(t.txn_date).split('T')[0]
                const rawAmount = t.amount
                const intentKey = (t.intent || '').toLowerCase().replace(/ /g, '_')
                const isDebit = isDebitTxn(t)

                return (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25, delay: idx * 0.03 }}
                    className="flex items-center gap-3.5 py-3 px-2 -mx-2 border-b border-white/5 last:border-b-0 rounded-xl hover:bg-white/5 transition-colors duration-200 cursor-default"
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${getIconBg(intentKey)} border border-white/5`}>
                      {catEmoji[intentKey] || catEmoji.default}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-base-content truncate">
                        {t.counterparty}
                      </div>
                      <div className="text-xs text-base-content/40 mt-0.5 capitalize">
                        {dateStr} · {(t.intent || '').replace(/_/g, ' ')} · {(t.account || '').replace(/_/g, ' ')}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className={`text-sm font-semibold shrink-0 ${isDebit ? 'text-red-400' : 'text-emerald-400'}`}>
                      ₹{Number(rawAmount).toFixed(2)}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
