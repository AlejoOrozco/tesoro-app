import type { HTMLAttributes } from "react";
import { clamp, DEG } from "./ghost-fibers-constants";

export type GhostFibersFiberStyle = "dots" | "dashes" | "lines";

export type GhostFibersGradient = "depth" | "along" | "across";

export type GhostFibersHoverEffect = "focus" | "part" | "none";

export interface GhostFibersProps extends HTMLAttributes<HTMLDivElement> {
  glowColor?: string;
  lineColor?: string;
  secondaryColor?: string;
  gradient?: GhostFibersGradient;
  speed?: number;
  scale?: number;
  rotation?: number;
  rollSpeed?: number;
  layers?: number;
  waves?: number;
  twist?: number;
  threads?: number;
  volume?: number;
  spread?: number;
  density?: number;
  thickness?: number;
  flow?: number;
  fiberStyle?: GhostFibersFiberStyle;
  tips?: number;
  foldGlow?: number;
  perspective?: number;
  depthOfField?: number;
  focusDepth?: number;
  particles?: number;
  sparkle?: number;
  glow?: number;
  brightness?: number;
  vignette?: number;
  grain?: number;
  mouseInteraction?: boolean;
  hoverEffect?: GhostFibersHoverEffect;
  mouseStrength?: number;
  pulseOnClick?: boolean;
  intro?: boolean;
  lightMode?: boolean;
  paused?: boolean;
  dpr?: number;
}

export interface Settings {
  glowColor: string;
  lineColor: string;
  secondaryColor: string;
  gradient: number;
  speed: number;
  scale: number;
  rotation: number;
  rollSpeed: number;
  layers: number;
  waves: number;
  twist: number;
  threads: number;
  volume: number;
  spread: number;
  density: number;
  thickness: number;
  flow: number;
  dotLength: number;
  tips: number;
  foldGlow: number;
  perspective: number;
  depthOfField: number;
  focusDepth: number;
  particles: number;
  sparkle: number;
  glow: number;
  brightness: number;
  vignette: number;
  grain: number;
  mouseInteraction: boolean;
  hover: number;
  mouseStrength: number;
  pulseOnClick: boolean;
  intro: boolean;
  lightMode: boolean;
  paused: boolean;
  dpr?: number;
}

export type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

export type Target = { texture: WebGLTexture | null; framebuffer: WebGLFramebuffer | null; width: number; height: number };

export type Camera = { eye: number[]; viewProj: number[]; orient: number[] };

export type Nearest = { gap: number; s: number; ribbon: number; depth: number };

export interface FiberState {
  time: number;
  roll: number;
  flow: number;
  frame: number;
  intro: number;
  width: number;
  height: number;
  fit: number;
  colorKey: string;
  glow: number[];
  line: number[];
  secondary: number[];
  pointer: { x: number; y: number; inside: boolean };
  hover: { x: number; y: number; presence: number; placed: boolean };
  look: { x: number; y: number; vx: number; vy: number };
  focus: number;
  pulse: { s: number; age: number; strength: number; ribbon: number };
  camera: Camera | null;
}

export interface GhostRuntime {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  settingsRef: { readonly current: Settings };
  state: FiberState;
  dots: Program;
  dust: Program;
  bright: Program;
  down: Program;
  up: Program;
  composite: Program;
  scene: Target;
  chain: Target[];
  vao: WebGLVertexArrayObject | null;
  reduce: boolean;
  probeContext: CanvasRenderingContext2D | null;
  format: number;
}

const HOVER_EFFECTS: Record<GhostFibersHoverEffect, number> = { focus: 0, part: 1, none: 2 };
const FIBER_STYLES: Record<GhostFibersFiberStyle, number> = { dots: 0, dashes: 0.45, lines: 1 };
const GRADIENTS: Record<GhostFibersGradient, number> = { depth: 0, along: 1, across: 2 };

export function toSettings({
  glowColor = "#8b5cf6",
  lineColor,
  secondaryColor,
  gradient = "depth",
  speed = 0.5,
  scale = 1,
  rotation = 18,
  rollSpeed = 0.15,
  layers = 3,
  waves = 1,
  twist = 1.2,
  threads = 72,
  volume = 0.7,
  spread = 1,
  density = 1,
  thickness = 1,
  flow = 0.4,
  fiberStyle = "dots",
  tips = 0,
  foldGlow = 1,
  perspective = 0.65,
  depthOfField = 0.85,
  focusDepth = 0,
  particles = 0.5,
  sparkle = 0.5,
  glow = 0.8,
  brightness = 1,
  vignette = 0.3,
  grain = 0.06,
  mouseInteraction = true,
  hoverEffect = "focus",
  mouseStrength = 1,
  pulseOnClick = true,
  intro = true,
  lightMode = false,
  paused = false,
  dpr,
}: GhostFibersProps): Settings {
  return {
    glowColor: String(glowColor),
    lineColor: lineColor ? String(lineColor) : "",
    secondaryColor: secondaryColor ? String(secondaryColor) : "",
    gradient: GRADIENTS[gradient] ?? 0,
    speed: Math.max(0, speed),
    scale: clamp(scale, 0.3, 3),
    rotation: rotation * DEG,
    rollSpeed,
    layers: clamp(Math.round(layers), 1, 3),
    waves: Math.max(0, waves),
    twist: Math.max(0, twist),
    threads: clamp(Math.round(threads), 6, 180),
    volume: clamp(volume, 0, 2),
    spread: clamp(spread, 0.2, 3),
    density: clamp(density, 0.2, 3),
    thickness: clamp(thickness, 0.2, 4),
    flow,
    dotLength: FIBER_STYLES[fiberStyle] ?? 0,
    tips: clamp(tips, 0, 1),
    foldGlow: clamp(foldGlow, 0, 3),
    perspective: clamp(perspective, 0, 1),
    depthOfField: clamp(depthOfField, 0, 2),
    focusDepth: clamp(focusDepth, -1, 1),
    particles: clamp(particles, 0, 2),
    sparkle: clamp(sparkle, 0, 2),
    glow: Math.max(0, glow),
    brightness: Math.max(0, brightness),
    vignette: clamp(vignette, 0, 1),
    grain: Math.max(0, grain),
    mouseInteraction,
    hover: HOVER_EFFECTS[hoverEffect] ?? 0,
    mouseStrength: Math.max(0, mouseStrength),
    pulseOnClick,
    intro,
    lightMode,
    paused,
    dpr,
  };
}
