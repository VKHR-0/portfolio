import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";

type UploadResult = {
	mediaId: Id<"media">;
	url: string;
	storageId: Id<"_storage">;
	slug: string;
};

export function useConvexUpload() {
	const generateUploadUrl = useMutation(api.functions.media.generateUploadUrl);
	const createMedia = useMutation(api.functions.media.createMedia);

	const uploadFile = async (file: File): Promise<UploadResult> => {
		const uploadUrl = await generateUploadUrl();

		const response = await fetch(uploadUrl, {
			method: "POST",
			headers: { "Content-Type": file.type },
			body: file,
		});

		if (!response.ok) {
			throw new Error("File upload failed.");
		}

		const { storageId } = (await response.json()) as {
			storageId: Id<"_storage">;
		};

		const result = await createMedia({
			storageId,
			filename: file.name,
			mimeType: file.type,
			size: file.size,
		});

		if (!result.url) {
			throw new Error("Failed to retrieve uploaded file URL.");
		}

		return {
			mediaId: result._id,
			url: result.url,
			storageId,
			slug: result.slug,
		};
	};

	return { uploadFile };
}
