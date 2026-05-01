import type { ClinicOrder, ConsumptionRecord, OrderStatus } from '../types/dashboard'
import type { StakeholderOrderRow } from '../types/stakeholder'

/** Roll up line-level orders to month × clinic × item for charts and tables. */
export function aggregateStakeholderToConsumption(rows: StakeholderOrderRow[]): ConsumptionRecord[] {
  const map = new Map<string, { qty: number; unit: string; month: string; clinic: string; item: string }>()
  for (const r of rows) {
    const key = JSON.stringify([r.month, r.clinicName, r.item])
    const prev = map.get(key)
    if (prev) {
      prev.qty += r.quantity
    } else {
      map.set(key, {
        qty: r.quantity,
        unit: r.unit,
        month: r.month,
        clinic: r.clinicName,
        item: r.item,
      })
    }
  }

  const out: ConsumptionRecord[] = []
  for (const [, v] of map.entries()) {
    out.push({
      month: v.month,
      clinic: v.clinic,
      item: v.item,
      openingStock: 0,
      receivedStock: 0,
      consumedStock: v.qty,
      closingStock: 0,
      variance: 0,
      unit: v.unit,
    })
  }

  return out.sort((a, b) => (a.month !== b.month ? a.month.localeCompare(b.month) : a.clinic.localeCompare(b.clinic)))
}

/** One dashboard order per Order_ID with line items. */
export function stakeholderRowsToClinicOrders(rows: StakeholderOrderRow[]): ClinicOrder[] {
  const byOrder = new Map<string, StakeholderOrderRow[]>()
  for (const r of rows) {
    const list = byOrder.get(r.orderId)
    if (list) list.push(r)
    else byOrder.set(r.orderId, [r])
  }

  const orders: ClinicOrder[] = []
  for (const [id, lines] of byOrder.entries()) {
    const sorted = [...lines].sort((a, b) => a.item.localeCompare(b.item))
    const head = sorted[0]
    /** Historical imports: treat as already received at clinic (adjust via table if needed). */
    const status: OrderStatus = 'Delivered'
    orders.push({
      id,
      clinicName: head.clinicName,
      items: sorted.map((line) => ({
        itemName: line.item,
        quantity: line.quantity,
        unitCost: 0,
      })),
      preferredDeliveryDate: `${head.month}-15`,
      comments: `Region: ${head.region} · Ordered by ${head.orderedBy} (${head.position})`,
      status,
      createdAt: `${head.month}-01`,
    })
  }

  return orders.sort((a, b) => {
    const da = a.createdAt.localeCompare(b.createdAt)
    if (da !== 0) return -da
    return b.id.localeCompare(a.id)
  })
}
