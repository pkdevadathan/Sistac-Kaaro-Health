import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useStakeholderExcel } from './hooks/useStakeholderExcel'
import type { ClinicOrder, ConsumptionRecord, OrderStatus } from './types/dashboard'
import { aggregateStakeholderToConsumption, stakeholderRowsToClinicOrders } from './utils/stakeholderTransforms'
import { baseRelativeUrl } from './utils/assetUrl'

const formatMonth = (value: string) => {
  const [year, month] = value.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleString('en-IN', {
    month: 'short',
    year: 'numeric',
  })
}

type StockPressureKind = 'mom-spike' | 'vs-avg' | 'trend'

type StockPressureSignal = {
  id: string
  kind: StockPressureKind
  /** Short label for the pill (uses real % / ratio — not capped like the old chart). */
  metricShort: string
  sortRank: number
  message: string
}

function App() {
  const [activePage, setActivePage] = useState<'consumption' | 'orders'>('consumption')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [consumptionFilterClinic, setConsumptionFilterClinic] = useState('')
  const [consumptionFilterItem, setConsumptionFilterItem] = useState('')
  const [fromMonth, setFromMonth] = useState('2026-01')
  const [toMonth, setToMonth] = useState('2026-03')
  type ConsumptionDataMode = 'rollup-month' | 'rollup-clinic' | 'rollup-item' | 'detail-lines'
  const [consumptionDataMode, setConsumptionDataMode] = useState<ConsumptionDataMode>('rollup-month')
  const [consumptionPageIndex, setConsumptionPageIndex] = useState(0)
  const consumptionPageSize = 25

  const [orderClinic, setOrderClinic] = useState('')
  const [orderItem, setOrderItem] = useState('')
  const [orderQty, setOrderQty] = useState(10)
  const [deliveryDate, setDeliveryDate] = useState('')
  const [comments, setComments] = useState('')
  const [orderLines, setOrderLines] = useState<{ itemName: string; quantity: number; unitCost: number }[]>([])
  const [orders, setOrders] = useState<ClinicOrder[]>([])
  const [orderSearchInput, setOrderSearchInput] = useState('')
  const [orderSearchQuery, setOrderSearchQuery] = useState('')

  const { rows: stakeholderRows, loading: stakeholderLoading, error: stakeholderError, hasStakeholderData } =
    useStakeholderExcel()
  const ordersSeededFromExcel = useRef(false)

  const consumptionFromStakeholder = useMemo(
    () => aggregateStakeholderToConsumption(stakeholderRows),
    [stakeholderRows],
  )
  const usingStakeholderSource = hasStakeholderData && !stakeholderError
  const effectiveConsumption: ConsumptionRecord[] = consumptionFromStakeholder

  useEffect(() => {
    if (!stakeholderRows.length) return
    const months = [...new Set(stakeholderRows.map((r) => r.month))].sort()
    setFromMonth(months[0] ?? '2026-01')
    setToMonth(months[months.length - 1] ?? '2026-03')
  }, [stakeholderRows])

  useEffect(() => {
    if (stakeholderLoading || ordersSeededFromExcel.current) return
    if (hasStakeholderData) {
      setOrders(stakeholderRowsToClinicOrders(stakeholderRows))
      ordersSeededFromExcel.current = true
    }
  }, [stakeholderLoading, hasStakeholderData, stakeholderRows])

  const clinicSuggestions = useMemo(() => {
    return [...new Set(effectiveConsumption.map((r) => r.clinic))].sort()
  }, [effectiveConsumption])

  const itemSuggestions = useMemo(() => {
    return [...new Set(effectiveConsumption.map((r) => r.item))].sort().slice(0, 400)
  }, [effectiveConsumption])

  useEffect(() => {
    setConsumptionPageIndex(0)
  }, [consumptionFilterClinic, consumptionFilterItem, fromMonth, toMonth, consumptionDataMode])

  const orderClinicOptions = useMemo(() => {
    return [...new Set(stakeholderRows.map((r) => r.clinicName))].sort()
  }, [stakeholderRows])

  const productNamesForOrders = useMemo(() => {
    return [...new Set(stakeholderRows.map((r) => r.item))].sort()
  }, [stakeholderRows])

  useEffect(() => {
    if (!orderClinicOptions.length) return
    if (!orderClinic || !orderClinicOptions.includes(orderClinic)) {
      setOrderClinic(orderClinicOptions[0])
    }
  }, [orderClinicOptions, orderClinic])

  useEffect(() => {
    if (!productNamesForOrders.length) return
    if (!orderItem || !productNamesForOrders.includes(orderItem)) {
      setOrderItem(productNamesForOrders[0])
    }
  }, [productNamesForOrders, orderItem])

  const filteredConsumption = useMemo(() => {
    const clinicQ = consumptionFilterClinic.trim().toLowerCase()
    const itemQ = consumptionFilterItem.trim().toLowerCase()
    return effectiveConsumption.filter((row) => {
      const clinicMatch = !clinicQ || row.clinic.toLowerCase().includes(clinicQ)
      const itemMatch = !itemQ || row.item.toLowerCase().includes(itemQ)
      const monthMatch = row.month >= fromMonth && row.month <= toMonth
      return clinicMatch && itemMatch && monthMatch
    })
  }, [effectiveConsumption, consumptionFilterClinic, consumptionFilterItem, fromMonth, toMonth])

  const consumptionViewStats = useMemo(() => {
    const clinics = new Set(filteredConsumption.map((r) => r.clinic))
    const items = new Set(filteredConsumption.map((r) => r.item))
    const qty = filteredConsumption.reduce((s, r) => s + r.consumedStock, 0)
    return {
      totalQty: qty,
      clinicCount: clinics.size,
      skuCount: items.size,
      rowCount: filteredConsumption.length,
    }
  }, [filteredConsumption])

  const rollupByMonth = useMemo(() => {
    const map: Record<string, { qty: number; clinics: Set<string>; lineRows: number }> = {}
    filteredConsumption.forEach((row) => {
      if (!map[row.month]) map[row.month] = { qty: 0, clinics: new Set(), lineRows: 0 }
      map[row.month].qty += row.consumedStock
      map[row.month].clinics.add(row.clinic)
      map[row.month].lineRows += 1
    })
    return Object.keys(map)
      .sort()
      .map((monthKey) => ({
        monthKey,
        monthLabel: formatMonth(monthKey),
        totalQty: map[monthKey].qty,
        clinicCount: map[monthKey].clinics.size,
        lineRows: map[monthKey].lineRows,
      }))
  }, [filteredConsumption])

  const rollupByClinic = useMemo(() => {
    const map: Record<string, number> = {}
    filteredConsumption.forEach((row) => {
      map[row.clinic] = (map[row.clinic] || 0) + row.consumedStock
    })
    return Object.entries(map)
      .map(([clinic, totalQty]) => ({ clinic, totalQty }))
      .sort((a, b) => b.totalQty - a.totalQty)
  }, [filteredConsumption])

  const rollupByItem = useMemo(() => {
    const map: Record<string, { qty: number; unit?: string }> = {}
    filteredConsumption.forEach((row) => {
      const prev = map[row.item]
      if (prev) prev.qty += row.consumedStock
      else map[row.item] = { qty: row.consumedStock, unit: row.unit }
    })
    return Object.entries(map)
      .map(([item, v]) => ({ item, totalQty: v.qty, unit: v.unit }))
      .sort((a, b) => b.totalQty - a.totalQty)
  }, [filteredConsumption])

  const paginatedDetailLines = useMemo(() => {
    const start = consumptionPageIndex * consumptionPageSize
    return filteredConsumption.slice(start, start + consumptionPageSize)
  }, [filteredConsumption, consumptionPageIndex, consumptionPageSize])

  const consumptionDetailPageCount = Math.max(1, Math.ceil(filteredConsumption.length / consumptionPageSize))

  const monthlyTrend = useMemo(() => {
    const byMonth: Record<string, number> = {}
    filteredConsumption.forEach((row) => {
      byMonth[row.month] = (byMonth[row.month] || 0) + row.consumedStock
    })
    return Object.keys(byMonth)
      .sort()
      .map((month) => ({ month: formatMonth(month), consumed: byMonth[month] }))
  }, [filteredConsumption])

  const clinicComparison = useMemo(() => {
    const byClinic: Record<string, number> = {}
    filteredConsumption.forEach((row) => {
      byClinic[row.clinic] = (byClinic[row.clinic] || 0) + row.consumedStock
    })
    return Object.entries(byClinic).map(([clinic, consumed]) => ({ clinic, consumed }))
  }, [filteredConsumption])

  /** Chart only: top clinics so bars stay readable */
  const clinicComparisonTop = useMemo(() => {
    return [...clinicComparison].sort((a, b) => b.consumed - a.consumed).slice(0, 12)
  }, [clinicComparison])

  const clinicBarChartHeight = useMemo(() => {
    return Math.min(420, Math.max(200, clinicComparisonTop.length * 28))
  }, [clinicComparisonTop.length])

  const consumptionAlerts = useMemo(() => {
    if (!usingStakeholderSource || !filteredConsumption.length) return []
    const byClinic: Record<string, number> = {}
    filteredConsumption.forEach((row) => {
      byClinic[row.clinic] = (byClinic[row.clinic] || 0) + row.consumedStock
    })
    const ranked = Object.entries(byClinic)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([clinic, qty]) => `${clinic}: total ordered quantity in view (${qty.toLocaleString()} units)`)
    const groups = new Map<string, ConsumptionRecord[]>()
    filteredConsumption.forEach((row) => {
      const k = `${row.clinic}|${row.item}`
      const list = groups.get(k)
      if (list) list.push(row)
      else groups.set(k, [row])
    })
    const spikes: string[] = []
    for (const [, rows] of groups) {
      const sorted = [...rows].sort((a, b) => a.month.localeCompare(b.month))
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1].consumedStock
        const cur = sorted[i].consumedStock
        if (prev > 0 && cur > prev * 2) {
          spikes.push(
            `${sorted[i].clinic} · ${sorted[i].item}: month-over-month order spike in ${formatMonth(sorted[i].month)}`,
          )
        }
      }
    }
    return [...ranked, ...new Set(spikes)].slice(0, 6)
  }, [filteredConsumption, usingStakeholderSource])

  /** Inferred from order history: not live inventory, but rising orders often indicate clinics chasing low stock. */
  const stockPressureSignals = useMemo((): StockPressureSignal[] => {
    if (!usingStakeholderSource || filteredConsumption.length < 2) return []
    const groups = new Map<string, ConsumptionRecord[]>()
    filteredConsumption.forEach((row) => {
      const k = JSON.stringify([row.clinic, row.item])
      const list = groups.get(k)
      if (list) list.push(row)
      else groups.set(k, [row])
    })
    const signals: StockPressureSignal[] = []
    for (const rows of groups.values()) {
      const sorted = [...rows].sort((a, b) => a.month.localeCompare(b.month))
      if (sorted.length < 2) continue
      const clinic = sorted[0].clinic
      const item = sorted[0].item
      const id = JSON.stringify([clinic, item])
      const last = sorted[sorted.length - 1]
      const prev = sorted[sorted.length - 2]
      if (prev.consumedStock > 0 && last.consumedStock >= prev.consumedStock * 1.5) {
        const pct = Math.round((last.consumedStock / prev.consumedStock - 1) * 100)
        signals.push({
          id,
          kind: 'mom-spike',
          metricShort: `+${pct}% MoM`,
          sortRank: pct,
          message: `${clinic} · ${item}: monthly orders rose ${pct}% (${formatMonth(prev.month)} → ${formatMonth(last.month)}). Consider checking stock — clinics often order more when supply is tight.`,
        })
        continue
      }
      if (sorted.length >= 3) {
        const priorRows = sorted.slice(0, -1)
        const avg = priorRows.reduce((s, r) => s + r.consumedStock, 0) / priorRows.length
        if (avg > 0 && last.consumedStock >= avg * 1.75) {
          const ratio = last.consumedStock / avg
          const sortRank = Math.round((ratio - 1) * 100)
          const ratioLabel = ratio >= 10 ? ratio.toFixed(1) : ratio.toFixed(2)
          signals.push({
            id,
            kind: 'vs-avg',
            metricShort: `${ratioLabel}× vs avg`,
            sortRank,
            message: `${clinic} · ${item}: latest month (${last.consumedStock.toLocaleString()} units) is much higher than the earlier average in this period (~${Math.round(avg).toLocaleString()}). Possible stock pressure.`,
          })
          continue
        }
        const a = sorted[sorted.length - 3].consumedStock
        const b = sorted[sorted.length - 2].consumedStock
        const c = last.consumedStock
        if (a > 0 && b >= a && c >= b * 1.15) {
          const sortRank = 35 + Math.min(40, Math.round(((c / a - 1) * 12)))
          signals.push({
            id,
            kind: 'trend',
            metricShort: '3-mo uptrend',
            sortRank,
            message: `${clinic} · ${item}: orders climbed over the last three months in view — monitor for depletion risk.`,
          })
        }
      }
    }
    const byId = new Map<string, StockPressureSignal>()
    for (const s of signals) {
      const prev = byId.get(s.id)
      if (!prev || s.sortRank > prev.sortRank) byId.set(s.id, s)
    }
    return [...byId.values()].sort((a, b) => b.sortRank - a.sortRank).slice(0, 18)
  }, [filteredConsumption, usingStakeholderSource])

  const nextMonthForecast = useMemo(() => {
    const months = [...new Set(filteredConsumption.map((r) => r.month))].sort()
    const lastThreeMonths = months.slice(-3)
    const rowsInWindow = filteredConsumption.filter((r) => lastThreeMonths.includes(r.month))
    if (!rowsInWindow.length) return 0
    const totalQty = rowsInWindow.reduce((sum, row) => sum + row.consumedStock, 0)
    const avg = totalQty / lastThreeMonths.length
    return Math.round(avg * 1.05)
  }, [filteredConsumption])

  const recentConsumptionItems = useMemo(() => {
    return [...effectiveConsumption]
      .sort((a, b) => (a.month < b.month ? 1 : -1))
      .slice(0, 5)
      .map((row) => row.item)
  }, [effectiveConsumption])

  const orderSuggestions = recentConsumptionItems.slice(0, 8)

  const orderSummary = useMemo(() => {
    const totalLines = orderLines.length
    const totalQuantity = orderLines.reduce((sum, row) => sum + row.quantity, 0)
    const estimatedCost = orderLines.reduce((sum, row) => sum + row.quantity * row.unitCost, 0)
    return { totalLines, totalQuantity, estimatedCost }
  }, [orderLines])

  const pendingOrderItems = new Set(
    orders
      .filter((order) => ['Submitted', 'Approved'].includes(order.status))
      .flatMap((order) => order.items.map((item) => item.itemName)),
  )

  const filteredOrdersTable = useMemo(() => {
    const terms = orderSearchQuery
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
    if (!terms.length) return orders
    return orders.filter((order) => {
      const haystack = [
        order.id,
        order.clinicName,
        order.status,
        order.preferredDeliveryDate,
        order.createdAt,
        order.comments,
        ...order.items.map((i) => `${i.itemName} ${i.quantity}`),
      ]
        .join(' ')
        .toLowerCase()
      return terms.every((term) => haystack.includes(term))
    })
  }, [orders, orderSearchQuery])

  const addOrderLine = () => {
    if (!orderItem.trim()) return
    setOrderLines((rows) => [...rows, { itemName: orderItem, quantity: orderQty, unitCost: 0 }])
  }

  const workbookReady = usingStakeholderSource && stakeholderRows.length > 0

  useEffect(() => {
    if (workbookReady && !deliveryDate) {
      setDeliveryDate(new Date().toISOString().slice(0, 10))
    }
  }, [workbookReady, deliveryDate])

  const saveOrder = (status: OrderStatus) => {
    if (!orderLines.length) return
    const newOrder: ClinicOrder = {
      id: `ORD-${Math.floor(2500 + Math.random() * 1000)}`,
      clinicName: orderClinic,
      items: orderLines,
      preferredDeliveryDate: deliveryDate,
      comments,
      status,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setOrders((old) => [newOrder, ...old])
    setComments('')
    setOrderLines([])
    setOrderQty(10)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <img
            className="brand-logo"
            src={baseRelativeUrl('kaaro-logo.png')}
            alt="Kaaro — Good health for everyone, everywhere"
            width={200}
            height={48}
            decoding="async"
          />
        </div>
        <nav>
          <button
            className={`nav-item ${activePage === 'consumption' ? 'active' : ''}`}
            onClick={() => setActivePage('consumption')}
          >
            Consumption Track
          </button>
          <button
            className={`nav-item ${activePage === 'orders' ? 'active' : ''}`}
            onClick={() => setActivePage('orders')}
          >
            Order Placing
          </button>
        </nav>
      </aside>

      <main className="content">
        <header className="top-bar">
          <button className="menu-button" onClick={() => setSidebarOpen((state) => !state)}>
            Menu
          </button>
          <img
            className="top-bar-logo"
            src={baseRelativeUrl('kaaro-logo.png')}
            alt=""
            width={140}
            height={34}
            decoding="async"
            aria-hidden
          />
          <div>
            <h2>
              {activePage === 'consumption' && 'Month-wise Order Quantities'}
              {activePage === 'orders' && 'Clinic Order Placing'}
            </h2>
            <p>Operations dashboard for data-driven clinic supply decisions</p>
          </div>
        </header>

        {stakeholderLoading && (
          <section className="card alert-soft stakeholder-notice">Loading stakeholder Excel workbook…</section>
        )}
        {stakeholderError && (
          <section className="card alert stakeholder-notice">
            Could not load the workbook ({stakeholderError}). Consumption and orders stay empty until the file loads. For
            local dev add <code>public/data/stakeholder-monthly-orders.xlsx</code>; for deploys include it in the build and
            match <code>Vite BASE_URL</code> if the app is not served from the domain root.
          </section>
        )}
        {usingStakeholderSource && !stakeholderLoading && (
          <section className="card stakeholder-notice">
            <strong>Workbook loaded</strong> — {stakeholderRows.length.toLocaleString()} line items from the Excel file.
          </section>
        )}

        {activePage === 'consumption' && (
          <>
            {!usingStakeholderSource && !stakeholderLoading && (
              <section className="card alert-soft stakeholder-notice">
                Monthly order charts and tables appear after the workbook loads successfully (
                <code>public/data/stakeholder-monthly-orders.xlsx</code>).
              </section>
            )}
            <section className="cards consumption-kpi-row">
              <article className="card">
                <span>Ordered qty (view)</span>
                <strong>{consumptionViewStats.totalQty.toLocaleString()}</strong>
              </article>
              <article className="card">
                <span>Clinics in view</span>
                <strong>{consumptionViewStats.clinicCount}</strong>
              </article>
              <article className="card">
                <span>Distinct items</span>
                <strong>{consumptionViewStats.skuCount}</strong>
              </article>
              <article className="card">
                <span>Raw rows</span>
                <strong>{consumptionViewStats.rowCount.toLocaleString()}</strong>
              </article>
            </section>

            <section className="panel consumption-controls-panel">
              <div className="panel-head consumption-controls-head">
                <div>
                  <h3>Filters &amp; view</h3>
                  <p className="consumption-controls-lede">
                    Narrow by date and optional text. Summary tables compress the dataset; switch to{' '}
                    <strong>All lines</strong> only when you need row-level export-style detail (paginated).
                  </p>
                </div>
              </div>
              <div className="consumption-toolbar">
                <label className="consumption-field">
                  <span>From</span>
                  <input type="month" value={fromMonth} onChange={(event) => setFromMonth(event.target.value)} />
                </label>
                <label className="consumption-field">
                  <span>To</span>
                  <input type="month" value={toMonth} onChange={(event) => setToMonth(event.target.value)} />
                </label>
                <label className="consumption-field consumption-field-grow">
                  <span>Clinic contains</span>
                  <input
                    value={consumptionFilterClinic}
                    onChange={(event) => setConsumptionFilterClinic(event.target.value)}
                    placeholder="e.g. Kaaro — optional"
                    list="consumption-clinic-datalist"
                    autoComplete="off"
                  />
                </label>
                <datalist id="consumption-clinic-datalist">
                  {clinicSuggestions.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <label className="consumption-field consumption-field-grow">
                  <span>Item contains</span>
                  <input
                    value={consumptionFilterItem}
                    onChange={(event) => setConsumptionFilterItem(event.target.value)}
                    placeholder="e.g. Paracetamol — optional"
                    list="consumption-item-datalist"
                    autoComplete="off"
                  />
                </label>
                <datalist id="consumption-item-datalist">
                  {itemSuggestions.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </div>
              <div className="consumption-view-toggle" role="tablist" aria-label="Consumption data shape">
                <button
                  type="button"
                  className={consumptionDataMode === 'rollup-month' ? 'active' : ''}
                  onClick={() => setConsumptionDataMode('rollup-month')}
                >
                  By month
                </button>
                <button
                  type="button"
                  className={consumptionDataMode === 'rollup-clinic' ? 'active' : ''}
                  onClick={() => setConsumptionDataMode('rollup-clinic')}
                >
                  By clinic
                </button>
                <button
                  type="button"
                  className={consumptionDataMode === 'rollup-item' ? 'active' : ''}
                  onClick={() => setConsumptionDataMode('rollup-item')}
                >
                  By item
                </button>
                <button
                  type="button"
                  className={consumptionDataMode === 'detail-lines' ? 'active' : ''}
                  onClick={() => setConsumptionDataMode('detail-lines')}
                >
                  All lines
                </button>
              </div>
            </section>

            <section className="dashboard-grid consumption-charts-grid">
              <article className="panel">
                <div className="panel-head">
                  <h3>Monthly totals (trend)</h3>
                </div>
                <div className="chart-wrap chart-wrap-fixed">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid stroke="#e4eaf0" strokeDasharray="4 4" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="consumed"
                        name="Ordered quantity"
                        stroke="#ed7d31"
                        strokeWidth={2.5}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </article>
              <article className="panel">
                <div className="panel-head">
                  <h3>Top clinics by volume</h3>
                  <p className="panel-sub">Top 12 in the current filter — keeps the chart readable.</p>
                </div>
                <div className="chart-wrap chart-wrap-bar" style={{ height: clinicBarChartHeight }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={clinicComparisonTop}
                      margin={{ top: 8, right: 20, left: 4, bottom: 8 }}
                    >
                      <CartesianGrid stroke="#e4eaf0" strokeDasharray="4 4" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="clinic" width={132} tick={{ fontSize: 11 }} interval={0} />
                      <Tooltip />
                      <Bar dataKey="consumed" name="Ordered quantity" fill="#111111" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </section>

            <section className="panel table-panel consumption-table-panel">
              <div className="panel-head">
                <h3>
                  {consumptionDataMode === 'rollup-month' && 'Summary · by month'}
                  {consumptionDataMode === 'rollup-clinic' && 'Summary · by clinic'}
                  {consumptionDataMode === 'rollup-item' && 'Summary · by item'}
                  {consumptionDataMode === 'detail-lines' && 'Row-level order lines'}
                </h3>
                <p className="panel-sub">
                  {consumptionDataMode !== 'detail-lines'
                    ? 'Aggregated from filtered rows below the charts.'
                    : `Showing ${paginatedDetailLines.length} of ${filteredConsumption.length.toLocaleString()} rows.`}
                </p>
              </div>
              {filteredConsumption.length === 0 ? (
                <p className="consumption-empty">
                  {!usingStakeholderSource && !stakeholderLoading
                    ? 'No workbook data loaded yet.'
                    : 'Nothing matches these filters. Widen the date range or clear text filters.'}
                </p>
              ) : (
                <>
                  <div className="table-wrap consumption-table-scroll">
                    <table>
                      <thead>
                        {consumptionDataMode === 'rollup-month' && (
                          <tr>
                            <th>Month</th>
                            <th className="cell-num">Ordered qty</th>
                            <th className="cell-num">Clinics</th>
                            <th className="cell-num">Aggregated lines</th>
                          </tr>
                        )}
                        {consumptionDataMode === 'rollup-clinic' && (
                          <tr>
                            <th>Clinic</th>
                            <th className="cell-num">Ordered qty</th>
                          </tr>
                        )}
                        {consumptionDataMode === 'rollup-item' && (
                          <tr>
                            <th>Item</th>
                            <th>Unit</th>
                            <th className="cell-num">Ordered qty</th>
                          </tr>
                        )}
                        {consumptionDataMode === 'detail-lines' && (
                          <tr>
                            <th>Month</th>
                            <th>Clinic</th>
                            <th>Item</th>
                            <th>Unit</th>
                            <th className="cell-num">Ordered qty</th>
                          </tr>
                        )}
                      </thead>
                      <tbody>
                        {consumptionDataMode === 'rollup-month' &&
                          rollupByMonth.map((row) => (
                            <tr key={row.monthKey}>
                              <td>{row.monthLabel}</td>
                              <td className="cell-num">{row.totalQty.toLocaleString()}</td>
                              <td className="cell-num">{row.clinicCount}</td>
                              <td className="cell-num">{row.lineRows.toLocaleString()}</td>
                            </tr>
                          ))}
                        {consumptionDataMode === 'rollup-clinic' &&
                          rollupByClinic.map((row) => (
                            <tr key={row.clinic}>
                              <td>{row.clinic}</td>
                              <td className="cell-num">{row.totalQty.toLocaleString()}</td>
                            </tr>
                          ))}
                        {consumptionDataMode === 'rollup-item' &&
                          rollupByItem.map((row) => (
                            <tr key={row.item}>
                              <td>{row.item}</td>
                              <td>{row.unit ?? '—'}</td>
                              <td className="cell-num">{row.totalQty.toLocaleString()}</td>
                            </tr>
                          ))}
                        {consumptionDataMode === 'detail-lines' &&
                          paginatedDetailLines.map((row) => (
                            <tr key={`${row.month}-${row.clinic}-${row.item}`}>
                              <td>{formatMonth(row.month)}</td>
                              <td>{row.clinic}</td>
                              <td>{row.item}</td>
                              <td>{row.unit ?? '—'}</td>
                              <td className="cell-num">{row.consumedStock}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  {consumptionDataMode === 'detail-lines' && consumptionDetailPageCount > 1 && (
                    <div className="consumption-pagination">
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={consumptionPageIndex <= 0}
                        onClick={() => setConsumptionPageIndex((p) => Math.max(0, p - 1))}
                      >
                        Previous
                      </button>
                      <span className="consumption-page-meta">
                        Page {consumptionPageIndex + 1} of {consumptionDetailPageCount}
                      </span>
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={consumptionPageIndex >= consumptionDetailPageCount - 1}
                        onClick={() =>
                          setConsumptionPageIndex((p) => Math.min(consumptionDetailPageCount - 1, p + 1))
                        }
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>

            <section className="panel consumption-stock-panel">
              <div className="panel-head">
                <h3>Low-stock risk signals</h3>
                <p className="panel-sub">
                  Based on monthly <strong>order quantities</strong> in your filters — not live shelf counts. Sudden or
                  sustained increases often mean a clinic is ordering to catch up after heavy use or low availability.
                </p>
              </div>
              {!usingStakeholderSource ? (
                <ul className="alert-list stock-pressure-list">
                  <li>Load the workbook to compute these signals.</li>
                </ul>
              ) : (
                <div className="stock-pressure-list-wrap">
                  <ul className="alert-list stock-pressure-list">
                    {stockPressureSignals.length ? (
                      stockPressureSignals.map((s) => (
                        <li key={s.id}>
                          <span
                            className={`stock-signal-pill stock-signal-pill--${s.kind}`}
                            title={
                              s.kind === 'mom-spike'
                                ? 'Month-over-month jump in ordered quantity'
                                : s.kind === 'vs-avg'
                                  ? 'Latest month vs average of earlier months in view'
                                  : 'Rising orders over the last three months in view'
                            }
                          >
                            {s.metricShort}
                          </span>
                          <span className="stock-warning-icon" aria-hidden>
                            !
                          </span>
                          <span className="stock-pressure-copy">{s.message}</span>
                        </li>
                      ))
                    ) : (
                      <li>No elevated stock-pressure patterns in the current filter window.</li>
                    )}
                  </ul>
                </div>
              )}
            </section>

            <section className="dashboard-grid consumption-insights-grid">
              <article className="panel consumption-insights-panel">
                <div className="panel-head">
                  <h3>Highlights</h3>
                  <p className="panel-sub">Derived from your current filters.</p>
                </div>
                <ul className="alert-list consumption-alert-list">
                  {consumptionAlerts.length ? (
                    consumptionAlerts.map((alert) => <li key={alert}>{alert}</li>)
                  ) : (
                    <li>No anomalies in selected period.</li>
                  )}
                </ul>
              </article>
              <article className="panel consumption-insights-panel">
                <div className="panel-head">
                  <h3>Forecast</h3>
                  <p className="panel-sub">Ballpark projection from recent activity in view.</p>
                </div>
                <div className="forecast-box forecast-box-compact">
                  <strong>{nextMonthForecast.toLocaleString()} units</strong>
                  <small>
                    Based on ordered quantities from the last three calendar months in your current filters (workbook data).
                  </small>
                </div>
              </article>
            </section>
          </>
        )}

        {activePage === 'orders' && (
          <>
            {!workbookReady && !stakeholderLoading && (
              <section className="card alert-soft stakeholder-notice">
                Load the workbook to populate clinics and items. The form stays disabled until data is available.
              </section>
            )}
            <section className="dashboard-grid orders-layout">
              <article className="panel">
                <div className="panel-head">
                  <h3>Clinic Order Form</h3>
                </div>
                <div className="filters">
                  <select
                    value={orderClinic}
                    onChange={(event) => setOrderClinic(event.target.value)}
                    disabled={!workbookReady}
                  >
                    {!orderClinicOptions.length ? (
                      <option value="">—</option>
                    ) : (
                      orderClinicOptions.map((clinic) => (
                        <option key={clinic} value={clinic}>
                          {clinic}
                        </option>
                      ))
                    )}
                  </select>
                  <select
                    value={orderItem}
                    onChange={(event) => setOrderItem(event.target.value)}
                    disabled={!workbookReady}
                  >
                    {!productNamesForOrders.length ? (
                      <option value="">—</option>
                    ) : (
                      productNamesForOrders.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))
                    )}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={orderQty}
                    onChange={(event) => setOrderQty(Number(event.target.value))}
                    placeholder="Quantity"
                    disabled={!workbookReady}
                  />
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(event) => setDeliveryDate(event.target.value)}
                    disabled={!workbookReady}
                  />
                  <textarea
                    value={comments}
                    onChange={(event) => setComments(event.target.value)}
                    placeholder="Comments"
                    rows={3}
                    disabled={!workbookReady}
                  />
                  <button type="button" className="primary-button" onClick={addOrderLine} disabled={!workbookReady}>
                    Add Item
                  </button>
                </div>

                <div className="inline-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={!workbookReady}
                    onClick={() => saveOrder('Draft')}
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    disabled={!workbookReady}
                    onClick={() => saveOrder('Submitted')}
                  >
                    Submit Order
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => {
                      setOrderLines([])
                      setComments('')
                    }}
                  >
                    Cancel
                  </button>
                </div>

                <div className="validation-box">
                  {orderQty > 120 && <p className="warning">Warning: quantity appears unusually high.</p>}
                  {pendingOrderItems.has(orderItem) && (
                    <p className="warning">Warning: this item already has a pending order.</p>
                  )}
                </div>

                <div className="suggestions">
                  <h4>Auto-suggestions</h4>
                  <div className="tag-row">
                    {orderSuggestions.map((suggestion) => (
                      <button key={suggestion} className="tag" onClick={() => setOrderItem(suggestion)}>
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </article>

              <article className="panel">
                <div className="panel-head">
                  <h3>Live Order Summary</h3>
                </div>
                <div className="summary-box">
                  <p>Requested lines: {orderSummary.totalLines}</p>
                  <p>Total quantity: {orderSummary.totalQuantity}</p>
                  <p>Estimated cost: INR {orderSummary.estimatedCost.toLocaleString()}</p>
                  <p>Expected delivery: {deliveryDate || 'TBD'}</p>
                </div>
                <ul className="summary-lines">
                  {orderLines.map((line, index) => (
                    <li key={`${line.itemName}-${index}`}>
                      {line.itemName} x {line.quantity}
                    </li>
                  ))}
                </ul>
              </article>
            </section>

            <section className="panel table-panel orders-table-panel">
              <div className="panel-head orders-table-panel-head">
                <div>
                  <h3>Orders Table</h3>
                  <p className="panel-sub">Search then click Search or press Enter. Table scrolls when there are many rows.</p>
                </div>
              </div>
              <div className="orders-table-toolbar">
                <label className="orders-search-field">
                  <span className="orders-search-label">Find orders</span>
                  <input
                    type="search"
                    value={orderSearchInput}
                    onChange={(event) => setOrderSearchInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        setOrderSearchQuery(orderSearchInput.trim())
                      }
                    }}
                    placeholder="Order ID, clinic, item, status, date…"
                    autoComplete="off"
                  />
                </label>
                <button
                  type="button"
                  className="primary-button orders-search-submit"
                  onClick={() => setOrderSearchQuery(orderSearchInput.trim())}
                >
                  Search
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setOrderSearchInput('')
                    setOrderSearchQuery('')
                  }}
                >
                  Clear
                </button>
                <span className="orders-search-meta">
                  Showing {filteredOrdersTable.length.toLocaleString()} of {orders.length.toLocaleString()}
                </span>
              </div>
              <div className="table-wrap orders-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Clinic</th>
                      <th>Items</th>
                      <th>Preferred delivery</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrdersTable.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="orders-table-empty-cell">
                          {orders.length === 0
                            ? 'No orders yet.'
                            : 'No orders match your search. Clear filters or try different keywords.'}
                        </td>
                      </tr>
                    ) : (
                      filteredOrdersTable.map((order) => (
                        <tr key={order.id}>
                          <td>{order.id}</td>
                          <td>{order.clinicName}</td>
                          <td>{order.items.map((item) => `${item.itemName} (${item.quantity})`).join(', ')}</td>
                          <td>{order.preferredDeliveryDate}</td>
                          <td>
                            <span className={`badge ${order.status.toLowerCase()}`}>{order.status}</span>
                          </td>
                          <td>{order.createdAt}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default App
