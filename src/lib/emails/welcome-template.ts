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
        <table width="520" cellpadding="0" cellspacing="0" style="background:#16131e;border:1px solid #231f2e;border-radius:16px;padding:40px;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:28px;font-weight:900;color:#f0edf5;letter-spacing:1px;">Vaulty</span>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:16px;">
              <span style="font-size:22px;font-weight:800;background:linear-gradient(135deg,#f43f8e,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
                Welcome, ${name}!
              </span>
            </td>
          </tr>
          <tr>
            <td align="center" style="color:#8b84a0;font-size:15px;line-height:1.6;padding-bottom:32px;">
              Your Vaulty account is ready. You've joined the platform built for creator independence.<br/><br/>
              Zero algorithm. Zero unfair cuts. Total control.
            </td>
          </tr>
          <tr>
            <td align="center">
              <a href="{SITE_URL}/login" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#f43f8e,#8b5cf6);color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;">
                Go to Vaulty
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:32px;color:#524d63;font-size:12px;">
              &copy; Vaulty. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
