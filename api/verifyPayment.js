export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plateNumber, lockToken, donor_name, donor_mobile, amount, plates, ...paymentParams } = req.body;

    const response = await fetch('https://gurusthanmeditation.org/verifyPayment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(paymentParams)
    });

    const data = await response.json();

    // If payment verification succeeded and plateNumber is provided, trigger permanent lock
    if ((data.status === 'success' || data.success || response.ok) && plateNumber) {
      try {
        const paymentId = req.body.razorpay_payment_id || data.payment_id || '';
        if (paymentId) {
          const lockHandler = (await import('./plateLock.js')).default;
          // Invoke lockHandler with verifyAndLock action
          const mockReq = {
            method: 'POST',
            body: {
              action: 'verifyAndLock',
              plateNumber,
              lockToken,
              paymentId,
              orderId: req.body.razorpay_order_id || req.body.our_order_id || '',
              donorName: donor_name || '',
              phoneNumber: donor_mobile || '',
              plates: plates || 1,
              amount: amount || 1
            }
          };
          const mockRes = {
            setHeader: () => {},
            status: (code) => ({
              json: (result) => {
                data.plateLock = result;
              }
            })
          };
          await lockHandler(mockReq, mockRes);
        }
      } catch (lockErr) {
        console.warn('Plate locking warning in verifyPayment:', lockErr);
      }
    }

    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Error in verifyPayment proxy:', err);
    return res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
}
