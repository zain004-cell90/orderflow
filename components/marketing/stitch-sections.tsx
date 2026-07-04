import { ArrowDown, ArrowRight, Check, CircleHelp, Database, LayoutDashboard, Link2, MessageCircle, Plus, Search, StickyNote, Table2 } from "lucide-react";

const smallShadow = "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]";
const largeShadow = "shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_10px_10px_-5px_rgba(0,0,0,0.02)]";

export function MessyToOrganizedSection() {
  const oldWay = [[MessageCircle, "DMs"], [StickyNote, "Notes"], [Table2, "Excel"], [CircleHelp, "Confusion"]] as const;
  const newWay = [[Link2, "One Link"], [LayoutDashboard, "Dashboard"], [Database, "Database"]] as const;

  return (
    <section id="how-it-works" className="mx-auto max-w-[1280px] scroll-mt-20 px-6 py-20 text-center">
      <h2 className="mb-2 text-[32px] font-bold leading-[1.2] tracking-[-0.01em] text-[#141b2b] md:text-[48px] md:leading-[1.1] md:tracking-[-0.02em]">From messy chats to organized orders.</h2>
      <p className="mb-20 text-[18px] leading-[1.6] text-[#464555]">One link replaces all of this.</p>
      <div className="flex flex-col items-center justify-center gap-20 md:flex-row">
        <div className="flex flex-col items-center gap-6 opacity-40">
          <div className="flex max-w-[200px] flex-wrap justify-center gap-3">
            {oldWay.map(([Icon, label]) => <div key={label} className="flex flex-col items-center gap-1 rounded-xl bg-slate-200 p-3"><Icon size={24}/><span className="text-[10px] font-bold">{label}</span></div>)}
          </div>
          <span className="text-[14px] font-bold leading-[1.4] tracking-[0.01em] text-[#ba1a1a]">THE MESSY WAY</span>
        </div>
        <ArrowRight className="hidden animate-pulse text-[#3525cd] md:block" size={48}/>
        <ArrowDown className="text-[#3525cd] md:hidden" size={48}/>
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-wrap justify-center gap-4">
            {newWay.map(([Icon, label]) => <div key={label} className={`flex flex-col items-center gap-2 rounded-3xl bg-[#3525cd]/10 p-5 text-[#3525cd] transition-transform duration-200 ease-out hover:scale-110 ${smallShadow}`}><Icon size={36} fill="currentColor"/><span className="text-[12px] font-bold uppercase tracking-wider">{label}</span></div>)}
          </div>
          <span className="text-[24px] font-bold leading-[1.3] tracking-[-0.01em] text-[#3525cd]">THE ORDERFLOW WAY</span>
        </div>
      </div>
    </section>
  );
}

export function OrderDashboardAndTrackingSection() {
  return (
    <section id="features" className="mx-auto max-w-[1280px] scroll-mt-20 space-y-6 px-6 py-20">
      <div className="mb-20 text-center">
        <h2 className="text-[32px] font-bold leading-[1.2] tracking-[-0.01em] text-[#141b2b] md:text-[48px] md:leading-[1.1] md:tracking-[-0.02em]">Every order. One dashboard.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-[18px] leading-[1.6] text-[#464555]">Know exactly what was ordered, who ordered it, and what needs to happen next.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className={`flex flex-col overflow-hidden rounded-3xl border border-[#c7c4d8]/30 bg-white lg:col-span-8 ${smallShadow}`}>
          <div className="flex items-center justify-between border-b border-[#c7c4d8]/10 bg-slate-50/50 p-6">
            <h3 className="text-[24px] font-semibold leading-[1.3] tracking-[-0.01em]">Live Order Feed</h3>
            <div className="flex gap-2"><span className="rounded-full bg-green-100 px-3 py-1 text-[12px] text-green-700">Active</span><span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] text-slate-500">Last 24h</span></div>
          </div>
          <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead className="text-[12px] uppercase text-[#777587]"><tr><th className="px-2 pb-3">Order</th><th className="px-2 pb-3">Status</th><th className="px-2 pb-3 text-right">Amt</th></tr></thead>
                <tbody className="divide-y divide-[#c7c4d8]/20">
                  <OrderRow order="#1204 - Amna K." status="PACKED" amount="3,500" tone="blue"/>
                  <OrderRow order="#1203 - Zainab M." status="SHIPPED" amount="7,200" tone="yellow"/>
                  <OrderRow order="#1202 - Hamza S." status="DELIVERED" amount="4,100" tone="green"/>
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex h-32 items-end justify-between gap-2">{[40,60,90,75,100].map((height,index)=><div key={index} className="w-full rounded-t-lg bg-[#3525cd]/10 transition-colors duration-200 ease-out hover:bg-[#3525cd]" style={{height:`${height}%`}}/>)}</div>
              <div className="flex justify-between text-[10px] font-bold uppercase text-[#777587]">{["Mon","Tue","Wed","Thu","Fri"].map(day=><span key={day}>{day}</span>)}</div>
              <div className="mt-2 rounded-xl bg-slate-50 p-3"><span className="block text-[12px] text-[#464555]">Total Revenue</span><span className="text-[18px] font-bold text-[#3525cd]">PKR 124,500</span></div>
            </div>
          </div>
        </div>
        <div className={`rounded-3xl border border-[#c7c4d8]/30 bg-white p-6 lg:col-span-4 ${smallShadow}`}>
          <h3 className="mb-6 text-[24px] font-semibold leading-[1.3] tracking-[-0.01em]">Customer Database</h3>
          <div className="flex flex-col gap-4">
            <CustomerRow initials="RK" name="Rabiya Khan" detail="4 Orders · Total 18k" repeat tone="purple"/>
            <CustomerRow initials="SI" name="Sana Ibrahim" detail="1 Order · Total 3.5k" tone="blue"/>
            <div className="mt-4 rounded-2xl border border-dashed border-[#c7c4d8] bg-slate-50 p-4"><button className="flex w-full items-center justify-center gap-2 text-[12px] font-bold text-[#3525cd]"><Plus size={14}/>Add Manual Customer</button></div>
          </div>
        </div>
        <TrackingPortalMockup/>
      </div>
    </section>
  );
}

function OrderRow({order,status,amount,tone}:{order:string;status:string;amount:string;tone:"blue"|"yellow"|"green"}) {
  const badge = tone === "blue" ? "bg-blue-50 text-blue-600" : tone === "yellow" ? "bg-yellow-50 text-yellow-600" : "bg-green-50 text-green-600";
  return <tr><td className="px-2 py-3 font-medium">{order}</td><td className="px-2 py-3"><span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${badge}`}>{status}</span></td><td className="px-2 py-3 text-right">{amount}</td></tr>;
}

function CustomerRow({initials,name,detail,repeat=false,tone}:{initials:string;name:string;detail:string;repeat?:boolean;tone:"purple"|"blue"}) {
  const avatar = tone === "purple" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600";
  return <div className="flex items-center gap-4 rounded-2xl border border-[#c7c4d8]/20 p-4 transition-colors duration-200 ease-out hover:border-[#3525cd]/40"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-bold ${avatar}`}>{initials}</div><div><div className="flex flex-wrap items-center gap-2"><span className="text-[14px] font-bold">{name}</span>{repeat&&<span className="rounded-full bg-[#3525cd]/10 px-2 py-0.5 text-[10px] font-bold text-[#3525cd]">REPEAT</span>}</div><span className="text-[12px] text-[#464555]">{detail}</span></div></div>;
}

function TrackingPortalMockup() {
  return <div id="tracking-demo" className={`flex flex-col items-center gap-12 rounded-[40px] bg-[#4f46e5] p-12 text-white lg:col-span-12 lg:flex-row ${largeShadow}`}><div className="flex-1 space-y-6"><h3 className="text-[32px] font-bold leading-[1.2] tracking-[-0.01em] md:text-[48px] md:leading-[1.1] md:tracking-[-0.02em]">Customers stop asking: &quot;Where is my order?&quot;</h3><p className="text-[18px] leading-[1.6] text-white/80">Let customers check their order status themselves instead of messaging you. They just enter their phone number on your tracking page.</p></div><div className="w-full space-y-6 rounded-3xl bg-white p-6 text-[#141b2b] lg:w-[400px]"><div className="space-y-2"><label className="text-[12px] font-bold uppercase tracking-widest text-[#777587]">Tracking Portal</label><div className="relative"><input className="h-12 w-full rounded-lg border border-[#c7c4d8]/30 bg-slate-50 px-4 pr-12 text-[14px] outline-none focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20" placeholder="Enter Phone Number"/><button className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-[#3525cd] text-white" aria-label="Search tracking"><Search size={14}/></button></div></div><div className="space-y-6 pt-4"><TimelineStep title="Confirmed" detail="Today, 10:30 AM" complete connector/><TimelineStep title="Packed & Dispatched" detail="Pending pickup by Courier" complete connector mutedConnector/><TimelineStep title="Delivered" muted/></div></div></div>;
}

function TimelineStep({title,detail,complete=false,connector=false,muted=false,mutedConnector=false}:{title:string;detail?:string;complete?:boolean;connector?:boolean;muted?:boolean;mutedConnector?:boolean}) {
  return <div className={`flex gap-4 ${muted?"opacity-30":""}`}><div className="flex flex-col items-center"><div className={`grid h-6 w-6 place-items-center rounded-full ${complete?"bg-[#3525cd] text-white":"bg-slate-200"}`}>{complete&&<Check size={14}/>}</div>{connector&&<div className={`h-10 w-0.5 ${mutedConnector?"bg-slate-200":"bg-[#3525cd]"}`}/>}</div><div className="flex flex-col"><span className="text-[14px] font-bold">{title}</span>{detail&&<span className="text-[10px] text-[#464555]">{detail}</span>}</div></div>;
}
