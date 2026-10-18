export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, donor_name, donor_mobile, donor_email } = req.body;

    const params = new URLSearchParams({
      amount: String(amount),
      category: 'guruprasadam',
      type: 'donation',
      currency: 'INR',
      donor_name: donor_name || 'Devotee',
      donor_email: donor_email || 'annaprasadam@gurusthanmeditation.org',
      donor_mobile: donor_mobile || '9133014014',
      donor_whatsapp: donor_mobile || '9133014014',
      donation_type: 'once'
    });

    const response = await fetch('https://gurusthanmeditation.org/initiatePayment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Error in initiatePayment proxy:', err);
    return res.status(500).json({ error: err.message || 'Payment initiation failed' });
  }
}
