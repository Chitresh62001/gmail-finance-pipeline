export default function Filters({
  account, setAccount,
  intent, setIntent,
  counterparty, setCounterparty,
  amountOp, setAmountOp,
  amountVal, setAmountVal,
  startDate, setStartDate,
  endDate, setEndDate,
  filterOptions,
  hasActiveFilters,
  clearFilters,
}) {
  return (
    <div className="filters">
      <select id="filter-account" value={account} onChange={e => setAccount(e.target.value)}>
        <option value="">All Accounts</option>
        {filterOptions.accounts.map(acc => (
          <option key={acc} value={acc}>{acc}</option>
        ))}
      </select>

      <select id="filter-intent" value={intent} onChange={e => setIntent(e.target.value)}>
        <option value="">All Intents</option>
        {filterOptions.intents.map(i => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>

      <input
        id="filter-counterparty"
        type="text"
        placeholder="Filter by Counterparty..."
        value={counterparty}
        onChange={e => setCounterparty(e.target.value)}
      />

      <div className="filter-group">
        <select id="filter-amount-op" value={amountOp} onChange={e => setAmountOp(e.target.value)}>
          <option value="gt">&gt;</option>
          <option value="lt">&lt;</option>
          <option value="eq">=</option>
        </select>
        <input
          id="filter-amount-val"
          type="number"
          placeholder="Amount..."
          value={amountVal}
          onChange={e => setAmountVal(e.target.value)}
          style={{ width: '100px' }}
        />
      </div>

      <div className="filter-group">
        <label htmlFor="filter-start-date" style={{ fontSize: '0.85rem', alignSelf: 'center' }}>From:</label>
        <input
          id="filter-start-date"
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
        />
        <label htmlFor="filter-end-date" style={{ fontSize: '0.85rem', alignSelf: 'center' }}>To:</label>
        <input
          id="filter-end-date"
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
        />
      </div>

      {hasActiveFilters && (
        <button id="btn-clear-filters" className="btn-clear" onClick={clearFilters}>Clear Filters</button>
      )}
    </div>
  )
}
