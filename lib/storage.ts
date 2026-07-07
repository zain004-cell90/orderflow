import type { CheckoutConfig, ContactSubmission, Customer, Notification, Order, Product, StoreSettings } from "./types";

export const storageKeys={checkout:"orderflow.checkout",orders:"orderflow.orders",products:"orderflow.products",customers:"orderflow.customers",settings:"orderflow.settings",notifications:"orderflow.notifications",account:"orderflow.account",billing:"orderflow.billing",automation:"orderflow.automation",onboarding:"orderflow.onboarding",authSession:"orderflow.auth.session",users:"orderflow.admin.users",stores:"orderflow.admin.stores",contactSubmissions:"orderflow.contact.submissions"} as const;

export function readStorage<T>(key:string,fallback:T):T{
  if(typeof window==="undefined")return fallback;
  try{const raw=window.localStorage.getItem(key);return raw?JSON.parse(raw) as T:fallback}catch{return fallback}
}
export function writeStorage<T>(key:string,value:T){if(typeof window==="undefined")return;window.localStorage.setItem(key,JSON.stringify(value));window.dispatchEvent(new CustomEvent("orderflow-storage",{detail:{key}}))}
export function removeStorage(key:string){if(typeof window==="undefined")return;window.localStorage.removeItem(key);window.dispatchEvent(new CustomEvent("orderflow-storage",{detail:{key}}))}

export function readCheckoutConfig(fallback:CheckoutConfig){const saved=readStorage<Partial<CheckoutConfig>>(storageKeys.checkout,{});return{...fallback,...saved,optionalFields:{...fallback.optionalFields,...saved.optionalFields},customFields:saved.customFields||fallback.customFields}}
export function readOrders(fallback:Order[]=[]){return stripLegacyDemoOrders(readStorage(storageKeys.orders,fallback))}
export function readProducts(fallback:Product[]=[]){return stripLegacyDemoProducts(readStorage(storageKeys.products,fallback))}
export function readCustomers(fallback:Customer[]=[]){return stripLegacyDemoCustomers(readStorage(storageKeys.customers,fallback))}
export function readSettings(fallback:StoreSettings){return readStorage(storageKeys.settings,fallback)}
export function readNotifications(fallback:Notification[]=[]){return stripLegacyDemoNotifications(readStorage(storageKeys.notifications,fallback))}
export function readContactSubmissions(fallback:ContactSubmission[]=[]){return readStorage(storageKeys.contactSubmissions,fallback)}

const legacyDemoOrderIds = new Set([
  "ORD-1042","ORD-1043","ORD-1044","ORD-1045","ORD-1046","ORD-1047",
  "ORD-1048","ORD-1049","ORD-1050","ORD-1051","ORD-1052","ORD-1053",
]);
const legacyDemoProductNames = new Set([
  "Premium Hoodie","Linen Co-ord Set","Leather Wallet","Summer Kurti",
  "Classic Sneakers","Silk Scarf","Minimal Desk Lamp","Pearl Earrings",
  "Smart Watch","Canvas Backpack","Ceramic Vase","Premium Abaya",
]);
const legacyDemoCustomerNames = new Set([
  "Ali Hassan","Sara Khan","Hamza Malik","Ayesha Noor","Priya Sharma",
  "Arjun Mehta","Siti Rahma","Budi Santoso","Ana Oliveira","Lucas Silva",
  "Emily Carter","Noah Williams","Olivia Brown","James Wilson","Maya Putri",
]);

function stripLegacyDemoOrders(orders:Order[]){
  return orders.filter(order=>!legacyDemoOrderIds.has(String(order.orderNumber||order.id)));
}
function stripLegacyDemoProducts(products:Product[]){
  return products.filter(product=>!legacyDemoProductNames.has(product.name));
}
function stripLegacyDemoCustomers(customers:Customer[]){
  return customers.filter(customer=>!legacyDemoCustomerNames.has(customer.name));
}
function stripLegacyDemoNotifications(notifications:Notification[]){
  return notifications.filter(notification=>!["n1","n2","n3","n4"].includes(notification.id));
}
