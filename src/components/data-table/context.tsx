import * as React from "react";
import type { DataTableContextValue } from "./types";

export const DataTableContext =
	React.createContext<DataTableContextValue | null>(null);

export function useDataTableContext() {
	const context = React.useContext(DataTableContext);

	if (!context) {
		throw new Error("DataTable components must be used within DataTable.Root.");
	}

	return context;
}
