/** One line from the stakeholder monthly orders workbook (normalized). */
export type StakeholderOrderRow = {
  orderId: string
  month: string
  clinicName: string
  region: string
  orderedBy: string
  position: string
  item: string
  unit: string
  quantity: number
}
