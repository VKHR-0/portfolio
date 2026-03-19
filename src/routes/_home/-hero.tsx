import { Document, Github, Linkedin, Mail } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Separator } from "#/components/ui/separator";
import { SOCIAL_LINKS } from "#/lib/constants";
import { CornerSquare } from "./-layout";

export function Hero() {
	return (
		<section>
			<div className="relative flex flex-col justify-between border-b-2 sm:flex-row sm:items-center">
				<CornerSquare position="bottom-left" />
				<CornerSquare position="bottom-right" />
				<h1 className="border-b-2 p-4 font-bold font-mono text-2xl sm:border-b-0 sm:p-0 sm:pl-4 md:text-3xl">
					Hi, I'm Viktor
				</h1>
				<div className="flex w-full bg-background sm:w-auto sm:border-l-2">
					<a
						href={SOCIAL_LINKS.github}
						target="_blank"
						rel="noopener noreferrer"
						className="flex flex-1 items-center justify-center p-3 transition-colors hover:bg-muted sm:flex-none sm:p-4"
						aria-label="GitHub profile"
					>
						<HugeiconsIcon icon={Github} strokeWidth={2} className="size-5" />
					</a>
					<Separator className="w-0.5!" orientation="vertical" />
					<a
						href={`mailto:${SOCIAL_LINKS.email}`}
						className="flex flex-1 items-center justify-center p-3 transition-colors hover:bg-muted sm:flex-none sm:p-4"
						aria-label="Send email"
					>
						<HugeiconsIcon icon={Mail} strokeWidth={2} className="size-5" />
					</a>
					<Separator className="w-0.5!" orientation="vertical" />
					<a
						href={SOCIAL_LINKS.linkedin}
						className="flex flex-1 items-center justify-center p-3 transition-colors hover:bg-muted sm:flex-none sm:p-4"
						aria-label="LinkedIn profile"
					>
						<HugeiconsIcon icon={Linkedin} strokeWidth={2} className="size-5" />
					</a>
					<Separator className="w-0.5!" orientation="vertical" />
					<a
						href={SOCIAL_LINKS.cv}
						className="flex flex-1 items-center justify-center p-3 transition-colors hover:bg-muted sm:flex-none sm:p-4"
						aria-label="CV"
					>
						<HugeiconsIcon icon={Document} strokeWidth={2} className="size-5" />
					</a>
				</div>
			</div>
			<article className="space-y-4 px-4 py-6 text-base sm:py-8 sm:text-lg">
				<p>
					I'm a software developer who loves developing web applications,
					whether it's frontend, backend, or DevOps - I've experienced all of
					those areas.
				</p>
				<p>
					Even if it sounds like I'm a jack of all trades, I'm aware that I
					don't know everything. I'm eager to learn new things and grow.
				</p>
			</article>
		</section>
	);
}
