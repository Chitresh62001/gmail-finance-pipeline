import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

// ─── Color Utilities ─────────────────────────────
const redShades = [
  '#FF6B6B', '#FA5252', '#E03131', '#C92A2A', '#F03E3E', '#FF8787', '#FFA8A8',
]
const greenShades = [
  '#51CF66', '#40C057', '#37B24D', '#2F9E44', '#2B8A3E', '#69DB7C', '#8CE99A',
]

function getCatColor(category, isDebit = true) {
  const cat = category.toLowerCase().replace(/ /g, '_')
  const palette = isDebit ? redShades : greenShades
  let hash = 0
  for (let i = 0; i < cat.length; i++) {
    hash = cat.charCodeAt(i) + ((hash << 5) - hash)
  }
  return palette[Math.abs(hash) % palette.length]
}

// ─── Component ───────────────────────────────────
export default function Charts({ transactions, isDebitTxn }) {
  const tickColor = '#6b7280'
  const gridColor = 'rgba(255,255,255,.06)'
  const bgColor = 'transparent'

  // Donut data
  const spendsByIntent = {}
  transactions.filter(isDebitTxn).forEach(t => {
    const cat = t.intent.toLowerCase()
    spendsByIntent[cat] = (spendsByIntent[cat] || 0) + Math.abs(t.amount)
  })
  const donutLabelsRaw = Object.keys(spendsByIntent)
  const donutLabels = donutLabelsRaw.map(l => l.replace(/_/g, ' '))
  const donutData = donutLabelsRaw.map(l => spendsByIntent[l])
  const donutColors = donutLabelsRaw.map(l => getCatColor(l, true))

  // Bar data
  const spendsByDate = {}
  const receivesByDate = {}
  transactions.forEach(t => {
    const dateStr = new Date(t.txn_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    if (isDebitTxn(t)) {
      spendsByDate[dateStr] = (spendsByDate[dateStr] || 0) + Math.abs(t.amount)
    } else {
      receivesByDate[dateStr] = (receivesByDate[dateStr] || 0) + Math.abs(t.amount)
    }
  })
  const allDatesSet = new Set([...Object.keys(spendsByDate), ...Object.keys(receivesByDate)])
  const sortedDates = Array.from(allDatesSet).sort((a, b) => new Date(a) - new Date(b))
  const spendBarData = sortedDates.map(d => spendsByDate[d] || 0)
  const receiveBarData = sortedDates.map(d => receivesByDate[d] || 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1.7fr] gap-3 mb-6 stagger-children">
      {/* Donut Chart */}
      <div className="card bg-base-200 rounded-2xl border-[0.5px] border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.08)] transition-all duration-300">
        <div className="card-body p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-3">
            By Intent (Spend)
          </h3>
          <div className="relative h-[170px]">
            <Doughnut
              data={{
                labels: donutLabels,
                datasets: [{
                  data: donutData,
                  backgroundColor: donutColors,
                  borderWidth: 2,
                  borderColor: bgColor,
                  hoverOffset: 5,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '68%',
                plugins: {
                  legend: { display: false },
                  tooltip: { callbacks: { label: ctx => ` ₹${ctx.raw.toFixed(2)}` } },
                },
              }}
            />
          </div>
          {/* Legend */}
          <div className="flex flex-col gap-2 mt-3">
            {donutLabelsRaw.map((catRaw, idx) => (
              <div key={catRaw} className="flex items-center gap-2.5 text-xs text-base-content/60 py-1 px-1.5 rounded-md hover:bg-white/5 transition-colors">
                <span className="leg-dot" style={{ background: donutColors[idx] }} />
                <span className="flex-1 capitalize">{donutLabels[idx]}</span>
                <span className="font-semibold text-base-content text-sm">₹{spendsByIntent[catRaw].toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="card bg-base-200 rounded-2xl border-[0.5px] border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.08)] transition-all duration-300">
        <div className="card-body p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-3">
            Daily Cash Flow
          </h3>
          <div className="relative h-[230px]">
            <Bar
              data={{
                labels: sortedDates,
                datasets: [
                  {
                    label: 'Spent',
                    data: spendBarData,
                    backgroundColor: '#f87171',
                    borderRadius: 4,
                  },
                  {
                    label: 'Received',
                    data: receiveBarData,
                    backgroundColor: '#34d399',
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    labels: { color: tickColor, font: { size: 11 } },
                  },
                  tooltip: { callbacks: { label: ctx => ` ₹${ctx.raw.toFixed(2)}` } },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: tickColor, font: { size: 12 } },
                  },
                  y: {
                    grid: { color: gridColor },
                    ticks: { color: tickColor, font: { size: 12 }, callback: v => '₹' + v },
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
