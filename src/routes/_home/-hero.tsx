import { Document, Github, Linkedin, Mail } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "#/components/ui/button";
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
					<Button
						nativeButton={false}
						variant="ghost"
						size="icon-lg"
						className="mx-2 my-2.5"
						render={
							<a
								href="https://github.com/VKHR-0"
								target="_blank"
								rel="noopener"
								aria-label="GitHub profile"
							>
								<HugeiconsIcon
									icon={Github}
									strokeWidth={2}
									className="size-5"
								/>
								<span className="sr-only">GitHub profile</span>
							</a>
						}
					/>
					<Separator className="w-0.5!" orientation="vertical" />
					<Button
						nativeButton={false}
						variant="ghost"
						size="icon-lg"
						className="mx-2 my-2.5"
						render={
							<a href="mailto:viktor.harhatt@gmail.com" aria-label="Send email">
								<HugeiconsIcon icon={Mail} strokeWidth={2} className="size-5" />
								<span className="sr-only">Send email</span>
							</a>
						}
					/>
					<Separator className="w-0.5!" orientation="vertical" />
					<Button
						nativeButton={false}
						variant="ghost"
						size="icon-lg"
						className="mx-2 my-2.5"
						render={
							<a
								href="https://www.linkedin.com/in/viktor-harhat/"
								aria-label="LinkedIn profile"
							>
								<HugeiconsIcon
									icon={Linkedin}
									strokeWidth={2}
									className="size-5"
								/>
								<span className="sr-only">LinkedIn profile</span>
							</a>
						}
					/>
					<Separator className="w-0.5!" orientation="vertical" />
					<Button
						nativeButton={false}
						variant="ghost"
						size="icon-lg"
						className="mx-2 my-2.5"
						render={
							<a
								href="https://drive.google.com/file/d/1F5MOLqZH-C3Ioehlr4ZS0_7M5zhd2Tm1/view?usp=sharing"
								aria-label="CV"
							>
								<HugeiconsIcon
									icon={Document}
									strokeWidth={2}
									className="size-5"
								/>
								<span className="sr-only">CV</span>
							</a>
						}
					/>
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
