export const MAX_RENDER_DIM = 2400;
export const BLOOM_LEVELS = 5;
export const INTRO_SECONDS = 2.6;
export const CAMERA = 7.5;
export const FOV = 0.56;
export const RIBBON_LENGTH = 24;
export const RIBBON_TINT = [0, 0.75, 0.35];
export const PLACEMENTS = [
  [0, 0, 0, 0],
  [1.9, -4.6, -0.08, 2.4],
  [-1.05, 2.0, 0.12, 4.1],
];
export const RIBBON_GAIN = [1, 0.5, 0.55];
export const DEG = Math.PI / 180;
export const FOCAL = 1 / (2 * Math.tan(FOV / 2));

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
