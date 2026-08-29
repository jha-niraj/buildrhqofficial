import Link from "next/link";
import { Bot } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";

/**
 * What a visitor sees when a KnowMe link does not resolve.
 *
 * The generic app 404 - a cartoon caveman, "Look like you're lost", and a "Go to
 * Home" button into an application the visitor has no account for - was wrong
 * here in every particular. This link was almost certainly given to them by the
 * person it belongs to, and the usual reason it fails is not a typo: it is that
 * the owner has not published their assistant yet, or has set it to require an
 * account.
 *
 * Those two cases are deliberately NOT distinguished on this page. Saying "this
 * profile exists but is private" to an anonymous visitor confirms an account
 * exists at that username, which is exactly what the owner asked not to share.
 * One honest, non-committal message covers both.
 */
export default function NotFound() {
    return (
        <div className="flex min-h-dvh items-center justify-center px-6 py-12">
            <div className="w-full max-w-md text-center">
                <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                    <Bot className="h-7 w-7" />
                </span>
                <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
                    This assistant is not available
                </h1>
                <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-400">
                    The link may be wrong, or the person it belongs to has not published their
                    KnowMe assistant yet. If someone shared this with you, ask them to check it
                    is live.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/">Go to ShipItHQ</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
