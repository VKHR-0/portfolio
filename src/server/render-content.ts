import { createServerFn } from "@tanstack/react-start";
import { renderToHTMLString } from "@tiptap/static-renderer/pm/html-string";
import { renderContentExtensions } from "#/lib/tiptap-extensions";

export const renderContent = createServerFn()
	.inputValidator((input: string) => input)
	.handler(async ({ data: content }) => {
		if (!content) return "";

		return renderToHTMLString({
			extensions: renderContentExtensions,
			content: JSON.parse(content),
		});
	});
