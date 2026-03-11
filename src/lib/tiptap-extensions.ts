import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";

const baseExtensions = () => [
	StarterKit.configure({
		heading: { levels: [1, 2, 3] },
		link: false,
		underline: false,
	}),
	Underline,
	Image,
	Table,
	TableRow,
	TableHeader,
	TableCell,
];

export const editorContentExtensions = [
	...baseExtensions(),
	Link.configure({
		openOnClick: false,
		enableClickSelection: true,
		HTMLAttributes: {
			rel: null,
			target: null,
		},
	}),
];

export const renderContentExtensions = [
	...baseExtensions(),
	Link.configure({
		HTMLAttributes: {
			rel: "noopener noreferrer",
			target: "_blank",
		},
	}),
];
