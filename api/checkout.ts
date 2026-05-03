import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { variantId, userId, userEmail, userName, planId } = req.body;
  if (!variantId || !userId) return res.status(400).json({ error: 'Missing variantId or userId' });

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;

  if (!apiKey) {
    // Fallback to client-side checkout URL if API key is missing
    const storeSlug = process.env.VITE_LEMONSQUEEZY_STORE || 'your-store';
    const url = `https://${storeSlug}.lemonsqueezy.com/checkout/buy/${variantId}?checkout[email]=${userEmail || ''}&checkout[custom][user_id]=${userId}&checkout[custom][plan_id]=${planId || ''}`;
    return res.status(200).json({ checkoutUrl: url });
  }

  try {
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: userEmail,
              name: userName,
              custom: { user_id: userId, plan_id: planId },
            },
            product_options: {
              redirect_url: `https://community-as-a-service.vercel.app/pricing?success=1`,
            },
          },
          relationships: {
            store: { data: { type: 'stores', id: storeId } },
            variant: { data: { type: 'variants', id: variantId } },
          },
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.errors?.[0]?.detail || 'Lemon Squeezy error');
    }

    const data = await response.json();
    return res.status(200).json({ checkoutUrl: data.data.attributes.url });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: err.message || 'Checkout failed' });
  }
}
