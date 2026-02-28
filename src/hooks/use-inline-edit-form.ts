import { useForm } from "@tanstack/react-form";
import type { FocusEvent, KeyboardEvent } from "react";
import { useRef, useState } from "react";

type InlineEditValues = Record<string, string>;

type InlineEditSubmitArgs<TId, TValues extends InlineEditValues> = {
	id: TId;
	value: TValues;
	initialValue: TValues;
};

type InlineEditOptions<TId, TValues extends InlineEditValues> = {
	emptyValues: TValues;
	onSubmit: (args: InlineEditSubmitArgs<TId, TValues>) => Promise<undefined | false>;
	onError?: (error: unknown) => void;
	isUnchanged?: (args: { value: TValues; initialValue: TValues }) => boolean;
	shouldSkipBlurSave?: (nextTarget: HTMLElement | null) => boolean;
};

export function useInlineEditForm<TId, TValues extends InlineEditValues>(
	options: InlineEditOptions<TId, TValues>,
) {
	const [editingId, setEditingId] = useState<TId | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [focusField, setFocusField] = useState<keyof TValues | null>(null);
	const initialValueRef = useRef<TValues>(options.emptyValues);

	const form = useForm({
		defaultValues: options.emptyValues,
		onSubmit: async ({ value }) => {
			if (editingId === null) {
				return;
			}

			const nextValue = value as TValues;
			const initialValue = initialValueRef.current;

			const isUnchanged = options.isUnchanged
				? options.isUnchanged({ value: nextValue, initialValue })
				: JSON.stringify(nextValue) === JSON.stringify(initialValue);

			if (isUnchanged) {
				setEditingId(null);
				return;
			}

			setIsSaving(true);

			try {
				const result = await options.onSubmit({
					id: editingId,
					value: nextValue,
					initialValue,
				});

				if (result === false) {
					return;
				}

				setEditingId(null);
			} catch (error) {
				options.onError?.(error);
			} finally {
				setIsSaving(false);
			}
		},
	});

	const setFormValues = (values: TValues) => {
		for (const [key, value] of Object.entries(values)) {
			form.setFieldValue(key as never, value as never);
		}
	};

	const startEditing = (id: TId, values: TValues, field: keyof TValues) => {
		if (isSaving) {
			return;
		}

		if (editingId === id) {
			setFocusField(field);
			return;
		}

		setEditingId(id);
		initialValueRef.current = { ...values };
		setFormValues(values);
		setFocusField(field);
	};

	const cancelEditing = () => {
		if (isSaving) {
			return;
		}

		setEditingId(null);
		setFormValues(options.emptyValues);
	};

	const saveEditing = async () => {
		if (editingId === null || isSaving) {
			return;
		}

		await form.handleSubmit();
	};

	const handleInputBlur = (event: FocusEvent<HTMLElement>) => {
		const nextTarget = event.relatedTarget as HTMLElement | null;

		const shouldSkip = options.shouldSkipBlurSave
			? options.shouldSkipBlurSave(nextTarget)
			: nextTarget?.dataset.editableCell === "true";

		if (shouldSkip) {
			return;
		}

		void saveEditing();
	};

	const handleInputKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		if (event.key === "Enter") {
			event.preventDefault();
			void saveEditing();
			return;
		}

		if (event.key === "Escape") {
			event.preventDefault();
			cancelEditing();
		}
	};

	return {
		form,
		editingId,
		isSaving,
		focusField,
		setFocusField,
		startEditing,
		cancelEditing,
		saveEditing,
		handleInputBlur,
		handleInputKeyDown,
	};
}
