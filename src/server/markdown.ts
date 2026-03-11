import { createServerFn } from "@tanstack/react-start";
import rehypeExternalLinks from "rehype-external-links";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const sanitizeSchema = {
	...defaultSchema,
	tagNames: [...(defaultSchema.tagNames ?? []), "u"],
};

const processor = unified()
	.use(remarkParse)
	.use(remarkGfm)
	.use(remarkRehype, { allowDangerousHtml: true })
	.use(rehypeRaw)
	.use(rehypeSanitize, sanitizeSchema)
	.use(rehypeHighlight, { detect: true })
	.use(rehypeExternalLinks, {
		target: "_blank",
		rel: ["noopener", "noreferrer"],
	})
	.use(rehypeStringify);

export const renderMarkdown = createServerFn()
	.inputValidator((input: string) => input)
	.handler(async ({ data: markdown }) => {
		const result = await processor.process(markdown);
		return String(result);
	});
