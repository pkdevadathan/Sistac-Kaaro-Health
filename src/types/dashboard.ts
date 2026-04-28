export type InventoryItem = {
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

/** Month-wise movement; when sourced from stakeholder Excel, only order qty is populated (see unit). */
export type ConsumptionRecord = {
  month: string
  clinic: string
  item: string
  openingStock: number
  receivedStock: number
  consumedStock: number
  closingStock: number
  variance: number
  /** Present for stakeholder monthly orders export */
  unit?: string
}

export type OrderStatus = 'Draft' | 'Submitted' | 'Approved' | 'Fulfilled' | 'Cancelled'

export type ClinicOrder = {
  id: string
  clinicName: string
  items: { itemName: string; quantity: number; unitCost: number }[]
  preferredDeliveryDate: string
  comments: string
  status: OrderStatus
  createdAt: string
}
