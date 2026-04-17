const iconBg = {
  groceries: '#E6F1FB', food: '#E1F5EE',
  pharmacy: '#FAECE7', services: '#FAEEDA', received: '#EAF3DE',
  default: '#F0F0F0',
}

const catEmoji = {
  groceries: '🛒', food: '🍱', pharmacy: '💊', services: '👤', received: '💰', default: '📝',
}

export default function TransactionList({ transactions, loading, isDebitTxn }) {
  if (loading) {
    return (
      <div className="txn-panel">
        <div className="panel-title">Transactions</div>
        <div className="loading">Loading transactions...</div>
      </div>
    )
  }

  return (
    <div className="txn-panel">
      <div className="panel-title">Transactions</div>
      {transactions.length === 0 ? (
        <div className="loading">No transactions found matching your filters.</div>
      ) : (
        <div>
          {transactions.map(t => {
            const dateStr = new Date(t.txn_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            const isDebit = isDebitTxn(t)
            const sign = isDebit ? '−' : '+'
            const absAmount = Math.abs(t.amount).toFixed(2)
            const intentKey = t.intent.toLowerCase()

            return (
              <div className="txn-row" key={t.id}>
                <div className="txn-icon" style={{ background: iconBg[intentKey] || iconBg.default }}>
                  {catEmoji[intentKey] || catEmoji.default}
                </div>
                <div className="txn-info">
                  <div className="txn-name">{t.counterparty}</div>
                  <div className="txn-meta">{dateStr} · {t.intent} · {t.account}</div>
                </div>
                <div className={`txn-amount ${isDebit ? 'd' : 'c'}`}>
                  {sign}₹{absAmount}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
