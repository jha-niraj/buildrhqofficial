import { 
    Dialog, DialogContent 
} from "@repo/ui/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface LoadingDialogProps {
    open: boolean;
    title: string;
    description: string;
}

export function LoadingDialog({ open, title, description }: LoadingDialogProps) {
    return (
        <Dialog open={open}>
            <DialogContent className="sm:max-w-md">
                <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-neutral-800 dark:text-neutral-200 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                        {description}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
} 