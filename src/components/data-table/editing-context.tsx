import * as React from "react";

type EditingContextValue = {
	editingId: null | string;
	startEditing: (id: string) => void;
	stopEditing: () => void;
};

const EditingContext = React.createContext<EditingContextValue | null>(null);

export function EditingProvider({ children }: { children: React.ReactNode }) {
	const [editingId, setEditingId] = React.useState<null | string>(null);

	const startEditing = React.useCallback((id: string) => {
		setEditingId(id);
	}, []);

	const stopEditing = React.useCallback(() => {
		setEditingId(null);
	}, []);

	return (
		<EditingContext.Provider value={{ editingId, startEditing, stopEditing }}>
			{children}
		</EditingContext.Provider>
	);
}

export function useEditing() {
	const context = React.useContext(EditingContext);
	if (!context) {
		throw new Error("useEditing must be used within EditingProvider");
	}
	return context;
}
