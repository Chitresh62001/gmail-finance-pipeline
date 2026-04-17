export default function SummaryCards({ totalSpent, totalReceived, netValue, netClass, netLabel }) {
  return (
    <div className="cards">
      <div className="card">
        <div className="card-label">Total spent</div>
        <div className="card-value debit">₹{totalSpent.toFixed(2)}</div>
      </div>
      <div className="card">
        <div className="card-label">Received</div>
        <div className="card-value credit">₹{totalReceived.toFixed(2)}</div>
      </div>
      <div className="card">
        <div className="card-label">{netLabel}</div>
        <div className={`card-value ${netClass}`}>₹{netValue.toFixed(2)}</div>
      </div>
    </div>
  )
}
