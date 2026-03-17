type LayoutProps = {
	children: React.ReactNode;
};

export function Layout({ children }: LayoutProps) {
	return (
		<>
			<div
				className="pointer-events-none absolute inset-0 bg-diagonal-dashed"
				aria-hidden="true"
			/>
			<div className="relative z-10 flex min-h-screen flex-col overflow-hidden font-sans">
				{children}
			</div>
		</>
	);
}

type CornerSquareProps = {
	position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
};

export function CornerSquare({ position }: CornerSquareProps) {
	const positionClasses: Record<CornerSquareProps["position"], string> = {
		"top-left": "-left-1.5 -top-1.5",
		"top-right": "-right-1.5 -top-1.5",
		"bottom-left": "-bottom-1.5 -left-1.5",
		"bottom-right": "-bottom-1.5 -right-1.5",
	};

	return (
		<div
			className={`absolute size-3 rotate-45 border-2 bg-background ${positionClasses[position]} z-20`}
			aria-hidden="true"
		/>
	);
}
