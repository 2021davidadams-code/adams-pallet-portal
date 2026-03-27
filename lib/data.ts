export const summaryStats = [
  { label: "Total Assets", value: "18,740", subtext: "Across active customers" },
  { label: "At Customer Sites", value: "11,960", subtext: "Currently in custody" },
  { label: "In Transit", value: "3,425", subtext: "Transfer and recovery flow" },
  { label: "Open Exceptions", value: "218", subtext: "Loss, damage, mismatch" }
];

export const transfers = [
  { id: "TR-2041", date: "2026-03-25", from: "FreshCo Distribution", to: "Approved Vendor A", assetType: "Wood Pallet", qty: 240, status: "Reported" },
  { id: "TR-2042", date: "2026-03-24", from: "Produce Hub", to: "Retailer West", assetType: "Plastic Pallet", qty: 180, status: "Pending Review" }
];

export const pickups = [
  { id: "PK-3201", company: "FreshCo Distribution", service: "Scheduled Pickup", location: "Kingsville Yard", qty: 220, date: "2026-03-28", status: "Confirmed" },
  { id: "PK-3202", company: "Retailer West", service: "Recovery Service", location: "Windsor Crossdock", qty: 150, date: "2026-03-29", status: "Pending" }
];

export const incidents = [
  { id: "INC-778", company: "Retailer West", type: "Missing", location: "Windsor Crossdock", qty: 24, liability: "$456.00", status: "Open" },
  { id: "INC-779", company: "FreshCo Distribution", type: "Damaged", location: "Kingsville Yard", qty: 12, liability: "$192.00", status: "Investigating" }
];

export const invoices = [
  { id: "INV-901", company: "Retailer West", reason: "Missing pallets", amount: "$456.00", status: "Draft" },
  { id: "INV-902", company: "Produce Hub", reason: "Unreported transfer", amount: "$760.00", status: "Pending" }
];
