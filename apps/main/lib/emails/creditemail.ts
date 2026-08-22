import { Resend } from "resend";
import { shell, resolveFromAddress } from "@repo/email";

function getResend(): Resend {
    if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY environment variable is not set");
    }
    return new Resend(process.env.RESEND_API_KEY);
}

function fromEmail(): string {
    return resolveFromAddress();
}

function appUrl(): string {
    return (
        process.env.NEXT_PUBLIC_BASE_URL ||
        process.env.BETTER_AUTH_URL ||
        "http://localhost:3000"
    );
}

// ─── Shell ────────────────────────────────────────────────────────────────────


// ─── Templates ────────────────────────────────────────────────────────────────

export const creditEmailTemplates = {

    creditApproved: (name: string, creditsAwarded: number, newBalance: number, adminNotes?: string) => ({
        subject: "Your credit request has been approved - ShipItHQ",
        html: shell({
            title: "Credit request approved",
            subtitle: "Your credits are ready to use",
            body: `
        <p style="margin:0 0 14px;font-size:15px;color:#111111;">Hello ${name},</p>
        <p style="margin:0 0 18px;font-size:14px;color:#525252;">
          Your LinkedIn sharing reward has been reviewed and approved. The credits have been added to your account.
        </p>

        <div style="margin:20px 0;border:1px solid #e5e5e5;border-radius:10px;overflow:hidden;">
          <table style="width:100%;border-collapse:collapse;">
            <tr style="border-bottom:1px solid #f5f5f5;">
              <td style="padding:12px 16px;font-size:12px;color:#737373;text-transform:uppercase;letter-spacing:0.08em;width:50%;">Credits awarded</td>
              <td style="padding:12px 16px;font-size:18px;font-weight:700;color:#111111;text-align:right;">+${creditsAwarded}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:12px;color:#737373;text-transform:uppercase;letter-spacing:0.08em;">New balance</td>
              <td style="padding:12px 16px;font-size:18px;font-weight:700;color:#111111;text-align:right;">${newBalance}</td>
            </tr>
          </table>
        </div>

        ${adminNotes ? `
        <div style="margin:16px 0;padding:14px;border:1px solid #e5e5e5;border-radius:8px;background:#fafafa;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#525252;text-transform:uppercase;letter-spacing:0.08em;">Admin note</p>
          <p style="margin:0;font-size:13px;color:#404040;">${adminNotes}</p>
        </div>` : ""}

        <div style="margin:18px 0;padding:14px;border:1px solid #e5e5e5;border-radius:8px;background:#fafafa;font-size:13px;color:#525252;">
          <p style="margin:0 0 8px;font-weight:600;color:#111111;">What you can do with your credits</p>
          <ul style="margin:0;padding-left:18px;line-height:1.8;">
            <li>Generate AI-powered interview questions</li>
            <li>Access premium learning content</li>
            <li>Take advanced skill assessments</li>
            <li>Create and solve debugging challenges</li>
          </ul>
        </div>

        <p style="text-align:center;margin:24px 0 8px;">
          <a href="${appUrl()}/home"
             style="display:inline-block;background:#171717;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600;">
            Start using your credits
          </a>
        </p>
      `,
        }),
    }),

    creditRejected: (name: string, requestedCredits: number, adminNotes?: string) => ({
        subject: "Update on your credit request - ShipItHQ",
        html: shell({
            title: "Credit request update",
            subtitle: "A little more is needed to approve your request",
            body: `
        <p style="margin:0 0 14px;font-size:15px;color:#111111;">Hello ${name},</p>
        <p style="margin:0 0 18px;font-size:14px;color:#525252;">
          Thank you for submitting your credit request for <strong>${requestedCredits} credits</strong>.
          After reviewing your LinkedIn post, we need a bit more information to complete the approval.
        </p>

        <div style="margin:20px 0;padding:16px;border:1px solid #e5e5e5;border-radius:10px;background:#fafafa;">
          <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#111111;">What we need from you</p>
          <p style="margin:0;font-size:13px;color:#525252;line-height:1.7;">
            ${adminNotes || "Please ensure your LinkedIn post is public, mentions @ShipItHQ, and includes our template content."}
          </p>
        </div>

        <div style="margin:16px 0;padding:14px;border:1px solid #e5e5e5;border-radius:8px;background:#fafafa;font-size:13px;color:#525252;">
          <p style="margin:0 0 8px;font-weight:600;color:#111111;">Requirements checklist</p>
          <ul style="margin:0;padding-left:18px;line-height:1.8;">
            <li>Post must be public and accessible</li>
            <li>Include a mention of ShipItHQ</li>
            <li>Use our provided template or share your genuine experience</li>
            <li>Submit the correct post URL with your request</li>
          </ul>
        </div>

        <p style="margin:16px 0;font-size:13px;color:#525252;">
          Once you've updated your post, submit a new request and we'll review it within 24 hours.
        </p>

        <p style="text-align:center;margin:24px 0 8px;">
          <a href="${appUrl()}/purchase"
             style="display:inline-block;background:#171717;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600;">
            Submit new request
          </a>
        </p>
      `,
        }),
    }),

    transferVerification: (
        name: string,
        creditsRequested: number,
        transferId: string,
        verificationUrl: string,
        originalEmail?: string,
    ) => ({
        subject: "Verify your TrueFolio credit transfer - ShipItHQ",
        html: shell({
            title: "Credit transfer verification",
            subtitle: "Confirm this request to complete the transfer",
            body: `
        <p style="margin:0 0 14px;font-size:15px;color:#111111;">Hello ${name},</p>
        <p style="margin:0 0 20px;font-size:14px;color:#525252;">
          You've requested to transfer credits from your ShipItHQ account to TrueFolio.
          Please verify this request by clicking the button below. This link expires in <strong>15 minutes</strong>.
        </p>

        <div style="margin:20px 0;border:1px solid #e5e5e5;border-radius:10px;overflow:hidden;">
          <table style="width:100%;border-collapse:collapse;">
            <tr style="border-bottom:1px solid #f5f5f5;">
              <td style="padding:12px 16px;font-size:12px;color:#737373;text-transform:uppercase;letter-spacing:0.08em;width:50%;">Credits requested</td>
              <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#111111;text-align:right;">${creditsRequested}</td>
            </tr>
            <tr style="border-bottom:1px solid #f5f5f5;">
              <td style="padding:12px 16px;font-size:12px;color:#737373;text-transform:uppercase;letter-spacing:0.08em;">From</td>
              <td style="padding:12px 16px;font-size:14px;color:#111111;text-align:right;">ShipItHQ</td>
            </tr>
            <tr style="border-bottom:1px solid #f5f5f5;">
              <td style="padding:12px 16px;font-size:12px;color:#737373;text-transform:uppercase;letter-spacing:0.08em;">To</td>
              <td style="padding:12px 16px;font-size:14px;color:#111111;text-align:right;">TrueFolio</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:12px;color:#737373;text-transform:uppercase;letter-spacing:0.08em;">Transfer ID</td>
              <td style="padding:12px 16px;font-size:12px;font-family:ui-monospace,monospace;color:#111111;text-align:right;">${transferId}</td>
            </tr>
          </table>
        </div>

        <p style="text-align:center;margin:24px 0;">
          <a href="${verificationUrl}"
             style="display:inline-block;background:#171717;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600;">
            Verify transfer
          </a>
        </p>

        <div style="margin:16px 0;padding:14px;border:1px solid #e5e5e5;border-radius:8px;background:#fafafa;font-size:13px;color:#525252;">
          This link expires in 15 minutes. If you did not request this transfer, please ignore this email.
        </div>

        <p style="margin:0 0 8px;font-size:13px;color:#525252;">If the button does not work, copy and paste this URL:</p>
        <p style="margin:0;padding:10px;border:1px solid #e5e5e5;border-radius:8px;background:#fafafa;word-break:break-all;font-family:ui-monospace,monospace;font-size:12px;color:#404040;">
          ${verificationUrl}
        </p>
      `,
            footerNote: originalEmail
                ? `This email was sent to the address on file. Original recipient: ${originalEmail}.`
                : undefined,
        }),
    }),

    transferCompleted: (name: string, creditsTransferred: number, newBalance: number) => ({
        subject: "Credit transfer completed - TrueFolio",
        html: shell({
            title: "Transfer completed",
            subtitle: "Your credits are ready to use in TrueFolio",
            body: `
        <p style="margin:0 0 14px;font-size:15px;color:#111111;">Hello ${name},</p>
        <p style="margin:0 0 18px;font-size:14px;color:#525252;">
          Your credit transfer has been completed successfully. The credits are now available in your TrueFolio account.
        </p>

        <div style="margin:20px 0;border:1px solid #e5e5e5;border-radius:10px;overflow:hidden;">
          <table style="width:100%;border-collapse:collapse;">
            <tr style="border-bottom:1px solid #f5f5f5;">
              <td style="padding:12px 16px;font-size:12px;color:#737373;text-transform:uppercase;letter-spacing:0.08em;width:50%;">Credits transferred</td>
              <td style="padding:12px 16px;font-size:18px;font-weight:700;color:#111111;text-align:right;">+${creditsTransferred}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:12px;color:#737373;text-transform:uppercase;letter-spacing:0.08em;">New TrueFolio balance</td>
              <td style="padding:12px 16px;font-size:18px;font-weight:700;color:#111111;text-align:right;">${newBalance}</td>
            </tr>
          </table>
        </div>

        <div style="margin:16px 0;padding:14px;border:1px solid #e5e5e5;border-radius:8px;background:#fafafa;font-size:13px;color:#525252;">
          <p style="margin:0 0 8px;font-weight:600;color:#111111;">What you can do with your credits</p>
          <ul style="margin:0;padding-left:18px;line-height:1.8;">
            <li>AI portfolio analysis and feedback</li>
            <li>Generate professional portfolio cards</li>
            <li>Platform integrations and career insights</li>
          </ul>
        </div>

        <p style="text-align:center;margin:24px 0 8px;">
          <a href="${appUrl()}/home"
             style="display:inline-block;background:#171717;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600;">
            Go to dashboard
          </a>
        </p>
      `,
            footerNote: "This is an automated confirmation from the TrueFolio transfer system. Please do not reply to this email.",
        }),
    }),

};

// ─── Sender ───────────────────────────────────────────────────────────────────

export async function sendCreditEmail(
    to: string,
    template: { subject: string; html: string },
) {
    const result = await getResend().emails.send({
        from: fromEmail(),
        to,
        subject: template.subject,
        html: template.html,
    });

    if (result.error) {
        console.error("Failed to send credit email:", result.error);
        throw new Error(result.error.message);
    }

    console.log("Credit email sent successfully:", result.data?.id);
    return result;
}
