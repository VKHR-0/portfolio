type MarkdownContentProps = {
	html: string;
	className?: string;
};

export function MarkdownContent({ html, className }: MarkdownContentProps) {
	return (
		// biome-ignore lint/security/noDangerouslySetInnerHtml: admin-authored content rendered to HTML server-side via unified
		<div className={className} dangerouslySetInnerHTML={{ __html: html }} />
	);
}
