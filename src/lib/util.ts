export const clamp = (value: number, min: number, max: number) =>
	Math.max(Math.min(value, max), min);

export const mod = (a: number, b: number) => ((a % b) + b) % b;

export const TAU = 2 * Math.PI;
