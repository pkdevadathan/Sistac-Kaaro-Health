import { useMemo, useState } from 'react'
import {
  CartesianGrid,
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
  category: 'Medication' | 'Consumable' | 'Equipment'
  location: string
  stock: number
  minStock: number
  unitCost: number
  lastUpdated: string
}

const seedInventory: InventoryItem[] = [
  { id: '1', itemName: 'Sterile Gloves', category: 'Consumable', location: 'Main Clinic', stock: 180, minStock: 100, unitCost: 18, lastUpdated: '2026-04-21' },
  { id: '2', itemName: 'Paracetamol 500mg', category: 'Medication', location: 'Pharmacy', stock: 72, minStock: 90, unitCost: 4, lastUpdated: '2026-04-20' },
  { id: '3', itemName: 'IV Cannula', category: 'Consumable', location: 'Emergency', stock: 44, minStock: 40, unitCost: 12, lastUpdated: '2026-04-18' },
  { id: '4', itemName: 'Pulse Oximeter', category: 'Equipment', location: 'Ward A', stock: 8, minStock: 6, unitCost: 1200, lastUpdated: '2026-04-19' },
  { id: '5', itemName: 'Amoxicillin', category: 'Medication', location: 'Pharmacy', stock: 38, minStock: 55, unitCost: 15, lastUpdated: '2026-04-20' },
  { id: '6', itemName: 'Syringe 5ml', category: 'Consumable', location: 'Main Clinic', stock: 260, minStock: 120, unitCost: 5, lastUpdated: '2026-04-21' },
]

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [inventory] = useState<InventoryItem[]>(seedInventory)

  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      const categoryMatch = category === 'All' || item.category === category
      const searchMatch =
        item.itemName.toLowerCase().includes(search.toLowerCase()) ||
        item.location.toLowerCase().includes(search.toLowerCase())
      return categoryMatch && searchMatch
    })
  }, [inventory, category, search])

  const lowStockCount = filteredItems.filter((item) => item.stock < item.minStock).length
  const totalValue = filteredItems.reduce((sum, item) => sum + item.stock * item.unitCost, 0)
  const totalUnits = filteredItems.reduce((sum, item) => sum + item.stock, 0)

  const stockTrend = [
    { day: 'Mon', units: 540 },
    { day: 'Tue', units: 520 },
    { day: 'Wed', units: 508 },
    { day: 'Thu', units: 515 },
    { day: 'Fri', units: 602 },
    { day: 'Sat', units: 595 },
    { day: 'Sun', units: 610 },
  ]

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
          <button className="nav-item active">Inventory</button>
          <button className="nav-item">Orders</button>
          <button className="nav-item">Suppliers</button>
          <button className="nav-item">Analytics</button>
        </nav>
      </aside>

      <main className="content">
        <header className="top-bar">
          <button className="menu-button" onClick={() => setSidebarOpen((state) => !state)}>
            Menu
          </button>
          <div>
            <h2>Clinic Inventory Dashboard</h2>
            <p>Live stock visibility across clinics and pharmacy</p>
          </div>
        </header>

        <section className="cards">
          <article className="card">
            <span>Total Stock Units</span>
            <strong>{totalUnits}</strong>
          </article>
          <article className="card">
            <span>Current Inventory Value</span>
            <strong>INR {totalValue.toLocaleString()}</strong>
          </article>
          <article className="card alert">
            <span>Low-Stock Alerts</span>
            <strong>{lowStockCount} items</strong>
          </article>
          <article className="card">
            <span>Active Categories</span>
            <strong>3</strong>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="panel">
            <div className="panel-head">
              <h3>Inventory Trend</h3>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={stockTrend}>
                  <CartesianGrid stroke="#e4eaf0" strokeDasharray="4 4" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="units" stroke="#0ea5a0" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="panel">
            <div className="panel-head">
              <h3>Filters</h3>
            </div>
            <div className="filters">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search item or location"
              />
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option>All</option>
                <option>Medication</option>
                <option>Consumable</option>
                <option>Equipment</option>
              </select>
            </div>
          </article>
        </section>

        <section className="panel table-panel">
          <div className="panel-head">
            <h3>Inventory Table</h3>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Stock</th>
                  <th>Min Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const low = item.stock < item.minStock
                  return (
                    <tr key={item.id}>
                      <td>{item.itemName}</td>
                      <td>{item.category}</td>
                      <td>{item.location}</td>
                      <td>{item.stock}</td>
                      <td>{item.minStock}</td>
                      <td>
                        <span className={`badge ${low ? 'low' : 'good'}`}>
                          {low ? 'Reorder' : 'Healthy'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
