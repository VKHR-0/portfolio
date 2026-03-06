import { Editor } from "#/components/editor";
import { Card, CardContent } from "#/components/ui/card";

type PostEditorProps = {
	initialValue?: string;
};

export function PostEditor({ initialValue = "" }: PostEditorProps) {
	return (
		<Card size="sm" className="w-full min-w-0 flex-1">
			<CardContent className="h-full min-w-0">
				<Editor
					value={initialValue}
					className="prose prose-neutral dark:prose-invert h-full w-full max-w-none!"
					editorClassName="h-full w-full !max-w-none"
					format="markdown"
				/>
			</CardContent>
		</Card>
	);
}
