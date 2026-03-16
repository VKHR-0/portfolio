const SVG_WIDTH = 10;
const SVG_HEIGHT = 10;
const GRAIN_BASE_FREQUENCY = 0.65;
const GRAIN_NUM_OCTAVES = 3;

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

function angleToSVGCoordinates(angleDeg: number): {
	x1: string;
	y1: string;
	x2: string;
	y2: string;
} {
	const angleRad = (angleDeg * Math.PI) / 180;
	const cos = Math.cos(angleRad);
	const sin = Math.sin(angleRad);

	const x1 = ((50 - cos * 50) / 100) * 100;
	const y1 = ((50 - sin * 50) / 100) * 100;
	const x2 = ((50 + cos * 50) / 100) * 100;
	const y2 = ((50 + sin * 50) / 100) * 100;

	return {
		x1: `${x1.toFixed(2)}%`,
		y1: `${y1.toFixed(2)}%`,
		x2: `${x2.toFixed(2)}%`,
		y2: `${y2.toFixed(2)}%`,
	};
}

function renderGradientToSVG(config: GradientConfig): string {
	const { x1, y1, x2, y2 } = angleToSVGCoordinates(config.angleDeg);

	const stops = config.stops
		.map(
			(stop) =>
				`<stop offset="${(stop.position * 100).toFixed(0)}%" stop-color="${stop.color}"/>`,
		)
		.join("\n      ");

	return `<svg width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
      ${stops}
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="${GRAIN_BASE_FREQUENCY}" numOctaves="${GRAIN_NUM_OCTAVES}" stitchTiles="stitch" result="noise"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0" in="noise" result="grain"/>
      <feComposite operator="in" in="grain" in2="SourceGraphic" result="composite"/>
      <feBlend mode="multiply" in="composite" in2="SourceGraphic"/>
    </filter>
  </defs>
  <rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="url(#grad)" filter="url(#grain)"/>
</svg>`;
}

function svgToFile(svgString: string): File {
	const blob = new Blob([svgString], { type: "image/svg+xml" });
	return new File([blob], `gradient-${Date.now()}.svg`, {
		type: "image/svg+xml",
	});
}

export async function generateGradientImage(): Promise<File> {
	const config = randomGradientConfig();
	const svgString = renderGradientToSVG(config);
	return svgToFile(svgString);
}
