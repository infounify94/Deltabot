export function fillDetails(position: any, events: any[]) {
  const result: Record<string, { entry: number | null; exit: number | null }> = {};
  const symbols = ['short_call_symbol','short_put_symbol','long_call_symbol','long_put_symbol'].map(k=>position[k]).filter(Boolean);
  for (const symbol of symbols) result[symbol] = { entry: null, exit: null };
  for (const event of [...events].sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at)))) {
    const d=event.detail || {};
    if (event.event_type==='entry') {
      const fill=d.fill || d;
      for(const side of ['call','put']) {
        const symbol=position[`short_${side}_symbol`];
        const raw=fill[`${side}_fill_price`] ?? fill[`${side}_order`]?.average_fill_price;
        if(symbol && raw != null && Number.isFinite(Number(raw))) result[symbol].entry=Number(raw);
      }
    }
    if(event.event_type==='adjust') {
      const legs=d.legs || {};
      if(!Array.isArray(legs)) for(const [symbol,r] of Object.entries(legs) as [string,any][]) {
        if(result[symbol] && r.filled_lots>0 && r.price_quantity!=null) result[symbol].entry=r.price_quantity/r.filled_lots;
      }
    }
    const legs=d.execution?.legs;
    if(legs) for(const [symbol,r] of Object.entries(legs) as [string,any][]) {
      if(result[symbol] && r.filled_lots>0 && r.price_quantity!=null) result[symbol].exit=r.price_quantity/r.filled_lots;
    }
  }
  return result;
}

export function buildPayoff(position: any) {
  const cv=Number(position.contract_value), n=Number(position.lots);
  if(position.credit_received==null || position.adjustment_cost==null || !Number.isFinite(cv) || cv<=0 || !Number.isInteger(n) || n<=0) return null;
  const cash=Number(position.credit_received)-Number(position.adjustment_cost);
  if(!Number.isFinite(cash)) return null;
  const legs: {strike:number;type:string;quantity:number;sign:number;symbol:string}[]=[];
  for(const side of ['call','put']) for(const prefix of ['short','long']) {
    const symbol=position[`${prefix}_${side}_symbol`];
    if(!symbol) {if(prefix==='short') return null;continue;}
    const parts=symbol.split('-'), strike=Number(parts[2]);
    const quantity=prefix==='short'?n:Number(position[`long_${side}_lots`]);
    if(parts.length!==4 || !['C','P'].includes(parts[0]) || !Number.isFinite(strike) || strike<=0 || !Number.isInteger(quantity) || quantity<=0) return null;
    legs.push({strike,type:parts[0],quantity,sign:prefix==='short'?-1:1,symbol});
  }
  if(new Set(legs.map(l=>l.symbol.split('-')[3])).size!==1) return null;
  const at=(spot:number)=>cash+legs.reduce((sum,l)=>sum+l.sign*l.quantity*cv*Math.max(0,l.type==='C'?spot-l.strike:l.strike-spot),0);
  const knots=[0,...Array.from(new Set(legs.map(l=>l.strike))).sort((a,b)=>a-b)];
  const slope=legs.filter(l=>l.type==='C').reduce((v,l)=>v+l.sign*l.quantity*cv,0);
  const values=knots.map(at), top=knots[knots.length-1];
  const roots:number[]=[];
  for(let i=0;i<knots.length-1;i++) {
    const a=knots[i], b=knots[i+1], x=at(a), y=at(b);
    if(Math.abs(x)<1e-9) roots.push(a);
    if(x*y<0) roots.push(a+(b-a)*(-x)/(y-x));
  }
  if(Math.abs(at(top))<1e-9) roots.push(top);
  if(Math.abs(slope)>1e-12) {const root=top-at(top)/slope;if(root>top) roots.push(root);}
  const low=knots[1], pad=Math.max(top*.04,(top-low)*.75);
  const start=Math.max(0,low-pad), end=top+pad;
  return {cash,legs,at,maxProfit:slope>1e-12?Infinity:Math.max(...values),maxLoss:slope< -1e-12?Infinity:Math.max(0,-Math.min(...values)),
    breakevens:Array.from(new Set(roots)),points:Array.from({length:101},(_,i)=>{const spot=start+(end-start)*i/100;return {spot,pnl:at(spot)};})};
}
