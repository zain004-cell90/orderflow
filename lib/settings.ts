import type { AccountSettings, AutomationSettings, BillingSettings, CountryCode, CurrencyCode } from "./types";

export const countryOptions:{code:CountryCode;label:string;currency:CurrencyCode;timezone:string;phone:string}[]=[
  {code:"PK",label:"Pakistan",currency:"PKR",timezone:"Asia/Karachi",phone:"+92 300 1234567"},{code:"IN",label:"India",currency:"INR",timezone:"Asia/Kolkata",phone:"+91 98765 43210"},{code:"ID",label:"Indonesia",currency:"IDR",timezone:"Asia/Jakarta",phone:"+62 812 3456 7890"},{code:"BR",label:"Brazil",currency:"BRL",timezone:"America/Sao_Paulo",phone:"+55 11 91234 5678"},{code:"US",label:"United States",currency:"USD",timezone:"America/New_York",phone:"+1 (555) 123-4567"},{code:"GB",label:"United Kingdom",currency:"GBP",timezone:"Europe/London",phone:"+44 7700 900123"},{code:"AE",label:"United Arab Emirates",currency:"AED",timezone:"Asia/Dubai",phone:"+971 50 123 4567"},{code:"SA",label:"Saudi Arabia",currency:"SAR",timezone:"Asia/Riyadh",phone:"+966 50 123 4567"},
];
export const currencyOptions:CurrencyCode[]=["PKR","INR","IDR","BRL","USD","GBP","AED","SAR"];
export const defaultAccountSettings:AccountSettings={fullName:"Alex Rivera",email:"alex@orderflow.pk",avatar:""};
export const defaultBillingSettings:BillingSettings={plan:"Free",storageUsedMb:18,lastInvoiceDate:"June 1, 2026"};
export const defaultAutomationSettings:AutomationSettings={autoCreateCustomer:true,autoMarkRepeat:true,lowStockAlert:true,dailyOrderSummary:false,trackingPageEnabled:true};
