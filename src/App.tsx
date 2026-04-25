import { useMemo, useState } from 'react'
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

type InventoryItem = {
  id: string
  itemName: string
  sku: string
  category: 'Medication' | 'Consumable' | 'Equipment'
  clinicName: string
  currentQuantity: number
  reorderLevel: number
  unit: string
  unitCost: number
  lastUpdated: string
}

type ConsumptionRecord = {
  month: string
  clinic: string
  item: string
  openingStock: number
  receivedStock: number
  consumedStock: number
  closingStock: number
  variance: number
}

type OrderStatus = 'Draft' | 'Submitted' | 'Approved' | 'Fulfilled' | 'Cancelled'

type ClinicOrder = {
  id: string
  clinicName: string
  items: { itemName: string; quantity: number; unitCost: number }[]
  preferredDeliveryDate: string
  comments: string
  status: OrderStatus
  createdAt: string
}

const clinics = ['All clinics', 'Main Clinic', 'North Clinic', 'South Clinic', 'Pharmacy']
const categories = ['All', 'Medication', 'Consumable', 'Equipment']
const statusFilters = ['All', 'In stock', 'Low stock', 'Critical', 'Out of stock']

const seedInventory: InventoryItem[] = [
  { id: '1', itemName: 'Sterile Gloves', sku: 'KH-C-101', category: 'Consumable', clinicName: 'Main Clinic', currentQuantity: 180, reorderLevel: 100, unit: 'boxes', unitCost: 18, lastUpdated: '2026-04-21' },
  { id: '2', itemName: 'Paracetamol 500mg', sku: 'KH-M-114', category: 'Medication', clinicName: 'Pharmacy', currentQuantity: 72, reorderLevel: 90, unit: 'strips', unitCost: 4, lastUpdated: '2026-04-20' },
  { id: '3', itemName: 'IV Cannula', sku: 'KH-C-120', category: 'Consumable', clinicName: 'North Clinic', currentQuantity: 20, reorderLevel: 50, unit: 'units', unitCost: 12, lastUpdated: '2026-04-18' },
  { id: '4', itemName: 'Pulse Oximeter', sku: 'KH-E-210', category: 'Equipment', clinicName: 'South Clinic', currentQuantity: 1, reorderLevel: 6, unit: 'units', unitCost: 1200, lastUpdated: '2026-04-19' },
  { id: '5', itemName: 'Amoxicillin', sku: 'KH-M-144', category: 'Medication', clinicName: 'Main Clinic', currentQuantity: 0, reorderLevel: 55, unit: 'strips', unitCost: 15, lastUpdated: '2026-04-20' },
  { id: '6', itemName: 'Syringe 5ml', sku: 'KH-C-130', category: 'Consumable', clinicName: 'North Clinic', currentQuantity: 260, reorderLevel: 120, unit: 'units', unitCost: 5, lastUpdated: '2026-04-21' },
  { id: '7', itemName: 'Insulin Pen', sku: 'KH-M-166', category: 'Medication', clinicName: 'South Clinic', currentQuantity: 19, reorderLevel: 40, unit: 'units', unitCost: 380, lastUpdated: '2026-04-19' },
  { id: '8', itemName: 'Nebulizer Kit', sku: 'KH-E-245', category: 'Equipment', clinicName: 'Main Clinic', currentQuantity: 12, reorderLevel: 10, unit: 'kits', unitCost: 860, lastUpdated: '2026-04-20' },
]

const usageByKey: Record<string, string[]> = {
  'Main Clinic': ['Syringe 5ml used 42 units yesterday', 'Sterile Gloves used 30 boxes in 3 days'],
  'North Clinic': ['IV Cannula usage rose 18% this week', 'Syringe 5ml used 60 units yesterday'],
  'South Clinic': ['Insulin Pen usage stable for 14 days', 'Pulse Oximeter moved to emergency bay'],
  Pharmacy: ['Paracetamol dispensed 380 strips this week', 'Amoxicillin pending replenishment'],
}

const ordersByKey: Record<string, string[]> = {
  'Main Clinic': ['ORD-2438 submitted for Amoxicillin (pending)', 'ORD-2429 fulfilled for Nebulizer Kit'],
  'North Clinic': ['ORD-2414 approved for IV Cannula', 'ORD-2402 fulfilled for Syringe 5ml'],
  'South Clinic': ['ORD-2398 submitted for Insulin Pen', 'ORD-2380 fulfilled for Pulse Oximeter'],
  Pharmacy: ['ORD-2377 approved for Paracetamol', 'ORD-2371 draft for cold-chain items'],
}

const consumptionData: ConsumptionRecord[] = [
  { month: '2026-01', clinic: 'Main Clinic', item: 'Sterile Gloves', openingStock: 140, receivedStock: 120, consumedStock: 170, closingStock: 90, variance: -5 },
  { month: '2026-02', clinic: 'Main Clinic', item: 'Sterile Gloves', openingStock: 90, receivedStock: 140, consumedStock: 160, closingStock: 70, variance: 3 },
  { month: '2026-03', clinic: 'Main Clinic', item: 'Sterile Gloves', openingStock: 70, receivedStock: 150, consumedStock: 155, closingStock: 65, variance: 0 },
  { month: '2026-01', clinic: 'North Clinic', item: 'IV Cannula', openingStock: 90, receivedStock: 40, consumedStock: 75, closingStock: 55, variance: 10 },
  { month: '2026-02', clinic: 'North Clinic', item: 'IV Cannula', openingStock: 55, receivedStock: 60, consumedStock: 80, closingStock: 35, variance: -8 },
  { month: '2026-03', clinic: 'North Clinic', item: 'IV Cannula', openingStock: 35, receivedStock: 45, consumedStock: 60, closingStock: 20, variance: -6 },
  { month: '2026-01', clinic: 'South Clinic', item: 'Insulin Pen', openingStock: 35, receivedStock: 20, consumedStock: 18, closingStock: 37, variance: 2 },
  { month: '2026-02', clinic: 'South Clinic', item: 'Insulin Pen', openingStock: 37, receivedStock: 30, consumedStock: 25, closingStock: 42, variance: 1 },
  { month: '2026-03', clinic: 'South Clinic', item: 'Insulin Pen', openingStock: 42, receivedStock: 10, consumedStock: 33, closingStock: 19, variance: -4 },
]

const seedOrders: ClinicOrder[] = [
  {
    id: 'ORD-2438',
    clinicName: 'Main Clinic',
    items: [{ itemName: 'Amoxicillin', quantity: 120, unitCost: 15 }],
    preferredDeliveryDate: '2026-04-24',
    comments: 'Urgent refill',
    status: 'Submitted',
    createdAt: '2026-04-21',
  },
  {
    id: 'ORD-2429',
    clinicName: 'Main Clinic',
    items: [{ itemName: 'Nebulizer Kit', quantity: 3, unitCost: 860 }],
    preferredDeliveryDate: '2026-04-18',
    comments: 'Quarterly maintenance',
    status: 'Fulfilled',
    createdAt: '2026-04-17',
  },
]

const getStockStatus = (item: InventoryItem) => {
  if (item.currentQuantity === 0) return 'Out of stock'
  if (item.currentQuantity <= Math.ceil(item.reorderLevel * 0.5)) return 'Critical'
  if (item.currentQuantity <= item.reorderLevel) return 'Low stock'
  return 'In stock'
}

const formatMonth = (value: string) => {
  const [year, month] = value.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleString('en-IN', {
    month: 'short',
    year: 'numeric',
  })
}

function App() {
  const [activePage, setActivePage] = useState<'inventory' | 'consumption' | 'orders'>('inventory')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedClinic, setSelectedClinic] = useState('All clinics')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [inventorySearch, setInventorySearch] = useState('')
  const [drilldownKey, setDrilldownKey] = useState('Main Clinic')

  const [consumptionClinic, setConsumptionClinic] = useState('All clinics')
  const [consumptionProduct, setConsumptionProduct] = useState('All')
  const [fromMonth, setFromMonth] = useState('2026-01')
  const [toMonth, setToMonth] = useState('2026-03')

  const [orderClinic, setOrderClinic] = useState('Main Clinic')
  const [orderItem, setOrderItem] = useState('Sterile Gloves')
  const [orderQty, setOrderQty] = useState(10)
  const [deliveryDate, setDeliveryDate] = useState('2026-04-25')
  const [comments, setComments] = useState('')
  const [orderLines, setOrderLines] = useState<{ itemName: string; quantity: number; unitCost: number }[]>([])
  const [orders, setOrders] = useState<ClinicOrder[]>(seedOrders)
  const [inventory] = useState<InventoryItem[]>(seedInventory)

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const clinicMatch = selectedClinic === 'All clinics' || item.clinicName === selectedClinic
      const categoryMatch = selectedCategory === 'All' || item.category === selectedCategory
      const status = getStockStatus(item)
      const statusMatch = selectedStatus === 'All' || status === selectedStatus
      const searchMatch = [item.itemName, item.sku, item.clinicName]
        .join(' ')
        .toLowerCase()
        .includes(inventorySearch.toLowerCase())
      return clinicMatch && categoryMatch && statusMatch && searchMatch
    })
  }, [inventory, selectedClinic, selectedCategory, selectedStatus, inventorySearch])

  const inventoryKpis = useMemo(() => {
    const totalSkus = new Set(filteredInventory.map((item) => item.sku)).size
    const lowStock = filteredInventory.filter((item) => getStockStatus(item) === 'Low stock').length
    const outOfStock = filteredInventory.filter((item) => getStockStatus(item) === 'Out of stock').length
    const inventoryValue = filteredInventory.reduce(
      (sum, item) => sum + item.currentQuantity * item.unitCost,
      0,
    )
    return { totalSkus, lowStock, outOfStock, inventoryValue }
  }, [filteredInventory])

  const stockByClinic = useMemo(() => {
    const byClinic: Record<string, number> = {}
    filteredInventory.forEach((item) => {
      byClinic[item.clinicName] = (byClinic[item.clinicName] || 0) + item.currentQuantity
    })
    return Object.entries(byClinic).map(([clinic, quantity]) => ({ clinic, quantity }))
  }, [filteredInventory])

  const filteredConsumption = useMemo(() => {
    return consumptionData.filter((row) => {
      const clinicMatch = consumptionClinic === 'All clinics' || row.clinic === consumptionClinic
      const itemMatch = consumptionProduct === 'All' || row.item === consumptionProduct
      const monthMatch = row.month >= fromMonth && row.month <= toMonth
      return clinicMatch && itemMatch && monthMatch
    })
  }, [consumptionClinic, consumptionProduct, fromMonth, toMonth])

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

  const consumptionAlerts = useMemo(() => {
    const alerts: string[] = []
    filteredConsumption.forEach((row) => {
      if (row.consumedStock > row.openingStock + row.receivedStock * 0.85) {
        alerts.push(`${row.clinic} ${row.item}: sudden spike in ${formatMonth(row.month)}`)
      }
      if (row.closingStock === 0 || row.closingStock < 10) {
        alerts.push(`${row.clinic} ${row.item}: frequent stockout risk`)
      }
      if (Math.abs(row.variance) > 6) {
        alerts.push(`${row.clinic} ${row.item}: abnormal variance (${row.variance})`)
      }
    })
    return [...new Set(alerts)].slice(0, 4)
  }, [filteredConsumption])

  const nextMonthForecast = useMemo(() => {
    const latestThree = [...filteredConsumption]
      .sort((a, b) => (a.month < b.month ? 1 : -1))
      .slice(0, 3)
    if (!latestThree.length) return 0
    const avg = latestThree.reduce((sum, row) => sum + row.consumedStock, 0) / latestThree.length
    return Math.round(avg * 1.05)
  }, [filteredConsumption])

  const recentConsumptionItems = useMemo(() => {
    return [...consumptionData]
      .sort((a, b) => (a.month < b.month ? 1 : -1))
      .slice(0, 5)
      .map((row) => row.item)
  }, [])

  const lowStockSuggestions = useMemo(() => {
    return inventory
      .filter((item) => ['Low stock', 'Critical', 'Out of stock'].includes(getStockStatus(item)))
      .map((item) => item.itemName)
  }, [inventory])

  const orderSuggestions = [...new Set([...lowStockSuggestions, ...recentConsumptionItems])].slice(0, 6)

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

  const addOrderLine = () => {
    const itemData = inventory.find((item) => item.itemName === orderItem)
    if (!itemData) return
    setOrderLines((rows) => [
      ...rows,
      { itemName: itemData.itemName, quantity: orderQty, unitCost: itemData.unitCost },
    ])
  }

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
          <div className="brand-mark">KH</div>
          <div>
            <h1>Kaaro Health</h1>
            <p>Clinic Operations</p>
          </div>
        </div>
        <nav>
          <button
            className={`nav-item ${activePage === 'inventory' ? 'active' : ''}`}
            onClick={() => setActivePage('inventory')}
          >
            Current Inventory
          </button>
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
          <div>
            <h2>
              {activePage === 'inventory' && 'Clinic Inventory Levels'}
              {activePage === 'consumption' && 'Month-wise Consumption Track'}
              {activePage === 'orders' && 'Clinic Order Placing'}
            </h2>
            <p>Operations dashboard for data-driven clinic supply decisions</p>
          </div>
        </header>

        {activePage === 'inventory' && (
          <>
            <section className="cards">
              <article className="card">
                <span>Total SKUs</span>
                <strong>{inventoryKpis.totalSkus}</strong>
              </article>
              <article className="card alert-soft">
                <span>Low-stock Items</span>
                <strong>{inventoryKpis.lowStock}</strong>
              </article>
              <article className="card alert">
                <span>Out-of-stock Items</span>
                <strong>{inventoryKpis.outOfStock}</strong>
              </article>
              <article className="card">
                <span>Inventory Value</span>
                <strong>INR {inventoryKpis.inventoryValue.toLocaleString()}</strong>
              </article>
            </section>

            <section className="dashboard-grid">
              <article className="panel">
                <div className="panel-head">
                  <h3>Search and Filters</h3>
                </div>
                <div className="filters inline">
                  <input
                    value={inventorySearch}
                    onChange={(event) => setInventorySearch(event.target.value)}
                    placeholder="Search item, SKU, clinic"
                  />
                  <select value={selectedClinic} onChange={(event) => setSelectedClinic(event.target.value)}>
                    {clinics.map((clinic) => (
                      <option key={clinic}>{clinic}</option>
                    ))}
                  </select>
                  <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                  <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
                    {statusFilters.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </article>
              <article className="panel">
                <div className="panel-head">
                  <h3>Stock by Clinic</h3>
                </div>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={stockByClinic}>
                      <CartesianGrid stroke="#e4eaf0" strokeDasharray="4 4" />
                      <XAxis dataKey="clinic" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="quantity" fill="#0ea5a0" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </section>

            <section className="panel table-panel">
              <div className="panel-head">
                <h3>Clinic-level Inventory Table</h3>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Item name</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Clinic name</th>
                      <th>Current qty</th>
                      <th>Reorder level</th>
                      <th>Unit</th>
                      <th>Last updated</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => {
                      const status = getStockStatus(item)
                      const badgeClass = status.toLowerCase().replace(/\s+/g, '-')
                      return (
                        <tr key={item.id}>
                          <td>
                            <button className="link-button" onClick={() => setDrilldownKey(item.itemName)}>
                              {item.itemName}
                            </button>
                          </td>
                          <td>{item.sku}</td>
                          <td>{item.category}</td>
                          <td>
                            <button className="link-button" onClick={() => setDrilldownKey(item.clinicName)}>
                              {item.clinicName}
                            </button>
                          </td>
                          <td>{item.currentQuantity}</td>
                          <td>{item.reorderLevel}</td>
                          <td>{item.unit}</td>
                          <td>{item.lastUpdated}</td>
                          <td>
                            <span className={`badge ${badgeClass}`}>{status}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h3>Drill-down: {drilldownKey}</h3>
              </div>
              <div className="drilldown-grid">
                <div>
                  <h4>Recent Usage</h4>
                  <ul>
                    {(usageByKey[drilldownKey] ?? [`Usage details for ${drilldownKey} available via API`]).map(
                      (line) => (
                        <li key={line}>{line}</li>
                      ),
                    )}
                  </ul>
                </div>
                <div>
                  <h4>Recent Orders</h4>
                  <ul>
                    {(ordersByKey[drilldownKey] ?? [`Order details for ${drilldownKey} available via API`]).map(
                      (line) => (
                        <li key={line}>{line}</li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            </section>
          </>
        )}

        {activePage === 'consumption' && (
          <>
            <section className="panel">
              <div className="panel-head">
                <h3>Consumption Filters</h3>
              </div>
              <div className="filters inline">
                <select value={consumptionClinic} onChange={(event) => setConsumptionClinic(event.target.value)}>
                  {clinics.map((clinic) => (
                    <option key={clinic}>{clinic}</option>
                  ))}
                </select>
                <select value={consumptionProduct} onChange={(event) => setConsumptionProduct(event.target.value)}>
                  <option>All</option>
                  {[...new Set(consumptionData.map((row) => row.item))].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <input type="month" value={fromMonth} onChange={(event) => setFromMonth(event.target.value)} />
                <input type="month" value={toMonth} onChange={(event) => setToMonth(event.target.value)} />
              </div>
            </section>

            <section className="dashboard-grid">
              <article className="panel">
                <div className="panel-head">
                  <h3>Monthly Consumption Trend</h3>
                </div>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid stroke="#e4eaf0" strokeDasharray="4 4" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="consumed" stroke="#0ea5a0" strokeWidth={2.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </article>
              <article className="panel">
                <div className="panel-head">
                  <h3>Clinic Comparison</h3>
                </div>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={clinicComparison}>
                      <CartesianGrid stroke="#e4eaf0" strokeDasharray="4 4" />
                      <XAxis dataKey="clinic" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="consumed" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </section>

            <section className="panel table-panel">
              <div className="panel-head">
                <h3>Monthly Summary Table</h3>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Clinic</th>
                      <th>Item</th>
                      <th>Opening</th>
                      <th>Received</th>
                      <th>Consumed</th>
                      <th>Closing</th>
                      <th>Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConsumption.map((row) => (
                      <tr key={`${row.month}-${row.clinic}-${row.item}`}>
                        <td>{formatMonth(row.month)}</td>
                        <td>{row.clinic}</td>
                        <td>{row.item}</td>
                        <td>{row.openingStock}</td>
                        <td>{row.receivedStock}</td>
                        <td>{row.consumedStock}</td>
                        <td>{row.closingStock}</td>
                        <td>{row.variance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="dashboard-grid">
              <article className="panel">
                <div className="panel-head">
                  <h3>Alerts</h3>
                </div>
                <ul className="alert-list">
                  {consumptionAlerts.length ? (
                    consumptionAlerts.map((alert) => <li key={alert}>{alert}</li>)
                  ) : (
                    <li>No anomalies in selected period.</li>
                  )}
                </ul>
              </article>
              <article className="panel">
                <div className="panel-head">
                  <h3>Forecast Widget</h3>
                </div>
                <div className="forecast-box">
                  <p>Estimated next month demand</p>
                  <strong>{nextMonthForecast} units</strong>
                  <small>Based on recent 3-month average consumption.</small>
                </div>
              </article>
            </section>
          </>
        )}

        {activePage === 'orders' && (
          <>
            <section className="dashboard-grid orders-layout">
              <article className="panel">
                <div className="panel-head">
                  <h3>Clinic Order Form</h3>
                </div>
                <div className="filters">
                  <select value={orderClinic} onChange={(event) => setOrderClinic(event.target.value)}>
                    {clinics.filter((c) => c !== 'All clinics').map((clinic) => (
                      <option key={clinic}>{clinic}</option>
                    ))}
                  </select>
                  <select value={orderItem} onChange={(event) => setOrderItem(event.target.value)}>
                    {[...new Set(inventory.map((item) => item.itemName))].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={orderQty}
                    onChange={(event) => setOrderQty(Number(event.target.value))}
                    placeholder="Quantity"
                  />
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(event) => setDeliveryDate(event.target.value)}
                  />
                  <textarea
                    value={comments}
                    onChange={(event) => setComments(event.target.value)}
                    placeholder="Comments"
                    rows={3}
                  />
                  <button className="primary-button" onClick={addOrderLine}>
                    Add Item
                  </button>
                </div>

                <div className="inline-actions">
                  <button className="secondary-button" onClick={() => saveOrder('Draft')}>
                    Save Draft
                  </button>
                  <button className="primary-button" onClick={() => saveOrder('Submitted')}>
                    Submit Order
                  </button>
                  <button
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

            <section className="panel table-panel">
              <div className="panel-head">
                <h3>Orders Table</h3>
              </div>
              <div className="table-wrap">
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
                    {orders.map((order) => (
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
                    ))}
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
