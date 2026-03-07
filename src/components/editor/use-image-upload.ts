import type { Editor as TiptapEditor } from "@tiptap/core";
import { useEffect, useRef } from "react";
import {
	DEFAULT_MAX_IMAGE_BYTES,
	UPLOADED_IMAGE_PRELOAD_TIMEOUT_MS,
} from "./constants";
import type {
	ImageFallbackMode,
	ImageUploadHandler,
	ImageUploadResult,
	UploadableImageAttrs,
} from "./types";

const toUploadableAttrs = (attrs: unknown): UploadableImageAttrs => {
	if (!attrs || typeof attrs !== "object") return {};
	return attrs as UploadableImageAttrs;
};

type UseImageUploadOptions = {
	onUploadImage?: ImageUploadHandler;
	imageFallback: ImageFallbackMode;
	maxImageBytes: number;
	onPendingUploadsChange?: (count: number) => void;
};

export type UseImageUploadReturn = {
	insertLocalImageFile: (
		file: File,
		source: "paste" | "drop" | "slash",
		initialAttrs?: { alt?: string; title?: string },
	) => Promise<void>;
	insertImagesFromFiles: (
		files: File[],
		source: "paste" | "drop",
	) => Promise<void>;
};

export function useImageUpload(
	editor: TiptapEditor | null,
	{
		onUploadImage,
		imageFallback,
		maxImageBytes = DEFAULT_MAX_IMAGE_BYTES,
		onPendingUploadsChange,
	}: UseImageUploadOptions,
): UseImageUploadReturn {
	const pendingUploadsRef = useRef(0);
	const objectUrlByUploadIdRef = useRef(new Map<string, string>());
	const expectedBlobByUploadIdRef = useRef(new Map<string, string>());

	useEffect(() => {
		onPendingUploadsChange?.(pendingUploadsRef.current);

		return () => {
			for (const url of objectUrlByUploadIdRef.current.values()) {
				URL.revokeObjectURL(url);
			}
			objectUrlByUploadIdRef.current.clear();
			expectedBlobByUploadIdRef.current.clear();
			pendingUploadsRef.current = 0;
			onPendingUploadsChange?.(0);
		};
	}, [onPendingUploadsChange]);

	const updatePendingUploads = (delta: number): void => {
		pendingUploadsRef.current = Math.max(0, pendingUploadsRef.current + delta);
		onPendingUploadsChange?.(pendingUploadsRef.current);
	};

	const createUploadId = (): string =>
		typeof crypto !== "undefined" && "randomUUID" in crypto
			? crypto.randomUUID()
			: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

	const fileToDataUrl = (file: File): Promise<string> =>
		new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.onerror = () => reject(new Error("Failed to read image file."));
			reader.onload = () => resolve(String(reader.result ?? ""));
			reader.readAsDataURL(file);
		});

	const preloadImageSource = (
		src: string,
		timeoutMs = UPLOADED_IMAGE_PRELOAD_TIMEOUT_MS,
	): Promise<boolean> =>
		new Promise<boolean>((resolve) => {
			const image = new window.Image();
			let settled = false;
			const timeoutId = window.setTimeout(() => {
				if (settled) return;
				settled = true;
				image.onload = null;
				image.onerror = null;
				resolve(false);
			}, timeoutMs);

			const finish = (ok: boolean): void => {
				if (settled) return;
				settled = true;
				window.clearTimeout(timeoutId);
				image.onload = null;
				image.onerror = null;
				resolve(ok);
			};

			image.onerror = () => finish(false);
			image.onload = () => {
				if (typeof image.decode === "function") {
					void image.decode().then(
						() => finish(true),
						// decode errors can still have a usable image after load; keep it non-blocking.
						() => finish(true),
					);
					return;
				}
				finish(true);
			};

			image.src = src;
			if (image.complete && image.naturalWidth > 0) finish(true);
		});

	const findImageNodeByUploadId = (
		currentEditor: TiptapEditor,
		uploadId: string,
	): { pos: number; attrs: UploadableImageAttrs } | null => {
		let match: { pos: number; attrs: UploadableImageAttrs } | null = null;
		currentEditor.state.doc.descendants((node, pos) => {
			if (node.type.name !== "image") return true;
			const attrs = toUploadableAttrs(node.attrs);
			if (attrs.uploadId === uploadId) {
				match = { pos, attrs };
				return false;
			}
			return true;
		});
		return match;
	};

	const finalizeImageUpload = (
		currentEditor: TiptapEditor,
		uploadId: string,
		updater: (
			currentAttrs: UploadableImageAttrs,
		) => UploadableImageAttrs | null,
	): boolean => {
		const match = findImageNodeByUploadId(currentEditor, uploadId);
		if (!match) return false;

		const nextAttrs = updater(match.attrs);
		if (!nextAttrs) return false;

		currentEditor.view.dispatch(
			currentEditor.state.tr.setNodeMarkup(match.pos, undefined, nextAttrs),
		);
		return true;
	};

	const cleanupUpload = (
		uploadId: string,
		options?: { revokeBlob?: boolean },
	): void => {
		const shouldRevoke = options?.revokeBlob ?? true;
		const objectUrl = objectUrlByUploadIdRef.current.get(uploadId);
		if (shouldRevoke && objectUrl) URL.revokeObjectURL(objectUrl);
		if (shouldRevoke) {
			objectUrlByUploadIdRef.current.delete(uploadId);
		}
		expectedBlobByUploadIdRef.current.delete(uploadId);
		updatePendingUploads(-1);
	};

	const insertLocalImageFile = async (
		file: File,
		source: "paste" | "drop" | "slash",
		initialAttrs?: { alt?: string; title?: string },
	): Promise<void> => {
		if (!editor) return;
		if (!file.type.startsWith("image/")) return;

		const uploadId = createUploadId();
		const blobUrl = URL.createObjectURL(file);
		const fallbackAlt = initialAttrs?.alt ?? file.name;

		objectUrlByUploadIdRef.current.set(uploadId, blobUrl);
		expectedBlobByUploadIdRef.current.set(uploadId, blobUrl);
		updatePendingUploads(1);

		editor
			.chain()
			.focus()
			.insertContent({
				type: "image",
				attrs: {
					src: blobUrl,
					alt: fallbackAlt,
					title: initialAttrs?.title,
					uploadId,
					uploading: true,
					uploadError: null,
				},
			})
			.run();

		try {
			let resolved: ImageUploadResult | null = null;
			if (onUploadImage) {
				resolved = await onUploadImage(file, { editor, source });
			} else if (imageFallback === "data-url") {
				if (file.size <= maxImageBytes) {
					resolved = { src: await fileToDataUrl(file), alt: fallbackAlt };
				}
			}

			if (!resolved?.src) {
				finalizeImageUpload(editor, uploadId, (attrs) => ({
					...attrs,
					uploading: false,
					uploadError: "Upload failed",
				}));
				cleanupUpload(uploadId, { revokeBlob: false });
				return;
			}

			const preloaded = await preloadImageSource(resolved.src);
			if (!preloaded) {
				finalizeImageUpload(editor, uploadId, (attrs) => ({
					...attrs,
					uploading: false,
					uploadError: "Image uploaded, but preview failed to load",
				}));
				cleanupUpload(uploadId, { revokeBlob: false });
				return;
			}

			finalizeImageUpload(
				editor,
				uploadId,
				(attrs): UploadableImageAttrs | null => {
					const expectedBlob = expectedBlobByUploadIdRef.current.get(uploadId);
					const currentSrc = typeof attrs.src === "string" ? attrs.src : "";
					if (!expectedBlob || currentSrc !== expectedBlob) return null;

					return {
						...attrs,
						src: resolved.src,
						alt:
							resolved.alt ??
							(typeof attrs.alt === "string" ? attrs.alt : undefined),
						title:
							resolved.title ??
							(typeof attrs.title === "string" ? attrs.title : undefined),
						uploading: false,
						uploadError: null,
						uploadId: null,
					};
				},
			);

			cleanupUpload(uploadId, { revokeBlob: true });
		} catch (error) {
			finalizeImageUpload(editor, uploadId, (attrs) => ({
				...attrs,
				uploading: false,
				uploadError: error instanceof Error ? error.message : "Upload failed",
			}));
			cleanupUpload(uploadId, { revokeBlob: false });
		}
	};

	const insertImagesFromFiles = async (
		files: File[],
		source: "paste" | "drop",
	): Promise<void> => {
		for (const file of files) {
			await insertLocalImageFile(file, source);
		}
	};

	return { insertLocalImageFile, insertImagesFromFiles };
}
