import { nearestOnRibbon } from "./ghost-fibers-camera";
import { CAMERA, INTRO_SECONDS } from "./ghost-fibers-constants";
import { drawGhostFibers } from "./ghost-fibers-draw";
import type { GhostRuntime } from "./ghost-fibers-types";

export interface FiberLoop {
  raf: number;
  last: number;
}

export function advanceGhostFibers(runtime: GhostRuntime, loop: FiberLoop, now: number): boolean {
  const { state, settingsRef, reduce } = runtime;
  const settings = settingsRef.current;
  const elapsed = loop.last ? (now - loop.last) / 1000 : 1 / 60;
  const dt = Math.min(0.05, elapsed);
  loop.last = now;
  const moving = !settings.paused && !reduce;
  if (moving) {
    state.frame += 1;
    state.time += dt * settings.speed;
    state.roll += dt * settings.speed * settings.rollSpeed;
    state.flow += dt * settings.flow * 12;
    state.intro += Math.min(elapsed, 1);
  } else if (state.intro < INTRO_SECONDS) {
    state.intro = INTRO_SECONDS;
  }
  state.pulse.age += dt;
  state.pulse.strength = Math.max(0, 1 - state.pulse.age / 1.8) ** 2;
  const step = settlePointer(runtime, dt);
  drawGhostFibers(runtime);
  const { hover, look } = state;
  return (
    moving ||
    Math.abs(step.goal - hover.presence) > 0.002 ||
    Math.abs(step.lookX - look.x) > 0.0002 ||
    Math.abs(step.lookY - look.y) > 0.0002 ||
    Math.abs(step.focusGoal - state.focus) > 0.001 ||
    state.pulse.strength > 0.001
  );
}

interface PointerStep {
  readonly goal: number;
  readonly lookX: number;
  readonly lookY: number;
  readonly focusGoal: number;
}

function settlePointer(runtime: GhostRuntime, dt: number): PointerStep {
  const { state, settingsRef, reduce } = runtime;
  const settings = settingsRef.current;
  const { pointer, hover, look } = state;
  const active = settings.mouseInteraction && pointer.inside && !reduce;
  if (active && !hover.placed) {
    hover.x = pointer.x;
    hover.y = pointer.y;
    hover.placed = true;
  }
  hover.x += (pointer.x - hover.x) * (1 - Math.exp(-dt / 0.08));
  hover.y += (pointer.y - hover.y) * (1 - Math.exp(-dt / 0.08));
  const goal = active ? 1 : 0;
  hover.presence += (goal - hover.presence) * (1 - Math.exp(-dt / (goal > hover.presence ? 0.3 : 0.6)));
  if (!active && hover.presence < 0.001) hover.placed = false;
  const lookX = active ? (pointer.x / state.width - 0.5) * 0.5 : 0;
  const lookY = active ? (0.5 - pointer.y / state.height) * 0.5 : 0;
  look.vx += (30 * (lookX - look.x) - 11 * look.vx) * dt;
  look.vy += (30 * (lookY - look.y) - 11 * look.vy) * dt;
  look.x += look.vx * dt;
  look.y += look.vy * dt;
  const resting = CAMERA + settings.focusDepth * 3;
  let nextFocus = resting;
  if (active && settings.hover === 0) {
    const near = nearestOnRibbon(runtime, settings, hover.x, hover.y);
    if (near) nextFocus = resting + (near.depth - resting) * hover.presence * Math.min(1, settings.mouseStrength);
  }
  state.focus += (nextFocus - state.focus) * (1 - Math.exp(-dt / 0.35));
  return { goal, lookX, lookY, focusGoal: nextFocus };
}
