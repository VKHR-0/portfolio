import { DataTableActionButton } from "./action-button";
import { DataTableEditableCell } from "./editable-cell";
import { EditingProvider } from "./editing-context";
import { InlineInputCell } from "./inline-input-cell";
import { DataTablePagination } from "./pagination";
import { DataTableRoot } from "./root";
import { DataTableTable } from "./table";

export const DataTable = {
	Root: DataTableRoot,
	Table: DataTableTable,
	Pagination: DataTablePagination,
	ActionButton: DataTableActionButton,
	EditableCell: DataTableEditableCell,
};

export { EditingProvider, InlineInputCell };
