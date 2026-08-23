'use server';

export async function fetchLivePnl(positions: any[]) {
    return await Promise.all(positions.map(async (pos) => {
        try {
            const [callRes, putRes] = await Promise.all([
                fetch(`https://api.india.delta.exchange/v2/products/${pos.short_call_symbol}/ticker`, { next: { revalidate: 0 } }),
                fetch(`https://api.india.delta.exchange/v2/products/${pos.short_put_symbol}/ticker`, { next: { revalidate: 0 } })
            ]);
            
            const callData = await callRes.json();
            const putData = await putRes.json();
            
            const cMark = parseFloat(callData.result?.mark_price || 0);
            const pMark = parseFloat(putData.result?.mark_price || 0);
            
            if (cMark === 0 && pMark === 0) {
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
            return { ...pos, actualPnl: 0, peakPnl: parseFloat(pos.peak_unrealized_pnl || 0) };
        }
    }));
}

export async function fetchWalletBalance(apiKey: string, apiSecret: string) {
    const crypto = await import('crypto');
    const timestamp = Date.now().toString();
    const method = 'GET';
    const endpoint = '/v2/wallet/balances';
    const signaturePayload = method + timestamp + endpoint;
    const signature = crypto.createHmac('sha256', apiSecret).update(signaturePayload).digest('hex');
    
    try {
        const res = await fetch(`https://api.india.delta.exchange${endpoint}`, {
            method,
            headers: {
                'api-key': apiKey,
                'timestamp': timestamp,
                'signature': signature,
                'User-Agent': 'delta-client/1.0'
            },
            next: { revalidate: 0 }
        });
        const data = await res.json();
        if (data.success && data.result) {
            const usdAsset = data.result.find((a: any) => a.asset_symbol === 'USD' || a.asset_symbol === 'USDT');
            if (usdAsset) {
                return parseFloat(usdAsset.balance);
            }
        }
        return 0;
    } catch (e) {
        console.error("Failed to fetch balance", e);
        return 0;
    }
}
