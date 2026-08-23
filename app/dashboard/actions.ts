'use server';

export async function fetchLivePnl(positions: any[]) {
    return await Promise.all(positions.map(async (pos) => {
        try {
            const [callRes, putRes] = await Promise.all([
                fetch(`https://api.delta.exchange/v2/products/${pos.short_call_symbol}/ticker`, { next: { revalidate: 0 } }),
                fetch(`https://api.delta.exchange/v2/products/${pos.short_put_symbol}/ticker`, { next: { revalidate: 0 } })
            ]);
            
            const callData = await callRes.json();
            const putData = await putRes.json();
            
            const cMark = parseFloat(callData.result?.mark_price || 0);
            const pMark = parseFloat(putData.result?.mark_price || 0);
            
            if (cMark === 0 && pMark === 0) {
                // Ticker not found or expired
                return { ...pos, actualPnl: 0, peakPnl: parseFloat(pos.peak_unrealized_pnl || 0) };
            }
            
            const currentCost = (cMark + pMark) * pos.lots * 0.001;
            const adjCost = parseFloat(pos.adjustment_cost || 0);
            const actualPnl = parseFloat(pos.credit_received || 0) - currentCost - adjCost;

            return {
                ...pos,
                actualPnl,
                peakPnl: parseFloat(pos.peak_unrealized_pnl || 0)
            };
        } catch (error) {
            console.error("Error fetching ticker", error);
            return { ...pos, actualPnl: 0, peakPnl: parseFloat(pos.peak_unrealized_pnl || 0) };
        }
    }));
}
