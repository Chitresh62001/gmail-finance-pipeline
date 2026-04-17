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
import { Doughnut, Bar } from 'react-chartjs-2'

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

const dynamicPalette = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#1ABC9C',
  '#F1C40F', '#E74C3C', '#2ECC71', '#95A5A6', '#8E44AD',
]

function getCatColor(category) {
  const cat = category.toLowerCase()
  if (catColors[cat] && catColors[cat] !== '#888') return catColors[cat]
  let hash = 0
  for (let i = 0; i < cat.length; i++) {
    hash = cat.charCodeAt(i) + ((hash << 5) - hash)
  }
  return dynamicPalette[Math.abs(hash) % dynamicPalette.length]
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
  const donutLabels = Object.keys(spendsByIntent)
  const donutData = donutLabels.map(l => spendsByIntent[l])
  const donutColors = donutLabels.map(l => getCatColor(l))

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
      {/* Donut Chart */}
      <div className="panel">
        <div className="panel-title">By Intent (Spend)</div>
        <div style={{ position: 'relative', height: '170px' }}>
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
        <div className="legend">
          {donutLabels.map(cat => (
            <div key={cat} className="leg-row">
              <span className="leg-dot" style={{ background: getCatColor(cat) }}></span>
              <span className="leg-name">{cat}</span>
              <span className="leg-amt">₹{spendsByIntent[cat].toFixed(2)}</span>
            </div>
          ))}
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
