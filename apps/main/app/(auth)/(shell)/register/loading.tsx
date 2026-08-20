// Full-page transition: there is no content shape to preview here, so the branded
// loader is the honest fallback. Content routes use a matching skeleton instead -
// see @repo/ui/components/skeleton-kit.
import { FullScreenLoader } from "@repo/ui/components/full-screen-loader";

export default function Loading() {
    return <FullScreenLoader label="Just a moment" />;
}
