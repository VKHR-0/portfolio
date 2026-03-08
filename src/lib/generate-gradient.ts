const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const GRAIN_INTENSITY = 20;

type GradientStop = {
	color: string;
	position: number;
};

type GradientConfig = {
	angleDeg: number;
	stops: Array<GradientStop>;
};

const COLOR_HARMONIES = [
	// Complementary: opposite on the wheel
	(hue: number) => (hue + 180 + randomRange(-15, 15)) % 360,
	// Analogous: nearby hues
	(hue: number) => (hue + randomRange(25, 45)) % 360,
	// Triadic: 120° apart
	(hue: number) => (hue + 120 + randomRange(-10, 10)) % 360,
	// Split-complementary: ~150° apart
	(hue: number) => (hue + 150 + randomRange(-10, 10)) % 360,
] as const;

function randomRange(min: number, max: number): number {
	return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
	return Math.floor(randomRange(min, max + 1));
}

function pickRandom<T>(array: ReadonlyArray<T>): T {
	return array[Math.floor(Math.random() * array.length)];
}

function hsl(h: number, s: number, l: number): string {
	return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

function randomGradientConfig(): GradientConfig {
	const baseHue = randomRange(0, 360);
	const harmony = pickRandom(COLOR_HARMONIES);
	const secondHue = harmony(baseHue);
	// Midpoint hue for a smoother 3–4 stop gradient
	const midHue = (baseHue + secondHue) / 2;

	const baseSat = randomRange(55, 85);
	const baseLit = randomRange(40, 65);

	const stops: Array<GradientStop> = [
		{ color: hsl(baseHue, baseSat, baseLit), position: 0 },
		{
			color: hsl(
				midHue,
				baseSat + randomRange(-8, 8),
				baseLit + randomRange(-10, 5),
			),
			position: randomRange(0.35, 0.55),
		},
		{
			color: hsl(
				secondHue,
				baseSat + randomRange(-10, 5),
				baseLit + randomRange(-8, 8),
			),
			position: 1,
		},
	];

	// ~50% chance of a 4th stop for extra depth
	if (Math.random() > 0.5) {
		const extraHue = (secondHue + randomRange(20, 60)) % 360;
		stops.splice(2, 0, {
			color: hsl(
				extraHue,
				baseSat + randomRange(-5, 5),
				baseLit + randomRange(-5, 10),
			),
			position: randomRange(0.6, 0.8),
		});
	}

	return {
		angleDeg: randomInt(0, 360),
		stops,
	};
}

function renderGradientToCanvas(
	config: GradientConfig,
	width: number,
	height: number,
): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;

	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas 2D context not available");

	// Convert angle to start/end points
	const angleRad = (config.angleDeg * Math.PI) / 180;
	const cx = width / 2;
	const cy = height / 2;
	// Diagonal length so gradient always covers the full canvas
	const diagonal = Math.sqrt(width * width + height * height) / 2;
	const dx = Math.cos(angleRad) * diagonal;
	const dy = Math.sin(angleRad) * diagonal;

	const gradient = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);

	for (const stop of config.stops) {
		gradient.addColorStop(stop.position, stop.color);
	}

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, width, height);

	return canvas;
}

function applyGrain(canvas: HTMLCanvasElement, intensity: number): void {
	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const { data } = imageData;

	// Simple box-muller-ish noise for more natural grain distribution
	for (let i = 0; i < data.length; i += 4) {
		const noise =
			(Math.random() + Math.random() + Math.random() - 1.5) * intensity;
		data[i] = Math.min(255, Math.max(0, data[i] + noise)); // R
		data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise)); // G
		data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise)); // B
		// Alpha unchanged
	}

	ctx.putImageData(imageData, 0, 0);
}

function canvasToFile(canvas: HTMLCanvasElement): Promise<File> {
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (!blob) {
				reject(new Error("Canvas toBlob returned null"));
				return;
			}
			resolve(
				new File([blob], `gradient-${Date.now()}.png`, { type: "image/png" }),
			);
		}, "image/png");
	});
}

export async function generateGradientImage(): Promise<File> {
	const config = randomGradientConfig();
	const canvas = renderGradientToCanvas(config, CANVAS_WIDTH, CANVAS_HEIGHT);
	applyGrain(canvas, GRAIN_INTENSITY);
	return canvasToFile(canvas);
}
