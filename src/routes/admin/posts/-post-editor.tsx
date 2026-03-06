import { Editor } from "#/components/ui/editor";

type PostEditorProps = {
	initialValue?: string;
};

export function PostEditor({ initialValue = "" }: PostEditorProps) {
	return <Editor value={initialValue} />;
}
