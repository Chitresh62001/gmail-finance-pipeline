import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../App'
import Filters from '../components/Filters'
import SummaryCards from '../components/SummaryCards'
import Charts from '../components/Charts'
import TransactionList from '../components/TransactionList'
import BlurText from '../components/reactbits/BlurText'

export default function Dashboard() {
  const { authFetch, apiUrl, logout, username } = useContext(AuthContext)

  const [transactions, setTransactions] = useState([])
  const [filterOptions, setFilterOptions] = useState({ accounts: [], intents: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [account, setAccount] = useState('')
  const [counterparty, setCounterparty] = useState('')
  const [intent, setIntent] = useState('')
  const [amountOp, setAmountOp] = useState('gt')
  const [amountVal, setAmountVal] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Fetch filter options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await authFetch(`${apiUrl}/api/filter-options`)
        if (res.ok) {
          const data = await res.json()
          setFilterOptions(data)
        }
      } catch (e) {
        console.error('Failed to load filter options', e)
      }
    }
    fetchOptions()
  }, [])

  // Fetch transactions with filters
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (account) params.append('account', account)
        if (counterparty) params.append('counterparty', counterparty)
        if (intent) params.append('intent', intent)
        if (amountVal && !isNaN(amountVal)) {
          params.append('amount_op', amountOp)
          params.append('amount_val', amountVal)
        }
        if (startDate) params.append('start_date', startDate)
        if (endDate) params.append('end_date', endDate)

        const response = await authFetch(`${apiUrl}/api/transactions?${params.toString()}`)
        if (!response.ok) throw new Error('Network response was not ok')
        const data = await response.json()
        setTransactions(data)
        setCurrentPage(1) // Reset to page 1 on new filter
        setError(null)
      } catch (err) {
        console.error('Failed to fetch transactions:', err)
        setError('Failed to load data. Ensure the backend server is running.')
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchTransactions, 300)
    return () => clearTimeout(timeoutId)
  }, [account, counterparty, intent, amountOp, amountVal, startDate, endDate])

  const clearFilters = () => {
    setAccount('')
    setCounterparty('')
    setIntent('')
    setAmountVal('')
    setAmountOp('gt')
    setStartDate('')
    setEndDate('')
  }

  const hasActiveFilters = account || counterparty || intent || amountVal || startDate || endDate

  // Helper to classify debit vs credit
  const isDebitTxn = (t) => {
    const i = (t.intent || '').toLowerCase()
    if (i.includes('credit') || i.includes('received')) return false
    if (i.includes('debit') || i.includes('spend') || i.includes('spent')) return true
    return true
  }

  // Summaries
  const totalSpent = transactions.filter(isDebitTxn).reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const totalReceived = transactions.filter(t => !isDebitTxn(t)).reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const netValue = Math.abs(totalSpent - totalReceived)
  const netClass = totalReceived > totalSpent ? 'credit' : 'debit'
  const netLabel = totalReceived > totalSpent ? 'Net Inflow' : 'Net Outflow'

  // Pagination logic
  const totalPages = Math.ceil(transactions.length / itemsPerPage)
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="min-h-screen p-4 md:p-8 relative"
      style={{
        background: `
          radial-gradient(ellipse at 20% 0%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 100%, rgba(96, 165, 250, 0.06) 0%, transparent 50%)
        `
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              <BlurText text="Money Watcher" delay={80} className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent" />
            </h1>
            <p className="text-base-content/50 text-sm mt-1">
              Welcome back, {(username || '').replace(/_/g, ' ')} 👋
            </p>
          </div>
          <button
            className="btn btn-ghost btn-sm border border-white/10 hover:bg-error/15 hover:text-error hover:border-error/30 transition-all duration-300"
            onClick={logout}
          >
            Sign Out
          </button>
        </div>

        {/* Filters */}
        <Filters
          account={account} setAccount={setAccount}
          intent={intent} setIntent={setIntent}
          counterparty={counterparty} setCounterparty={setCounterparty}
          amountOp={amountOp} setAmountOp={setAmountOp}
          amountVal={amountVal} setAmountVal={setAmountVal}
          startDate={startDate} setStartDate={setStartDate}
          endDate={endDate} setEndDate={setEndDate}
          filterOptions={filterOptions}
          hasActiveFilters={hasActiveFilters}
          clearFilters={clearFilters}
        />

        {/* Error */}
        {error && (
          <div className="alert alert-error bg-error/10 border-error/20 mb-4 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Summary Cards */}
        <SummaryCards
          totalSpent={totalSpent}
          totalReceived={totalReceived}
          netValue={netValue}
          netClass={netClass}
          netLabel={netLabel}
        />

        {/* Charts */}
        <Charts transactions={transactions} isDebitTxn={isDebitTxn} />

        {/* Transaction List with Pagination */}
        <TransactionList
          transactions={paginatedTransactions}
          loading={loading}
          isDebitTxn={isDebitTxn}
        />

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center mt-4 mb-8 animate-fade-in-up">
            <div className="join shadow-lg">
              <button
                className="join-item btn btn-sm bg-base-100/60 border-white/10 hover:bg-base-100"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                «
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`join-item btn btn-sm ${
                    page === currentPage
                      ? 'btn-primary text-white'
                      : 'bg-base-100/60 border-white/10 hover:bg-base-100'
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="join-item btn btn-sm bg-base-100/60 border-white/10 hover:bg-base-100"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                »
              </button>
            </div>
          </div>
        )}

        {/* Page info */}
        {!loading && transactions.length > 0 && (
          <p className="text-center text-base-content/40 text-xs mb-6">
            Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, transactions.length)} of {transactions.length} transactions
          </p>
        )}
      </div>
    </div>
  )
}
