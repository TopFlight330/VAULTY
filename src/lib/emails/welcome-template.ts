/**
 * Welcome email template, sent via Resend when a new account is created
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
        <table width="480" cellpadding="0" cellspacing="0" style="background:#16131e;border:1px solid #231f2e;border-radius:16px;overflow:hidden;">
          <tr><td style="height:3px;background:linear-gradient(135deg,#f43f8e,#8b5cf6);"></td></tr>
          <tr>
            <td style="padding:36px 36px 0;">
              <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://vaulty.com'}/logo-email.svg" width="110" height="30" alt="Vaulty" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td style="padding:28px 36px 0;">
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#f0edf5;">Welcome, ${name}!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 36px 0;color:#8b84a0;font-size:14px;line-height:1.7;">
              Your account is ready. You've joined the platform that lets creators keep 99% of their income.
            </td>
          </tr>
          <tr>
            <td style="padding:28px 36px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:10px;background:linear-gradient(135deg,#f43f8e,#8b5cf6);">
                    <a href="\${process.env.NEXT_PUBLIC_SITE_URL || 'https://vaulty.com'}/login" style="display:inline-block;padding:12px 32px;color:#fff;font-size:14px;font-weight:700;text-decoration:none;">
                      Go to my dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 28px;color:#524d63;font-size:11px;line-height:1.5;">
              &copy; 2026 Vaulty Inc.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
