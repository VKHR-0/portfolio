import { type Icon, IconBan } from "@tabler/icons-react";
import type { Editor } from "@tiptap/core";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

export type SlashItem = {
	title: string;
	icon: Icon;
	command: (params: {
		editor: Editor;
		range: { from: number; to: number };
	}) => void;
};

type CommandsListProps = {
	items: SlashItem[];
	command: (item: SlashItem) => void;
};

export type CommandsListHandle = {
	onKeyDown: (event: KeyboardEvent) => boolean;
};

const CommandsList = forwardRef<CommandsListHandle, CommandsListProps>(
	({ items, command }, ref) => {
		const [selectedIndex, setSelectedIndex] = useState(0);

		useEffect(() => {
			setSelectedIndex(0);
		}, []);

		const selectItem = (index: number) => {
			const item = items[index];
			if (item) command(item);
		};

		useImperativeHandle(ref, () => ({
			onKeyDown: (event: KeyboardEvent) => {
				if (!items.length) return false;

				if (event.key === "ArrowUp") {
					event.preventDefault();
					setSelectedIndex(
						(current) => (current + items.length - 1) % items.length,
					);
					return true;
				}

				if (event.key === "ArrowDown") {
					event.preventDefault();
					setSelectedIndex((current) => (current + 1) % items.length);
					return true;
				}

				if (event.key === "Enter") {
					event.preventDefault();
					selectItem(selectedIndex);
					return true;
				}

				return false;
			},
		}));

		return (
			<div className="z-50 min-w-44 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
				{items.length ? (
					items.map((item, index) => (
						<button
							key={item.title}
							type="button"
							onClick={() => selectItem(index)}
							className="relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
						>
							<item.icon className="mr-2 size-4" />
							{item.title}
						</button>
					))
				) : (
					<div className="flex items-center px-2 py-1.5 text-muted-foreground text-sm">
						<IconBan className="mr-2 size-4" />
						No results
					</div>
				)}
			</div>
		);
	},
);

CommandsList.displayName = "CommandsList";

export default CommandsList;
