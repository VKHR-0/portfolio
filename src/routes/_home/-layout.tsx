import { cva } from "class-variance-authority";
import { type HTMLMotionProps, motion } from "motion/react";
import { cn } from "#/lib/utils";

type LayoutProps = {
	children: React.ReactNode;
};

export function Layout({ children }: LayoutProps) {
	return (
		<div className="relative">
			<div
				className="pointer-events-none absolute inset-0 bg-diagonal-dashed"
				aria-hidden="true"
			/>
			<div className="relative z-10 flex min-h-screen flex-col overflow-hidden font-sans">
				{children}
			</div>
		</div>
	);
}

const cornerSquareVariants = cva(
	"absolute z-30 size-3 rotate-45 border-2 bg-background",
	{
		variants: {
			position: {
				"top-left": "",
				"top-right": "",
				"bottom-left": "",
				"bottom-right": "",
			},
			mode: {
				offset: "",
				centered: "",
			},
		},
		compoundVariants: [
			{
				position: "top-left",
				mode: "offset",
				class: "-top-1.5 -left-1.5",
			},
			{
				position: "top-right",
				mode: "offset",
				class: "-top-1.5 -right-1.5",
			},
			{
				position: "bottom-left",
				mode: "offset",
				class: "-bottom-1.5 -left-1.5",
			},
			{
				position: "bottom-right",
				mode: "offset",
				class: "-right-1.5 -bottom-1.5",
			},
			{
				position: "top-left",
				mode: "centered",
				class: "top-0 left-0 -translate-x-1/2 -translate-y-1/2",
			},
			{
				position: "top-right",
				mode: "centered",
				class: "top-0 right-0 translate-x-1/2 -translate-y-1/2",
			},
			{
				position: "bottom-left",
				mode: "centered",
				class: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
			},
			{
				position: "bottom-right",
				mode: "centered",
				class: "right-0 bottom-0 translate-x-1/2 translate-y-1/2",
			},
		],
		defaultVariants: {
			position: "top-left",
			mode: "offset",
		},
	},
);

type CornerSquareProps = HTMLMotionProps<"div"> & {
	position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
	mode?: "offset" | "centered";
	className?: string;
};

export function CornerSquare({
	position,
	mode,
	className,
	...props
}: CornerSquareProps) {
	"use no memo";
	return (
		<motion.div
			className={cn(cornerSquareVariants({ position, mode }), className)}
			aria-hidden="true"
			{...props}
		/>
	);
}
