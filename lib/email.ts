import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface InquiryNotificationParams {
  sellerEmail: string
  sellerName: string
  buyerName: string
  buyerEmail: string
  buyerPhone?: string
  listingTitle: string
  message: string
  listingId: string
}

export async function sendInquiryNotification({
  sellerEmail,
  sellerName,
  buyerName,
  buyerEmail,
  buyerPhone,
  listingTitle,
  message,
  listingId,
}: InquiryNotificationParams) {
  const dashboardUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/seller/dashboard`

  await resend.emails.send({
    from: 'HomeMade <onboarding@resend.dev>',
    to: sellerEmail,
    subject: `New inquiry about "${listingTitle}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
        <h2 style="color: #ff5c00;">You have a new inquiry!</h2>
        <p>Hi ${sellerName},</p>
        <p><strong>${buyerName}</strong> (${buyerEmail}) sent you a message about your listing <strong>"${listingTitle}"</strong>:</p>
        <blockquote style="border-left: 4px solid #ff5c00; margin: 16px 0; padding: 12px 16px; background: #fff7f3; border-radius: 4px;">
          ${message.replace(/\n/g, '<br>')}
        </blockquote>
        <p>You can reply directly to ${buyerEmail}${buyerPhone ? ` or call them at ${buyerPhone}` : ''} or view all your inquiries in your dashboard.</p>
        <a href="${dashboardUrl}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #ff5c00; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
          View in Dashboard
        </a>
        <p style="margin-top: 32px; font-size: 12px; color: #999;">You received this email because someone submitted an inquiry on HomeMade.</p>
      </div>
    `,
  })
}
