/**
 * Welcome email template — sent via Resend when a new account is created
 */
export function getWelcomeEmailHtml(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#0e0b14;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b14;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#16131e;border:1px solid #231f2e;border-radius:16px;overflow:hidden;">

          <!-- Gradient top bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(135deg,#f43f8e,#8b5cf6);"></td>
          </tr>

          <tr>
            <td style="padding:40px 40px 0;">
              <!-- Logo -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:42px;height:42px;background:linear-gradient(135deg,rgba(244,63,142,0.1),rgba(139,92,246,0.06));border:1px solid rgba(244,63,142,0.2);border-radius:12px;text-align:center;vertical-align:middle;">
                    <span style="font-size:20px;color:#f43f8e;">&#9673;</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="font-size:20px;font-weight:900;color:#ffffff;letter-spacing:1px;">Vaulty</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 40px 0;">
              <h1 style="margin:0;font-size:24px;font-weight:800;color:#f0edf5;">
                Welcome to Vaulty, ${name}!
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 40px 0;color:#8b84a0;font-size:15px;line-height:1.65;">
              Your account is ready. You've joined the platform built for creator independence.
            </td>
          </tr>

          <!-- Highlight box -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(244,63,142,0.06);border:1px solid rgba(244,63,142,0.15);border-radius:12px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#f0edf5;font-size:14px;font-weight:700;padding-bottom:8px;">What makes Vaulty different:</td>
                      </tr>
                      <tr>
                        <td style="color:#8b84a0;font-size:13px;line-height:1.7;">
                          &#10003; &nbsp;Only 1% platform fee — keep 99% of everything<br/>
                          &#10003; &nbsp;Instant payouts within 24 hours<br/>
                          &#10003; &nbsp;Built-in privacy protection & DMCA tools<br/>
                          &#10003; &nbsp;Zero algorithm — your content, your rules
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 40px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:12px;background:linear-gradient(135deg,#f43f8e,#8b5cf6);">
                    <a href="\${process.env.NEXT_PUBLIC_SITE_URL || 'https://vaulty.com'}/login" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.02em;">
                      Go to my dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:#231f2e;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 40px 32px;color:#524d63;font-size:12px;line-height:1.5;">
              Questions? Just reply to this email — we're here to help.<br/>
              &copy; 2026 Vaulty Inc. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
