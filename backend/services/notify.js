// Render's free tier blocks outbound SMTP ports (25/465/587) entirely —
// that's why nodemailer kept hitting ETIMEDOUT no matter what we tried.
// Sending over Brevo's HTTPS API instead sidesteps that completely, since
// it's just a normal web request on port 443.
async function sendViaBrevo({ to, toName, subject, html }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: process.env.SHOP_NAME, email: process.env.SHOP_EMAIL },
      to: [{ email: to, name: toName || to }],
      subject,
      htmlContent: html
    })
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Brevo API error ${res.status}: ${errBody}`);
  }
}

// ── Email: Order received (pending verification) ─────────
async function sendOrderReceived(order) {
  const itemsHtml = order.items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:14px;">${i.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:14px;text-align:center;">${i.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:14px;text-align:right;">₦${(i.price * i.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  await sendViaBrevo({
    to: order.customer_email,
    toName: order.customer_name,
    subject: `We got your order! — ${order.payment_ref}`,
    html: `
      <div style="max-width:600px;margin:0 auto;background:#fff;font-family:Arial,sans-serif;">
        <div style="background:linear-gradient(135deg,#E91E78,#a3185e);padding:40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;font-style:italic;">Lucky Kidies Wears</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;letter-spacing:2px;">ORDER RECEIVED</p>
        </div>

        <div style="padding:40px;">
          <h2 style="font-size:22px;color:#1B1B1F;margin-bottom:8px;">Hi ${order.customer_name}! 👋</h2>
          <p style="color:#555;line-height:1.7;margin-bottom:24px;">
            We've received your order and your payment proof. Our team will verify your transfer and confirm your order within a few hours.
          </p>

          <div style="background:#fff8fc;border:1px solid #ffd9ea;border-radius:12px;padding:20px;margin-bottom:24px;">
            <p style="margin:0 0 6px;font-size:12px;color:#888;letter-spacing:1px;">ORDER REFERENCE</p>
            <p style="margin:0;font-size:20px;font-weight:700;color:#E91E78;">${order.payment_ref}</p>
          </div>

          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <thead>
              <tr>
                <th style="text-align:left;font-size:12px;color:#888;letter-spacing:1px;padding-bottom:10px;">ITEM</th>
                <th style="text-align:center;font-size:12px;color:#888;letter-spacing:1px;padding-bottom:10px;">QTY</th>
                <th style="text-align:right;font-size:12px;color:#888;letter-spacing:1px;padding-bottom:10px;">PRICE</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding-top:14px;font-weight:700;font-size:15px;">Total</td>
                <td style="padding-top:14px;font-weight:700;font-size:15px;text-align:right;color:#E91E78;">₦${order.total.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          <div style="background:#f9f9f9;border-radius:12px;padding:20px;margin-bottom:24px;">
            <p style="margin:0 0 10px;font-weight:700;font-size:14px;">Delivery Details</p>
            <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">
              ${order.customer_address}<br>
              ${order.customer_phone}
            </p>
          </div>

          <p style="color:#555;font-size:14px;line-height:1.7;">
            You can track your order anytime at
            <a href="https://luckykidies-htan.onrender.com/track-order.html" style="color:#E91E78;">luckykidies.com/track-order</a>
            using your order reference.
          </p>

          <p style="color:#555;font-size:14px;line-height:1.7;margin-top:16px;">
            Questions? Chat us on
            <a href="https://wa.me/2348094406347" style="color:#25D366;font-weight:700;">WhatsApp</a>
          </p>
        </div>

        <div style="background:#f9f9f9;padding:24px;text-align:center;border-top:1px solid #f0f0f0;">
          <p style="margin:0;font-size:12px;color:#aaa;">© 2026 Lucky Kidies Wears. All rights reserved.</p>
        </div>
      </div>
    `
  });
}

// ── Email: Order confirmed (payment verified) ────────────
async function sendOrderConfirmed(order) {
  await sendViaBrevo({
    to: order.customer_email,
    toName: order.customer_name,
    subject: `Your order is confirmed! 🎉 — ${order.payment_ref}`,
    html: `
      <div style="max-width:600px;margin:0 auto;background:#fff;font-family:Arial,sans-serif;">
        <div style="background:linear-gradient(135deg,#E91E78,#a3185e);padding:40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;font-style:italic;">Lucky Kidies Wears</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;letter-spacing:2px;">ORDER CONFIRMED ✓</p>
        </div>

        <div style="padding:40px;">
          <div style="text-align:center;margin-bottom:28px;">
            <div style="width:70px;height:70px;background:linear-gradient(135deg,#E91E78,#a3185e);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <span style="color:#fff;font-size:32px;">✓</span>
            </div>
            <h2 style="font-size:22px;color:#1B1B1F;margin:0 0 8px;">Payment Confirmed!</h2>
            <p style="color:#555;margin:0;font-size:15px;">We've verified your transfer and your order is now being packed.</p>
          </div>

          <div style="background:#fff8fc;border:1px solid #ffd9ea;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#888;letter-spacing:1px;">ORDER REFERENCE</p>
            <p style="margin:0;font-size:20px;font-weight:700;color:#E91E78;">${order.payment_ref}</p>
          </div>

          <div style="margin-bottom:24px;">
            <p style="font-weight:700;font-size:14px;margin-bottom:14px;">What happens next:</p>
            <div style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start;">
              <div style="width:24px;height:24px;background:#E91E78;border-radius:50%;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div>
              <p style="margin:0;font-size:14px;color:#555;line-height:1.6;">Your items are being carefully packed.</p>
            </div>
            <div style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start;">
              <div style="width:24px;height:24px;background:#E91E78;border-radius:50%;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div>
              <p style="margin:0;font-size:14px;color:#555;line-height:1.6;">We'll send you a WhatsApp message when your order is dispatched.</p>
            </div>
            <div style="display:flex;gap:12px;align-items:flex-start;">
              <div style="width:24px;height:24px;background:#E91E78;border-radius:50%;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div>
              <p style="margin:0;font-size:14px;color:#555;line-height:1.6;">Delivery within 1-3 business days in Lagos, 3-7 days outside Lagos.</p>
            </div>
          </div>

          <div style="text-align:center;margin-top:28px;">
            <a href="https://luckykidies-htan.onrender.com/track-order.html" style="display:inline-block;background:linear-gradient(135deg,#E91E78,#a3185e);color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:700;font-size:14px;">Track My Order</a>
          </div>

          <p style="color:#555;font-size:14px;line-height:1.7;margin-top:24px;text-align:center;">
            Questions? Chat us on
            <a href="https://wa.me/2348094406347" style="color:#25D366;font-weight:700;">WhatsApp</a>
          </p>
        </div>

        <div style="background:#f9f9f9;padding:24px;text-align:center;border-top:1px solid #f0f0f0;">
          <p style="margin:0;font-size:12px;color:#aaa;">© 2026 Lucky Kidies Wears. All rights reserved.</p>
        </div>
      </div>
    `
  });
}

// ── Email: New order alert to shop owner ─────────────────
async function sendOwnerAlert(order) {
  await sendViaBrevo({
    to: process.env.SHOP_EMAIL,
    toName: process.env.SHOP_NAME,
    subject: `🛍️ New Order — ${order.payment_ref} (₦${order.total.toLocaleString()})`,
    html: `
      <div style="max-width:600px;margin:0 auto;background:#fff;font-family:Arial,sans-serif;padding:32px;">
        <h2 style="color:#E91E78;margin-bottom:4px;">New Order Received!</h2>
        <p style="color:#888;font-size:13px;margin-bottom:24px;">${new Date().toLocaleString('en-NG')}</p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
          <tr><td style="padding:8px 0;color:#888;width:140px;">Reference</td><td style="padding:8px 0;font-weight:700;color:#E91E78;">${order.payment_ref}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Customer</td><td style="padding:8px 0;">${order.customer_name}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Phone</td><td style="padding:8px 0;">${order.customer_phone}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Email</td><td style="padding:8px 0;">${order.customer_email}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Address</td><td style="padding:8px 0;">${order.customer_address}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Total</td><td style="padding:8px 0;font-weight:700;font-size:16px;">₦${order.total.toLocaleString()}</td></tr>
        </table>

        ${order.screenshot_url ? `
          <p style="font-weight:700;margin-bottom:10px;">Payment Screenshot:</p>
          <img src="${order.screenshot_url}" style="width:100%;max-width:400px;border-radius:8px;border:1px solid #f0f0f0;" alt="Payment proof">
        ` : ''}

        <div style="margin-top:24px;">
          <a href="https://luckykidies-htan.onrender.com/admin.html" style="display:inline-block;background:#E91E78;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:700;font-size:14px;">View in Admin Panel</a>
        </div>
      </div>
    `
  });
}

module.exports = { sendOrderReceived, sendOrderConfirmed, sendOwnerAlert };