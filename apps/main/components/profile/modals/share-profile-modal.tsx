"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
	Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
	Tabs, TabsContent, TabsList, TabsTrigger
} from "@repo/ui/components/ui/tabs";
import {
	Copy, Check, Link as LinkIcon, Mail, Twitter, Linkedin, Facebook,
	MessageCircle, Code, Download, QrCode, Share2
} from "lucide-react";
import toast from "@repo/ui/components/ui/sonner";
import { publicProfileUrl } from "@/lib/urls";

interface ShareProfileModalProps {
	isOpen: boolean;
	onClose: () => void;
	username: string;
	name: string | null;
	image?: string | null;
}

export function ShareProfileModal({
	isOpen,
	onClose,
	username,
	name,
}: ShareProfileModalProps) {
	const [copied, setCopied] = useState<string | null>(null);

	// Was `${window.location.origin}/u/${username}` - a route this app does not
	// have, so every copied link 404'd, and the origin read degraded to "" on any
	// server render. See lib/urls.ts.
	const profileUrl = publicProfileUrl(username);
	// NOTE: there is no `/embed` view. This iframes the profile page itself, so
	// the snippet resolves rather than 404s - but it will render the full page,
	// not a widget, and only once public profiles are readable signed-out.
	const embedCode = `<iframe src="${profileUrl}" width="400" height="600" frameborder="0"></iframe>`;

	const copyToClipboard = async (text: string, type: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(type);
			toast.success("Copied to clipboard!");
			setTimeout(() => setCopied(null), 2000);
		} catch {
			toast.error("Failed to copy");
		}
	};

	const shareToSocial = (platform: string) => {
		const text = `Check out ${name || username}'s profile on ShipItHQ!`;
		const encodedUrl = encodeURIComponent(profileUrl);
		const encodedText = encodeURIComponent(text);

		const urls: Record<string, string> = {
			twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
			linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
			facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
			whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
			email: `mailto:?subject=${encodedText}&body=Check out this profile: ${encodedUrl}`,
		};

		if (urls[platform]) {
			window.open(urls[platform], "_blank", "width=600,height=400");
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Share2 className="w-5 h-5" />
						Share Profile
					</DialogTitle>
					<DialogDescription>
						Share your profile with others via link or social media.
					</DialogDescription>
				</DialogHeader>
				<Tabs defaultValue="link" className="mt-4">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="link" className="gap-1.5">
							<LinkIcon className="w-4 h-4" />
							Link
						</TabsTrigger>
						<TabsTrigger value="social" className="gap-1.5">
							<Share2 className="w-4 h-4" />
							Social
						</TabsTrigger>
						<TabsTrigger value="embed" className="gap-1.5">
							<Code className="w-4 h-4" />
							Embed
						</TabsTrigger>
					</TabsList>
					<TabsContent value="link" className="space-y-4 mt-4">
						<div className="space-y-2">
							<Label>Profile URL</Label>
							<div className="flex gap-2">
								<Input value={profileUrl} readOnly className="flex-1" />
								<Button
									variant="outline"
									size="icon"
									onClick={() => copyToClipboard(profileUrl, "link")}
								>
									{
										copied === "link" ? (
											<Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
										) : (
											<Copy className="w-4 h-4" />
										)
									}
								</Button>
							</div>
						</div>
						<div className="flex justify-center p-4 bg-muted rounded-lg">
							<div className="w-32 h-32 bg-background rounded-lg flex items-center justify-center border-2 border-dashed">
								<QrCode className="w-8 h-8 text-muted-foreground" />
								<span className="sr-only">QR Code</span>
							</div>
						</div>
						<div className="flex gap-2">
							<Button variant="outline" className="flex-1 gap-2">
								<QrCode className="w-4 h-4" />
								Generate QR
							</Button>
							<Button variant="outline" className="flex-1 gap-2">
								<Download className="w-4 h-4" />
								Download Card
							</Button>
						</div>
					</TabsContent>
					<TabsContent value="social" className="mt-4">
						<div className="grid grid-cols-2 gap-3">
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => shareToSocial("twitter")}
								className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
							>
								<div className="w-10 h-10 rounded-full bg-[#525252]/10 flex items-center justify-center">
									<Twitter className="w-5 h-5 text-[#525252]" />
								</div>
								<span className="font-medium">Twitter</span>
							</motion.button>
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => shareToSocial("linkedin")}
								className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
							>
								<div className="w-10 h-10 rounded-full bg-[#525252]/10 flex items-center justify-center">
									<Linkedin className="w-5 h-5 text-[#525252]" />
								</div>
								<span className="font-medium">LinkedIn</span>
							</motion.button>
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => shareToSocial("facebook")}
								className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
							>
								<div className="w-10 h-10 rounded-full bg-[#525252]/10 flex items-center justify-center">
									<Facebook className="w-5 h-5 text-[#525252]" />
								</div>
								<span className="font-medium">Facebook</span>
							</motion.button>
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => shareToSocial("whatsapp")}
								className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
							>
								<div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center">
									<MessageCircle className="w-5 h-5 text-[#25D366]" />
								</div>
								<span className="font-medium">WhatsApp</span>
							</motion.button>
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => shareToSocial("email")}
								className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors col-span-2"
							>
								<div className="w-10 h-10 rounded-full bg-gray-500/10 flex items-center justify-center">
									<Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
								</div>
								<span className="font-medium">Email</span>
							</motion.button>
						</div>
					</TabsContent>
					<TabsContent value="embed" className="space-y-4 mt-4">
						<div className="space-y-2">
							{/* The snippet WRAPS, and the copy button has its own row.
								It used to be one line in an `overflow-x-auto` pre with the
								button absolutely positioned over its top-right corner, which
								gave the worst of both: the line ran under the button and off
								the panel, so the one thing this tab exists to show could not
								be read without horizontal scrolling past a control sitting on
								top of it.

								`break-all` rather than `break-words`: this is a URL and an
								attribute list with no spaces to break on, so word-boundary
								wrapping would not wrap it at all. */}
							<div className="flex items-center justify-between gap-2">
								<Label>Embed Code</Label>
								<Button
									variant="outline"
									size="sm"
									className="h-7 gap-1.5 text-xs"
									onClick={() => copyToClipboard(embedCode, "embed")}
								>
									{
										copied === "embed" ? (
											<>
												<Check className="w-3 h-3 text-neutral-900 dark:text-neutral-100" />
												Copied
											</>
										) : (
											<>
												<Copy className="w-3 h-3" />
												Copy
											</>
										)
									}
								</Button>
							</div>
							<pre className="rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap break-all">
								<code>{embedCode}</code>
							</pre>
						</div>
						<div className="p-4 bg-muted/50 rounded-lg">
							<p className="text-sm text-muted-foreground">
								Add this code to your website or blog to display your profile card.
								The embedded profile will be responsive and match your site&apos;s theme.
							</p>
						</div>
						<div className="border rounded-lg p-4">
							<p className="text-sm font-medium mb-2">Preview</p>
							<div className="bg-background border rounded-lg p-4 text-center">
								<div className="w-16 h-16 mx-auto rounded-full bg-muted mb-2" />
								<p className="font-medium">{name || username}</p>
								<p className="text-xs text-muted-foreground">@{username}</p>
							</div>
						</div>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}