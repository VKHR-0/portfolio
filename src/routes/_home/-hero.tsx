import { Document, Github, Linkedin, Mail } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Separator } from "#/components/ui/separator";
import { CornerSquare } from "./-layout";

export function Hero() {
	return (
		<section>
			<div className="relative flex items-center justify-between border-b-2">
				<CornerSquare position="bottom-left" />
				<CornerSquare position="bottom-right" />
				<h1 className="pl-4 font-bold font-mono text-2xl md:text-3xl">
					Hi, I'm Viktor
				</h1>
				<div className="flex border-l-2 bg-background">
					<a
						href="https://github.com/VKHR-0"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center justify-center p-4 transition-colors hover:bg-muted"
						aria-label="GitHub profile"
					>
						<HugeiconsIcon icon={Github} strokeWidth={2} className="size-5" />
					</a>
					<Separator className="w-0.5!" orientation="vertical" />
					<a
						href="mailto:viktor.harhatt@gmail.com"
						className="flex items-center justify-center p-4 transition-colors hover:bg-muted"
						aria-label="Send email"
					>
						<HugeiconsIcon icon={Mail} strokeWidth={2} className="size-5" />
					</a>
					<Separator className="w-0.5!" orientation="vertical" />
					<a
						href="https://www.linkedin.com/in/viktor-harhat/"
						className="flex items-center justify-center p-4 transition-colors hover:bg-muted"
						aria-label="LinkedIn profile"
					>
						<HugeiconsIcon icon={Linkedin} strokeWidth={2} className="size-5" />
					</a>
					<Separator className="w-0.5!" orientation="vertical" />
					<a
						href="https://drive.google.com/file/d/1F5MOLqZH-C3Ioehlr4ZS0_7M5zhd2Tm1/view?usp=sharing"
						className="flex items-center justify-center p-4 transition-colors hover:bg-muted"
						aria-label="CV"
					>
						<HugeiconsIcon icon={Document} strokeWidth={2} className="size-5" />
					</a>
				</div>
			</div>
			<article className="px-4 py-8 text-lg">
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
