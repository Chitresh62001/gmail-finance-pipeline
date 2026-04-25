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
    <div className="flex flex-wrap gap-2.5 mb-6 items-center animate-fade-in-up">
      {/* Account */}
      <select
        id="filter-account"
        className="select select-sm select-bordered bg-base-100/40 border-white/10 focus:border-primary text-sm min-w-[130px]"
        value={account}
        onChange={e => setAccount(e.target.value)}
      >
        <option value="">All Accounts</option>
        {filterOptions.accounts.map(acc => (
          <option key={acc} value={acc}>{acc}</option>
        ))}
      </select>

      {/* Intent */}
      <select
        id="filter-intent"
        className="select select-sm select-bordered bg-base-100/40 border-white/10 focus:border-primary text-sm min-w-[130px]"
        value={intent}
        onChange={e => setIntent(e.target.value)}
      >
        <option value="">All Intents</option>
        {filterOptions.intents.map(i => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>

      {/* Counterparty */}
      <input
        id="filter-counterparty"
        type="text"
        placeholder="Counterparty..."
        className="input input-sm input-bordered bg-base-100/40 border-white/10 focus:border-primary text-sm w-[160px]"
        value={counterparty}
        onChange={e => setCounterparty(e.target.value)}
      />

      {/* Amount */}
      <div className="flex items-center gap-1.5">
        <select
          id="filter-amount-op"
          className="select select-sm select-bordered bg-base-100/40 border-white/10 text-sm w-[55px]"
          value={amountOp}
          onChange={e => setAmountOp(e.target.value)}
        >
          <option value="gt">&gt;</option>
          <option value="lt">&lt;</option>
          <option value="eq">=</option>
        </select>
        <input
          id="filter-amount-val"
          type="number"
          placeholder="Amt..."
          className="input input-sm input-bordered bg-base-100/40 border-white/10 focus:border-primary text-sm w-[90px]"
          value={amountVal}
          onChange={e => setAmountVal(e.target.value)}
        />
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-base-content/40">From:</span>
        <input
          id="filter-start-date"
          type="date"
          className="input input-sm input-bordered bg-base-100/40 border-white/10 focus:border-primary text-sm"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
        />
        <span className="text-xs text-base-content/40">To:</span>
        <input
          id="filter-end-date"
          type="date"
          className="input input-sm input-bordered bg-base-100/40 border-white/10 focus:border-primary text-sm"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
        />
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          id="btn-clear-filters"
          className="btn btn-sm btn-ghost border border-white/10 hover:bg-base-100 text-sm"
          onClick={clearFilters}
        >
          ✕ Clear
        </button>
      )}
    </div>
  )
}
