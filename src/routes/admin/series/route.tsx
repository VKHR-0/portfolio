import { convexQuery } from "@convex-dev/react-query";
import { IconPlus } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import * as React from "react";
import { toSlug } from "shared/slug";
import { toast } from "sonner";
import { EditableCell, PageCard } from "#/components/page-card";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { TableCell, TableHead, TableRow } from "#/components/ui/table";
import { useInlineEditForm } from "#/hooks/use-inline-edit-form";

const PAGE_SIZE = 10;

function listSeriesQuery(cursor: string | null) {
	return convexQuery(api.functions.series.list, {
		paginationOpts: { numItems: PAGE_SIZE, cursor },
	});
}

export const Route = createFileRoute("/admin/series")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(listSeriesQuery(null));
	},
	component: RouteComponent,
});

function RouteComponent() {
	const [cursors, setCursors] = React.useState<Array<string | null>>([null]);
	const [currentPage, setCurrentPage] = React.useState(1);
	const currentCursor = cursors[currentPage - 1] ?? null;
	const updateSeries = useMutation(api.functions.series.updateSeries);
	const nameInputRef = React.useRef<HTMLInputElement>(null);
	const slugInputRef = React.useRef<HTMLInputElement>(null);
	const descriptionInputRef = React.useRef<HTMLInputElement>(null);

	const {
		form,
		editingId: editingSeriesId,
		isSaving: isSavingEdit,
		focusField,
		setFocusField,
		startEditing,
		handleInputBlur,
		handleInputKeyDown,
	} = useInlineEditForm<
		Id<"series">,
		{ name: string; slug: string; description: string }
	>({
		emptyValues: { name: "", slug: "", description: "" },
		isUnchanged: ({ value, initialValue }) =>
			value.name.trim() === initialValue.name &&
			toSlug(value.slug) === initialValue.slug &&
			value.description.trim() === initialValue.description,
		onSubmit: async ({ id, value }) => {
			const name = value.name.trim();
			const slug = toSlug(value.slug);
			const description = value.description.trim();

			if (!name) {
				toast.error("Name is required.");
				setFocusField("name");
				nameInputRef.current?.focus();
				return false;
			}

			if (!slug) {
				toast.error("Slug is required.");
				setFocusField("slug");
				slugInputRef.current?.focus();
				return false;
			}

			await updateSeries({
				id,
				name,
				slug,
				description: description || undefined,
			});
		},
		onError: (mutationError) => {
			toast.error(
				mutationError instanceof Error
					? mutationError.message
					: "Unable to update series.",
			);
		},
	});

	const { data: result } = useQuery(listSeriesQuery(currentCursor));
	const seriesList = result?.page ?? [];
	const pageCount = cursors.length;
	const canGoPrevious = currentPage > 1;
	const canGoNext =
		result !== undefined &&
		(currentPage < pageCount || result.isDone === false);

	React.useEffect(() => {
		if (!editingSeriesId) return;

		if (focusField === "name") {
			nameInputRef.current?.focus();
			nameInputRef.current?.select();
			return;
		}

		if (focusField === "slug") {
			slugInputRef.current?.focus();
			slugInputRef.current?.select();
			return;
		}

		descriptionInputRef.current?.focus();
		descriptionInputRef.current?.select();
	}, [editingSeriesId, focusField]);

	return (
		<>
			<PageCard
				title="Series"
				description="Manage post series."
				createButton={
					<Button nativeButton={false} render={<Link to="/admin/series/new" />}>
						<IconPlus />
						Create new
					</Button>
				}
				loadingLabel="Loading series..."
				emptyLabel="No series found."
				columnCount={4}
				isLoading={result === undefined}
				isEmpty={seriesList.length === 0}
				columnHeaders={
					<>
						<TableHead className="w-[22%]">Name</TableHead>
						<TableHead className="w-[22%]">Slug</TableHead>
						<TableHead className="w-[36%]">Description</TableHead>
						<TableHead>Created</TableHead>
					</>
				}
				currentPage={currentPage}
				pageCount={pageCount}
				canGoPrevious={canGoPrevious}
				canGoNext={canGoNext}
				onPrevious={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
				onSelectPage={(page) => setCurrentPage(page)}
				onNext={() => {
					if (currentPage < pageCount) {
						setCurrentPage((prev) => prev + 1);
						return;
					}

					if (!result?.continueCursor) return;

					setCursors((prev) => [...prev, result.continueCursor]);
					setCurrentPage((prev) => prev + 1);
				}}
			>
				{seriesList.map((item) => (
					<TableRow key={item._id}>
						<EditableCell
							isEditing={editingSeriesId === item._id}
							displayValue={item.name}
							onDoubleClick={() =>
								startEditing(
									item._id,
									{
										name: item.name,
										slug: item.slug,
										description: item.description ?? "",
									},
									"name",
								)
							}
							className="font-medium"
						>
							<form.Field name="name">
								{(field) => (
									<Input
										ref={nameInputRef}
										data-editable-cell="true"
										value={field.state.value}
										disabled={isSavingEdit}
										onChange={(event) => {
											const nextName = event.target.value;
											field.handleChange(nextName);
											form.setFieldValue("slug", toSlug(nextName));
										}}
										onBlur={(event) => {
											field.handleBlur();
											handleInputBlur(event);
										}}
										onKeyDown={handleInputKeyDown}
									/>
								)}
							</form.Field>
						</EditableCell>

						<EditableCell
							isEditing={editingSeriesId === item._id}
							displayValue={item.slug}
							onDoubleClick={() =>
								startEditing(
									item._id,
									{
										name: item.name,
										slug: item.slug,
										description: item.description ?? "",
									},
									"slug",
								)
							}
						>
							<form.Field name="slug">
								{(field) => (
									<Input
										ref={slugInputRef}
										data-editable-cell="true"
										value={field.state.value}
										disabled={isSavingEdit}
										onChange={(event) => field.handleChange(event.target.value)}
										onBlur={(event) => {
											field.handleBlur();
											handleInputBlur(event);
										}}
										onKeyDown={handleInputKeyDown}
									/>
								)}
							</form.Field>
						</EditableCell>

						<EditableCell
							isEditing={editingSeriesId === item._id}
							displayValue={item.description || "-"}
							onDoubleClick={() =>
								startEditing(
									item._id,
									{
										name: item.name,
										slug: item.slug,
										description: item.description ?? "",
									},
									"description",
								)
							}
							className="text-muted-foreground"
						>
							<form.Field name="description">
								{(field) => (
									<Input
										ref={descriptionInputRef}
										data-editable-cell="true"
										value={field.state.value}
										disabled={isSavingEdit}
										onChange={(event) => field.handleChange(event.target.value)}
										onBlur={(event) => {
											field.handleBlur();
											handleInputBlur(event);
										}}
										onKeyDown={handleInputKeyDown}
									/>
								)}
							</form.Field>
						</EditableCell>

						<TableCell>
							{new Date(item._creationTime).toLocaleString()}
						</TableCell>
					</TableRow>
				))}
			</PageCard>
			<Outlet />
		</>
	);
}
