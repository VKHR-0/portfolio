import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditingProvider } from "./editing-context";
import { InlineInputCell } from "./inline-input-cell";

afterEach(() => {
	cleanup();
});

function renderInlineInputCell(
	props?: Partial<React.ComponentProps<typeof InlineInputCell>>,
) {
	const onSave = vi.fn<React.ComponentProps<typeof InlineInputCell>["onSave"]>(
		async () => undefined,
	);

	render(
		<EditingProvider>
			<InlineInputCell value="Initial value" onSave={onSave} {...props} />
		</EditingProvider>,
	);

	return { onSave };
}

describe("InlineInputCell", () => {
	it("shows an input on double click and focuses it", async () => {
		renderInlineInputCell();

		expect(screen.queryByRole("textbox")).toBeNull();

		fireEvent.doubleClick(
			screen.getByRole("button", { name: /initial value/i }),
		);

		const input = await screen.findByRole("textbox");
		expect(document.activeElement).toBe(input);
	});

	it("saves a trimmed value on Enter", async () => {
		const { onSave } = renderInlineInputCell();

		fireEvent.doubleClick(
			screen.getByRole("button", { name: /initial value/i }),
		);

		const input = await screen.findByRole("textbox");
		fireEvent.change(input, { target: { value: "  Updated value  " } });
		fireEvent.keyDown(input, { key: "Enter" });

		await waitFor(() => {
			expect(onSave).toHaveBeenCalledWith("Updated value");
		});
		await waitFor(() => {
			expect(screen.queryByRole("textbox")).toBeNull();
		});
	});

	it("exits without saving when the value is unchanged", async () => {
		const { onSave } = renderInlineInputCell();

		fireEvent.doubleClick(
			screen.getByRole("button", { name: /initial value/i }),
		);

		const input = await screen.findByRole("textbox");
		fireEvent.change(input, { target: { value: "  Initial value  " } });
		fireEvent.keyDown(input, { key: "Enter" });

		await waitFor(() => {
			expect(onSave).not.toHaveBeenCalled();
		});
		await waitFor(() => {
			expect(screen.queryByRole("textbox")).toBeNull();
		});
	});

	it("exits without saving on Escape", async () => {
		const { onSave } = renderInlineInputCell();

		fireEvent.doubleClick(
			screen.getByRole("button", { name: /initial value/i }),
		);

		const input = await screen.findByRole("textbox");
		fireEvent.change(input, { target: { value: "Updated value" } });
		fireEvent.keyDown(input, { key: "Escape" });

		await waitFor(() => {
			expect(onSave).not.toHaveBeenCalled();
		});
		await waitFor(() => {
			expect(screen.queryByRole("textbox")).toBeNull();
		});
	});
});
