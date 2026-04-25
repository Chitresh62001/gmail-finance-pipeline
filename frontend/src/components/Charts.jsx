import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

// ─── Color Utilities ─────────────────────────────
const catColors = {
  groceries: '#378ADD',
  food: '#1D9E75',
  pharmacy: '#D85A30',
  services: '#BA7517',
  received: '#639922',
  default: '#888',
}

const redShades = [
  '#FF6B6B', '#FA5252', '#E03131', '#C92A2A', '#F03E3E', '#FF8787', '#FFA8A8',
]
const greenShades = [
  '#51CF66', '#40C057', '#37B24D', '#2F9E44', '#2B8A3E', '#69DB7C', '#8CE99A',
]

function getCatColor(category, isDebit = true) {
  const cat = category.toLowerCase().replace(/ /g, '_')
  const palette = isDebit ? redShades : greenShades

  if (catColors[cat] && catColors[cat] !== '#888') {
    // If it's a known color in catColors, we can still use it or blend it. 
    // But the user asked for shades of red/green.
    // Let's stick to the palettes for consistency as requested.
  }

  let hash = 0
  for (let i = 0; i < cat.length; i++) {
    hash = cat.charCodeAt(i) + ((hash << 5) - hash)
  }
  return palette[Math.abs(hash) % palette.length]
}

// ─── Component ───────────────────────────────────
export default function Charts({ transactions, isDebitTxn }) {
  // Always dark theme
  const tickColor = '#5a5a54'
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
    <div className="charts-row">
      {/* Bar Chart (Replaced Donut) */}
      <div className="panel">
        <div className="panel-title">By Intent (Spend)</div>
        <div style={{ position: 'relative', height: '170px' }}>
          <Bar
            data={{
              labels: donutLabels,
              datasets: [{
                label: 'Spent',
                data: donutData,
                backgroundColor: donutColors,
                borderWidth: 1,
                borderColor: bgColor,
              }],
            }}
            options={{
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => ` ₹${ctx.raw.toFixed(2)}` } },
              },
              scales: {
                x: {
                  grid: { color: gridColor },
                  ticks: { color: tickColor, font: { size: 11 }, callback: v => '₹' + v },
                  beginAtZero: true,
                },
                y: {
                  grid: { display: false },
                  ticks: { color: tickColor, font: { size: 11 } },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Bar Chart */}
      <div className="panel">
        <div className="panel-title">Daily Cash Flow</div>
        <div style={{ position: 'relative', height: '230px' }}>
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
                legend: { display: true, position: 'top', labels: { color: tickColor, font: { size: 11 } } },
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
  )
}
