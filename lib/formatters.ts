import type { CurrencyCode } from "./types";

const currencyLocales:Record<CurrencyCode,string>={PKR:"en-PK",INR:"en-IN",IDR:"id-ID",BRL:"pt-BR",USD:"en-US",GBP:"en-GB",AED:"en-AE",SAR:"en-SA"};
export function formatCurrency(amount:number,currency:CurrencyCode){
  if(currency==="PKR"||currency==="AED"||currency==="SAR")return `${currency} ${new Intl.NumberFormat(currencyLocales[currency],{maximumFractionDigits:0}).format(amount)}`;
  return new Intl.NumberFormat(currencyLocales[currency],{style:"currency",currency,maximumFractionDigits:0}).format(amount);
}
