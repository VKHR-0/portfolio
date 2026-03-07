import type { Icon } from "@tabler/icons-react";
import { IconBan } from "@tabler/icons-react";
import type { Editor } from "@tiptap/core";
import { useImperativeHandle, useRef, useState } from "react";
import { Command, CommandItem, CommandList } from "#/components/ui/command";

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
	ref?: React.Ref<CommandsListHandle>;
};

export type CommandsListHandle = {
	onKeyDown: (event: KeyboardEvent) => boolean;
};

function CommandsList({ items, command, ref }: CommandsListProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	// Keep a stable ref to selectedIndex so the useImperativeHandle closure stays fresh
	const selectedIndexRef = useRef(selectedIndex);
	selectedIndexRef.current = selectedIndex;

	// Reset selection when the filtered list changes (setState-during-render avoids useEffect)
	const [prevItems, setPrevItems] = useState(items);
	if (prevItems !== items) {
		setPrevItems(items);
		setSelectedIndex(0);
	}

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
				selectItem(selectedIndexRef.current);
				return true;
			}

			return false;
		},
	}));

	return (
		<Command className="min-w-44 overflow-hidden rounded-md border border-border shadow-md">
			<CommandList>
				{items.length ? (
					items.map((item, index) => (
						<CommandItem
							key={item.title}
							value={item.title}
							data-selected={index === selectedIndex ? true : undefined}
							onSelect={() => selectItem(index)}
							onMouseEnter={() => setSelectedIndex(index)}
						>
							<item.icon />
							{item.title}
						</CommandItem>
					))
				) : (
					<div className="flex items-center px-2 py-1.5 text-muted-foreground text-sm">
						<IconBan className="mr-2 size-4" />
						No results
					</div>
				)}
			</CommandList>
		</Command>
	);
}

export default CommandsList;
