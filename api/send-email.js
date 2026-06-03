import { Resend } from 'resend'

export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, qrDataUrl, qrLabel } = req.body

  if (!email || !qrDataUrl) {
    return res.status(400).json({ error: 'Missing email or qrDataUrl' })
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)

    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '')
    const qrBuffer = Buffer.from(base64Data, 'base64')

    const labelText = qrLabel || 'Your QR Code'
    const labelDisplay = labelText.length > 60 ? labelText.slice(0, 60) + '…' : labelText

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your QR Code from WisiQR</title>
</head>
<body style="margin:0;padding:0;background:#F8F8F8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F8F8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E8E8E8;border-radius:6px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:20px 28px;border-bottom:1px solid #E8E8E8;display:flex;justify-content:space-between;align-items:center;">
              <table width="100%"><tr>
                <td>
                  <span style="font-size:18px;font-weight:800;color:#E8352A;text-transform:uppercase;letter-spacing:0.01em;">WiSi</span><span style="font-size:18px;font-weight:800;color:#111111;text-transform:uppercase;letter-spacing:0.01em;">QRcode</span>
                </td>
                <td align="right">
                  <span style="font-size:11px;color:#AAAAAA;text-transform:uppercase;letter-spacing:0.08em;">QR Generator</span>
                </td>
              </tr></table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 28px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.01em;">Your QR Code is ready.</h1>
              <p style="margin:0 0 28px;font-size:14px;color:#666666;line-height:1.6;">
                Here is the QR Code you generated on WisiQR. Scan it with any camera app.
              </p>

              <!-- QR Image -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="background:#F8F8F8;border:1px solid #E8E8E8;border-radius:6px;padding:24px;display:inline-block;">
                      <img src="cid:qrcode" width="200" height="200" alt="QR Code" style="display:block;" />
                    </div>
                    <p style="margin:12px 0 0;font-size:11px;color:#AAAAAA;font-family:'Courier New',monospace;word-break:break-all;">
                      ${labelDisplay}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 28px;border-top:1px solid #E8E8E8;background:#F8F8F8;">
              <table width="100%"><tr>
                <td style="font-size:11px;color:#AAAAAA;">Part of the WiSiVERSE ecosystem</td>
                <td align="right">
                  <a href="https://wisiverse.com" style="font-size:11px;color:#E8352A;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;text-decoration:none;">wisiverse.com →</a>
                </td>
              </tr></table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    await resend.emails.send({
      from: 'WisiQR <noreply@wisiverse.com>',
      to: email,
      subject: 'Your QR Code from WisiQR',
      html,
      attachments: [
        {
          filename: 'wisiqr-code.png',
          content: qrBuffer,
        },
      ],
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('send-email error:', err)
    return res.status(500).json({ error: 'Failed to send email' })
  }
}
