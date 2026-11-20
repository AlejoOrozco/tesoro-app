import { nearestOnRibbon } from "./ghost-fibers-camera";
import { BLOOM_LEVELS, CAMERA, INTRO_SECONDS, MAX_RENDER_DIM } from "./ghost-fibers-constants";
import { clamp } from "./ghost-fibers-constants";
import { drawGhostFibers } from "./ghost-fibers-draw";
import { link } from "./ghost-fibers-gl";
import { advanceGhostFibers, type FiberLoop } from "./ghost-fibers-motion";
import {
  BRIGHT_FRAGMENT,
  COMPOSITE_FRAGMENT,
  COMPOSITE_UNIFORMS,
  DOT_FRAGMENT,
  DOT_UNIFORMS,
  DOWN_FRAGMENT,
  DUST_UNIFORMS,
  FULLSCREEN,
  PASS_UNIFORMS,
  UP_FRAGMENT,
} from "./ghost-fibers-passes";
import { DOT_VERTEX, DUST_VERTEX } from "./ghost-fibers-programs";
import { makeTarget } from "./ghost-fibers-targets";
import type { FiberState, GhostRuntime, Program, Settings } from "./ghost-fibers-types";

interface WakeRef {
  current: (() => void) | null;
}

export function mountGhostFibers(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  settingsRef: { readonly current: Settings },
  wakeRef: WakeRef,
): () => void {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return () => undefined;

  const programs = linkPrograms(gl);
  if (!programs) return () => undefined;

  const runtime = createRuntime(gl, canvas, container, settingsRef, programs);
  const loop: FiberLoop = { raf: 0, last: 0 };
  let visible = true;
  let alive = true;

  const frame = (now: number): void => {
    loop.raf = 0;
    if (!alive || !visible || document.hidden) return;
    const again = advanceGhostFibers(runtime, loop, now);
    if (again) loop.raf = requestAnimationFrame(frame);
    else loop.last = 0;
  };

  const wake = (): void => {
    if (!loop.raf && alive && visible && !document.hidden) loop.raf = requestAnimationFrame(frame);
  };

  const resize = (): void => {
    resizeCanvas(runtime);
    drawGhostFibers(runtime);
  };

  const onPointerMove = (event: PointerEvent): void => {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    runtime.state.pointer.x = x;
    runtime.state.pointer.y = y;
    runtime.state.pointer.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    wake();
  };

  const onPointerDown = (event: PointerEvent): void => {
    const settings = settingsRef.current;
    if (!settings.mouseInteraction || !settings.pulseOnClick || event.button !== 0 || runtime.reduce) return;
    if (
      event.target instanceof Element &&
      event.target.closest('a, button, input, textarea, select, label, [role="button"]')
    ) {
      return;
    }
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
    const near = nearestOnRibbon(runtime, settings, x, y);
    if (near) runtime.state.pulse = { s: near.s, age: 0, strength: 1, ribbon: near.ribbon };
    wake();
  };

  const onPointerLeave = (): void => {
    runtime.state.pointer.inside = false;
    wake();
  };

  const onVisibility = (): void => {
    loop.last = 0;
    wake();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const intersection = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (!visible) return;
    loop.last = 0;
    wake();
  });
  intersection.observe(container);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown);
  document.documentElement.addEventListener("pointerleave", onPointerLeave);
  document.addEventListener("visibilitychange", onVisibility);
  resize();
  wake();

  wakeRef.current = () => {
    if (!loop.raf) drawGhostFibers(runtime);
    wake();
  };

  return () => {
    alive = false;
    cancelAnimationFrame(loop.raf);
    wakeRef.current = null;
    resizeObserver.disconnect();
    intersection.disconnect();
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerdown", onPointerDown);
    document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    document.removeEventListener("visibilitychange", onVisibility);
    releaseRuntime(runtime);
  };
}

function linkPrograms(gl: WebGL2RenderingContext): Pick<
  GhostRuntime,
  "dots" | "dust" | "bright" | "down" | "up" | "composite"
> | null {
  const linked = [
    link(gl, DOT_VERTEX, DOT_FRAGMENT, DOT_UNIFORMS),
    link(gl, DUST_VERTEX, DOT_FRAGMENT, DUST_UNIFORMS),
    link(gl, FULLSCREEN, BRIGHT_FRAGMENT, PASS_UNIFORMS),
    link(gl, FULLSCREEN, DOWN_FRAGMENT, PASS_UNIFORMS),
    link(gl, FULLSCREEN, UP_FRAGMENT, PASS_UNIFORMS),
    link(gl, FULLSCREEN, COMPOSITE_FRAGMENT, COMPOSITE_UNIFORMS),
  ];
  if (!assertPrograms(linked)) {
    for (const entry of linked) {
      if (entry) gl.deleteProgram(entry.program);
    }
    return null;
  }
  const [dots, dust, bright, down, up, composite] = linked;
  return { dots, dust, bright, down, up, composite };
}

function createRuntime(
  gl: WebGL2RenderingContext,
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  settingsRef: { readonly current: Settings },
  programs: Pick<GhostRuntime, "dots" | "dust" | "bright" | "down" | "up" | "composite">,
): GhostRuntime {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const state: FiberState = {
    time: 0,
    roll: 0,
    flow: 0,
    frame: 0,
    intro: settingsRef.current.intro && !reduce ? 0 : INTRO_SECONDS,
    width: 1,
    height: 1,
    fit: 1,
    colorKey: "",
    glow: [0.55, 0.36, 0.96],
    line: [1, 0.85, 0.98],
    secondary: [0.44, 0.29, 0.77],
    pointer: { x: 0, y: 0, inside: false },
    hover: { x: 0, y: 0, presence: 0, placed: false },
    look: { x: 0, y: 0, vx: 0, vy: 0 },
    focus: CAMERA + settingsRef.current.focusDepth * 3,
    pulse: { s: 0, age: 9, strength: 0, ribbon: 0 },
    camera: null,
  };
  return {
    gl,
    canvas,
    container,
    settingsRef,
    state,
    ...programs,
    scene: makeTarget(gl),
    chain: Array.from({ length: BLOOM_LEVELS }, () => makeTarget(gl)),
    vao: gl.createVertexArray(),
    reduce,
    probeContext: probe.getContext("2d", { willReadFrequently: true }),
    format: gl.getExtension("EXT_color_buffer_float") ? gl.RGBA16F : gl.RGBA8,
  };
}

function resizeCanvas(runtime: GhostRuntime): void {
  const { canvas, container, state, settingsRef } = runtime;
  const settings = settingsRef.current;
  const width = Math.max(1, container.clientWidth);
  const height = Math.max(1, container.clientHeight);
  const baseDpr = Math.min(settings.dpr || window.devicePixelRatio || 1, 2);
  const longest = Math.max(width, height) * baseDpr;
  const ratio = longest > MAX_RENDER_DIM ? (baseDpr * MAX_RENDER_DIM) / longest : baseDpr;
  const pixelWidth = Math.max(1, Math.round(width * ratio));
  const pixelHeight = Math.max(1, Math.round(height * ratio));
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  state.width = width;
  state.height = height;
  state.fit = clamp(width / height / 1.5, 0.6, 1);
}

function releaseRuntime(runtime: GhostRuntime): void {
  const { gl, scene, chain, vao, dots, dust, bright, down, up, composite } = runtime;
  gl.deleteVertexArray(vao);
  for (const target of [scene, ...chain]) {
    if (target.texture) gl.deleteTexture(target.texture);
    gl.deleteFramebuffer(target.framebuffer);
  }
  for (const entry of [dots, dust, bright, down, up, composite]) gl.deleteProgram(entry.program);
}

function assertPrograms(programs: (Program | null)[]): programs is Program[] {
  return programs.every((entry) => entry !== null);
}
