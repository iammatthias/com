interface Pattern {
	type: 'cells' | 'turing';
	elements: string[];
}

interface PatternData {
	background: string[];
	regions: string[];
	patterns: Pattern[];
}

interface Viewport {
	width: number;
	height: number;
	scale: number;
}

const DESKTOP_VIEWPORT = { width: 650, height: 240, scale: 1 };
const MOBILE_VIEWPORT = { width: 360, height: 240, scale: 0.6 };

export function hashToNumbers(hash: string): number[] {
	const cleanHash = hash.replace('0x', '');
	return Array.from({ length: cleanHash.length / 2 }, (_, i) =>
		parseInt(cleanHash.slice(i * 2, (i + 1) * 2), 16)
	);
}

function scalePoint(x: number, y: number, viewport: Viewport): [number, number] {
	const scaledX = x * viewport.scale;
	const scaledY = y * viewport.scale;
	return [scaledX, scaledY];
}

export function generatePatternData(hash: string, isMobile = false) {
	const numbers = hashToNumbers(hash);
	const viewport = isMobile ? MOBILE_VIEWPORT : DESKTOP_VIEWPORT;

	// Generate background fill pattern
	function generateBackgroundPattern(): string[] {
		const patterns: string[] = [];

		// Adjust grid size based on viewport
		const gridSizeX = Math.floor(viewport.width / 15); // Maintain density ratio
		const gridSizeY = Math.floor(viewport.height / 15);

		for (let x = 0; x < gridSizeX; x++) {
			for (let y = 0; y < gridSizeY; y++) {
				const baseX = (x / (gridSizeX - 1)) * viewport.width;
				const baseY = (y / (gridSizeY - 1)) * viewport.height;
				const offsetX = (numbers[(x + y) % numbers.length] / 255 - 0.5) * 4 * viewport.scale;
				const offsetY = (numbers[(x + y + 1) % numbers.length] / 255 - 0.5) * 4 * viewport.scale;
				const size = (0.15 + (numbers[(x * y) % numbers.length] / 255) * 0.2) * viewport.scale;

				patterns.push(
					`M ${baseX + offsetX},${baseY + offsetY} m ${-size},0 a ${size},${size} 0 1,0 ${size * 2},0 a ${size},${size} 0 1,0 ${-size * 2},0`
				);
			}
		}
		return patterns;
	}

	function generatePrimaryRegions(): { centers: [number, number][]; paths: string[] } {
		const centers: [number, number][] = [];
		const numRegions = 12 + (numbers[0] % 4);

		// Create a grid of centers adjusted for viewport
		const gridSizeX = isMobile ? 3 : 5;
		const gridSizeY = 4;
		const marginX = viewport.width * 0.1;
		const marginY = viewport.height * 0.1;
		const stepX = (viewport.width - 2 * marginX) / (gridSizeX - 1);
		const stepY = (viewport.height - 2 * marginY) / (gridSizeY - 1);

		for (let x = 0; x < gridSizeX; x++) {
			for (let y = 0; y < gridSizeY; y++) {
				const baseX = marginX + x * stepX;
				const baseY = marginY + y * stepY;
				const offsetX = (numbers[(x + y) % numbers.length] / 255 - 0.5) * 15 * viewport.scale;
				const offsetY = (numbers[(x + y + 1) % numbers.length] / 255 - 0.5) * 15 * viewport.scale;
				centers.push([baseX + offsetX, baseY + offsetY]);
			}
		}

		// Add random centers for organic feel
		const extraCenters = numRegions - gridSizeX * gridSizeY;
		for (let i = 0; i < extraCenters; i++) {
			const angle = (numbers[i] / 255) * Math.PI * 2;
			const radius = (20 + (numbers[i + 1] / 255) * 45) * viewport.scale;
			centers.push([
				viewport.width / 2 + Math.cos(angle) * radius,
				viewport.height / 2 + Math.sin(angle) * radius
			]);
		}

		const paths: string[] = centers.map((center, i) => {
			const points: [number, number][] = [];
			const numPoints = 24;

			for (let j = 0; j < numPoints; j++) {
				const angle = (j / numPoints) * Math.PI * 2;
				const noise = (numbers[(i + j) % numbers.length] / 255) * 20 * viewport.scale;
				const baseDistance =
					(35 + (numbers[(i * 2 + j) % numbers.length] / 255) * 25) * viewport.scale;
				const distance = baseDistance + noise;

				points.push([
					center[0] + Math.cos(angle) * distance,
					center[1] + Math.sin(angle) * distance
				]);
			}

			return (
				`M ${points[0][0]},${points[0][1]} ` +
				points
					.slice(1)
					.map((p) => `L ${p[0]},${p[1]}`)
					.join(' ') +
				' Z'
			);
		});

		return { centers, paths };
	}

	function generateCellPacking(regionCenter: [number, number], regionIndex: number): string[] {
		const cells: string[] = [];
		const regionRadius = 55 * viewport.scale;

		// Create dense spiral patterns
		const numSpirals = 4 + (numbers[regionIndex] % 3);
		for (let s = 0; s < numSpirals; s++) {
			const startAngle = (numbers[s * regionIndex] / 255) * Math.PI * 2;
			let angle = startAngle;
			let radius = 1;

			const maxDots = 60;
			let dotCount = 0;

			while (radius < regionRadius && dotCount < maxDots) {
				const angleNoise =
					(numbers[(Math.floor(angle * 5) + s) % numbers.length] / 255 - 0.5) * 0.4;
				const radiusStep = (1.2 + numbers[(s * dotCount) % numbers.length] / 255) * viewport.scale;

				angle += 0.3 + angleNoise;
				radius += radiusStep;

				const px = regionCenter[0] + Math.cos(angle) * radius;
				const py = regionCenter[1] + Math.sin(angle) * radius;

				const dotSize =
					(0.5 + (numbers[(dotCount * s) % numbers.length] / 255) * 0.7) * viewport.scale;

				cells.push(
					`M ${px},${py} m ${-dotSize},0 a ${dotSize},${dotSize} 0 1,0 ${dotSize * 2},0 a ${dotSize},${dotSize} 0 1,0 ${-dotSize * 2},0`
				);

				dotCount++;
			}
		}

		// Add dense scattered fill
		const numScatterDots = 40 + (numbers[regionIndex] % 20);
		for (let i = 0; i < numScatterDots; i++) {
			const angle = (numbers[(regionIndex * i) % numbers.length] / 255) * Math.PI * 2;
			const radius = (numbers[(regionIndex * i + 1) % numbers.length] / 255) * regionRadius;

			const px = regionCenter[0] + Math.cos(angle) * radius;
			const py = regionCenter[1] + Math.sin(angle) * radius;

			const dotSize = (0.3 + (numbers[(i * 3) % numbers.length] / 255) * 0.5) * viewport.scale;

			cells.push(
				`M ${px},${py} m ${-dotSize},0 a ${dotSize},${dotSize} 0 1,0 ${dotSize * 2},0 a ${dotSize},${dotSize} 0 1,0 ${-dotSize * 2},0`
			);
		}

		return cells;
	}

	function generateTuringPattern(regionCenter: [number, number], regionIndex: number): string[] {
		const lines: string[] = [];
		const regionRadius = 55 * viewport.scale;

		const numLines = 15 + (numbers[regionIndex] % 10);
		for (let i = 0; i < numLines; i++) {
			const points: [number, number][] = [];
			let x = regionCenter[0] + (numbers[i] / 255 - 0.5) * regionRadius;
			let y = regionCenter[1] + (numbers[i + 1] / 255 - 0.5) * regionRadius;

			const numSegments = 20 + (numbers[i * 2] % 15);
			for (let j = 0; j < numSegments; j++) {
				points.push([x, y]);

				const angleChange = (numbers[(i * j) % numbers.length] / 255 - 0.5) * Math.PI * 1.8;
				const stepSize = (2.5 + (numbers[(i * j + 1) % numbers.length] / 255) * 4) * viewport.scale;

				x += Math.cos(angleChange) * stepSize;
				y += Math.sin(angleChange) * stepSize;
			}

			if (points.length > 2) {
				const path = points.reduce((acc, point, idx) => {
					if (idx === 0) return `M ${point[0]} ${point[1]}`;
					if (idx % 2 === 0) {
						const prev = points[idx - 1];
						const ctrlX =
							prev[0] +
							(numbers[(idx * regionIndex) % numbers.length] / 255 - 0.5) * 10 * viewport.scale;
						const ctrlY =
							prev[1] +
							(numbers[(idx * regionIndex + 1) % numbers.length] / 255 - 0.5) * 10 * viewport.scale;
						return `${acc} Q ${ctrlX} ${ctrlY}, ${point[0]} ${point[1]}`;
					}
					return acc;
				}, '');
				lines.push(path);
			}
		}

		return lines;
	}

	const primaryRegions = generatePrimaryRegions();
	const backgroundPattern = generateBackgroundPattern();
	const patterns = primaryRegions.centers.map((center, i) => {
		const patternType = numbers[i] > 100; // More cell patterns than turing
		return {
			type: patternType ? 'cells' : 'turing',
			elements: patternType ? generateCellPacking(center, i) : generateTuringPattern(center, i)
		};
	});

	return {
		background: backgroundPattern,
		regions: primaryRegions.paths,
		patterns
	};
}

export function generateColors(hash: string) {
	const numbers = hashToNumbers(hash);
	const palette: string[] = [];

	// Generate fully hash-derived colors
	for (let i = 0; i < 4; i++) {
		const hue = (numbers[i * 3] / 255) * 360;
		const saturation = 60 + (numbers[i * 3 + 1] / 255) * 40; // Range: 60-100%
		const lightness = 20 + (numbers[i * 3 + 2] / 255) * 65; // Range: 20-85%
		palette.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
	}

	// Sort colors by lightness to ensure background is darkest
	return [...palette].sort((a, b) => {
		const getLightness = (color: string) => {
			const match = color.match(/(\d+)%\)/);
			return match ? parseInt(match[1]) : 0;
		};
		return getLightness(a) - getLightness(b);
	});
}
