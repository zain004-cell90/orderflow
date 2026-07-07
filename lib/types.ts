export type OrderStatus="Order Received"|"Pending"|"Confirmed"|"Packed"|"Shipped"|"Delivered"|"Cancelled";
export type PaymentMethod="Cash on Delivery"|"COD"|"Bank Transfer"|"JazzCash"|"Easypaisa";
export interface OrderTimelineItem{status:OrderStatus|"Received";label:string;timestamp:string}
export interface Order{id:string;orderNumber?:string;storeId?:string;customer:string;customerName?:string;initials:string;phone:string;email?:string;product:string;productId?:EntityId;productName?:string;productImage?:string;date:string;createdAt?:string;amount:number;totalAmount?:number;status:OrderStatus;address?:string;quantity?:number;variant?:string;size?:string;color?:string;city?:string;paymentMethod?:PaymentMethod;notes?:string;productCustomFields?:Record<string,string|number|boolean>;checkoutCustomFields?:Record<string,string|number|boolean>;timeline?:OrderTimelineItem[]}

export interface ProductVariant{label:string;values:string[]}
export type ProductStatus="Active"|"Draft"|"Archived";
export type ProductCategory="Fashion"|"Beauty"|"Accessories"|"Electronics"|"Home"|"Food"|"Digital Product"|"Other";
export type ProductCustomFieldType="Text"|"Number"|"Dropdown"|"Checkbox"|"Textarea"|"Date";
export interface ProductCustomField{id:string;name:string;type:ProductCustomFieldType;options:string[];required?:boolean;enabled?:boolean}
export type EntityId=string|number;
export interface Product{id:EntityId;name:string;category:string;price:number;image:string;status:ProductStatus;ordersCount:number;stock:number;description:string;variants:ProductVariant[];colors:string[];sizes:string[];customFields:ProductCustomField[];createdAt:string;updatedAt:string}

export type CheckoutFieldType="Text"|"Number"|"Dropdown"|"Checkbox"|"Textarea"|"Date";
export interface CheckoutField{id:string;label:string;type:CheckoutFieldType;required:boolean;enabled:boolean;options:string[]}
export interface CheckoutConfig{storeId:string;storeName:string;logo:string;brandColor:string;buttonColor:string;selectedProductId:EntityId;optionalFields:{email:boolean;referral:boolean;giftNote:boolean};customFields:CheckoutField[];codEnabled:boolean;requirePhone:boolean;requireAddress:boolean;requireCity:boolean;allowMultipleProducts:boolean;trackingEnabled:boolean;thankYouMessage:string;defaultOrderStatus:OrderStatus;updatedAt:string}
export type CheckoutSettings=CheckoutConfig;
export type CustomCheckoutField=CheckoutField;

export interface CustomerOrderHistory{id:string;date:string;products:string;amount:number;status:OrderStatus}
export interface Customer{id:EntityId;name:string;initials:string;email:string;phone:string;country:string;city:string;address:string;ordersCount:number;totalSpent:number;avgTicket:number;isRepeatCustomer:boolean;createdAt:string;notes:string;orderHistory:CustomerOrderHistory[];customFields?:Record<string,string|number|boolean>}

export type NotificationType="New Order"|"Order Status Updated"|"Product Low Stock"|"Product Added"|"Product Deleted"|"Customer Added"|"Customer Updated"|"Settings Updated"|"Checkout Page Updated"|"Checkout Link Copied"|"Export Completed";
export interface Notification{id:string;title:string;message:string;type:NotificationType;createdAt:string;isRead:boolean;actionUrl?:string}

export type CurrencyCode="PKR"|"INR"|"IDR"|"BRL"|"USD"|"GBP"|"AED"|"SAR";
export type CountryCode="PK"|"IN"|"ID"|"BR"|"US"|"GB"|"AE"|"SA";
export interface StoreSettings{storeName:string;businessPhone:string;businessEmail:string;country:CountryCode;currency:CurrencyCode;timezone:string;phoneFormat:string;dateFormat:string;logo:string}
export interface AccountSettings{fullName:string;email:string;avatar:string}
export type BillingPlan="Free"|"Starter"|"Growth";
export interface BillingSettings{plan:BillingPlan;storageUsedMb:number;lastInvoiceDate:string}
export interface AutomationSettings{autoCreateCustomer:boolean;autoMarkRepeat:boolean;lowStockAlert:boolean;trackingPageEnabled:boolean}

export type UserPlan=BillingPlan;
export type UserRole="user"|"admin";
export type AccountStatus="Active"|"Suspended"|"Blocked"|"Deleted";
export interface MockAuthSession{email:string;createdAt:string;remember:boolean}
export interface MockUser{id:string;name:string;email:string;role:UserRole;plan:UserPlan;status:AccountStatus;country:string;storeId:string;createdAt:string;lastActiveAt:string;ordersUsed:number;productsUsed:number;customersUsed:number}
export interface MockStore{id:string;name:string;ownerId:string;ownerEmail:string;plan:UserPlan;status:AccountStatus;country:string;orders:number;products:number;customers:number;createdAt:string}
export type ContactSubmissionStatus="New"|"Read"|"Replied"|"Archived";
export interface ContactSubmission{id:string;fullName:string;email:string;subject:string;message:string;status:ContactSubmissionStatus;source:string;userAgent?:string;createdAt:string;updatedAt:string}

export interface Activity{title:string;detail:string;time:string;tone:"primary"|"success"|"warning"|"muted"}
export interface AnalyticsMetric{label:string;value:string;change:string;icon:string}
