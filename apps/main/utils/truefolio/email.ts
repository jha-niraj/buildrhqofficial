import { creditEmailTemplates, sendCreditEmail } from "@/lib/emails/creditemail";
import { absoluteUrl } from "@/lib/urls";

export async function sendTransferVerificationEmail(
    userEmail: string,
    userName: string,
    transferId: string,
    creditsRequested: number,
    verificationToken: string,
) {
    // `absoluteUrl`, not a three-way env fallback. The first branch,
    // `NEXT_PUBLIC_APP_URL`, is not defined anywhere in this repo, and the last
    // one hardcoded port 3000 - the MARKETING site - so a verification link
    // built on a machine without the middle variable pointed at the wrong app
    // entirely. See lib/urls.ts for why every shareable link is built there.
    const verificationUrl = absoluteUrl(`/verify?token=${encodeURIComponent(verificationToken)}`);

    const targetEmail =
        process.env.NODE_ENV === "development"
            ? "shunyatechofficial@gmail.com"
            : userEmail;

    const template = creditEmailTemplates.transferVerification(
        userName,
        creditsRequested,
        transferId,
        verificationUrl,
        process.env.NODE_ENV === "development" ? userEmail : undefined,
    );

    return sendCreditEmail(targetEmail, template);
}

export async function sendTransferCompletionEmail(
    userEmail: string,
    userName: string,
    creditsTransferred: number,
    newBalance: number,
) {
    const targetEmail =
        process.env.NODE_ENV === "development"
            ? "shunyatechofficial@gmail.com"
            : userEmail;

    const template = creditEmailTemplates.transferCompleted(
        userName,
        creditsTransferred,
        newBalance,
    );

    return sendCreditEmail(targetEmail, template);
}
