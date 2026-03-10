import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
})

export async function sendPriceAlert(to: string, symbol: string, condition: string, targetPrice: number, currentPrice: number): Promise<void> {
  if (!process.env.SMTP_USER) {
    console.log(`[Email] Alert: ${symbol} ${condition} $${targetPrice} (current: $${currentPrice})`)
    return
  }

  await transporter.sendMail({
    from: `StockFlow <${process.env.SMTP_USER}>`,
    to,
    subject: `Price Alert: ${symbol} ${condition} $${targetPrice}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #2563eb;">StockFlow Price Alert</h2>
        <p>Your alert for <strong>${symbol}</strong> has been triggered!</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Condition:</strong> Price ${condition} $${targetPrice}</p>
          <p><strong>Current Price:</strong> $${currentPrice.toFixed(2)}</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/stock/${symbol}" style="background: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          View ${symbol}
        </a>
      </div>
    `,
  })
}
