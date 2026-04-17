import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../App'
import Filters from '../components/Filters'
import SummaryCards from '../components/SummaryCards'
import Charts from '../components/Charts'
import TransactionList from '../components/TransactionList'

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

        const response = await authFetch(`${apiUrl}/api/transactions?${params.toString()}`)
        if (!response.ok) throw new Error('Network response was not ok')
        const data = await response.json()
        setTransactions(data)
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
  }, [account, counterparty, intent, amountOp, amountVal])

  const clearFilters = () => {
    setAccount('')
    setCounterparty('')
    setIntent('')
    setAmountVal('')
    setAmountOp('gt')
  }

  const hasActiveFilters = account || counterparty || intent || amountVal

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

  return (
    <div className="dashboard">
      <div className="container">
        <div className="header">
          <div className="header-left">
            <h1>Money Watcher</h1>
            <p>Welcome back, {username} 👋</p>
          </div>
          <button className="logout-btn" onClick={logout}>Sign Out</button>
        </div>

        <Filters
          account={account} setAccount={setAccount}
          intent={intent} setIntent={setIntent}
          counterparty={counterparty} setCounterparty={setCounterparty}
          amountOp={amountOp} setAmountOp={setAmountOp}
          amountVal={amountVal} setAmountVal={setAmountVal}
          filterOptions={filterOptions}
          hasActiveFilters={hasActiveFilters}
          clearFilters={clearFilters}
        />

        {error && <div className="error-msg">{error}</div>}

        <SummaryCards
          totalSpent={totalSpent}
          totalReceived={totalReceived}
          netValue={netValue}
          netClass={netClass}
          netLabel={netLabel}
        />

        <Charts transactions={transactions} isDebitTxn={isDebitTxn} />

        <TransactionList
          transactions={transactions}
          loading={loading}
          isDebitTxn={isDebitTxn}
        />
      </div>
    </div>
  )
}
