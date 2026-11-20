import { CAMERA, FOV, PLACEMENTS, RIBBON_LENGTH } from "./ghost-fibers-constants";
import { applyMat3, frustum, multiply, orientation } from "./ghost-fibers-gl";
import type { Camera, GhostRuntime, Nearest, Settings } from "./ghost-fibers-types";

export function centerLocal(s: number, t: number, ribbon: number, waves: number): number[] {
  const place = PLACEMENTS[ribbon];
  const ph = place[3];
  const x = s * RIBBON_LENGTH;
  const y =
    waves * (0.52 * Math.sin(x * 0.43 + t * 0.31 + ph) + 0.26 * Math.sin(x * 0.79 - t * 0.23 + 1.3 + ph * 0.7)) +
    place[0] +
    x * place[2];
  const z = waves * 0.65 * Math.sin(x * 0.33 + t * 0.19 + 0.7 + ph * 1.3) + place[1];
  return [x, y, z];
}

export function cameraFor(runtime: GhostRuntime, settings: Settings): Camera {
  const { state } = runtime;
  const aspect = state.width / Math.max(state.height, 1);
  const eye = [0, 0, CAMERA];
  const projection = frustum(FOV, aspect, 0.1, 60);
  const view = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -eye[0], -eye[1], -eye[2], 1];
  const orient = orientation(settings.perspective * 0.85 + state.look.x * 0.22, 0.12 - state.look.y * 0.14, settings.rotation);
  return { eye, viewProj: multiply(projection, view), orient };
}

export function screenOf(runtime: GhostRuntime, camera: Camera, world: number[]): { x: number; y: number; depth: number } {
  const { state } = runtime;
  const m = camera.viewProj;
  const x = m[0] * world[0] + m[4] * world[1] + m[8] * world[2] + m[12];
  const y = m[1] * world[0] + m[5] * world[1] + m[9] * world[2] + m[13];
  const w = m[3] * world[0] + m[7] * world[1] + m[11] * world[2] + m[15];
  return { x: ((x / w) * 0.5 + 0.5) * state.width, y: (0.5 - (y / w) * 0.5) * state.height, depth: w };
}

export function nearestOnRibbon(runtime: GhostRuntime, settings: Settings, px: number, py: number): Nearest | null {
  const camera = runtime.state.camera;
  if (!camera) return null;
  let best: Nearest | null = null;
  for (let ribbon = 0; ribbon < settings.layers; ribbon += 1) {
    for (let i = 0; i <= 96; i += 1) {
      const along = i / 96 - 0.5;
      const local = centerLocal(along, runtime.state.time, ribbon, settings.waves).map(
        (coordinate) => coordinate * settings.scale * runtime.state.fit,
      );
      const world = applyMat3(camera.orient, local);
      const screen = screenOf(runtime, camera, world);
      const gap = Math.hypot(screen.x - px, screen.y - py);
      if (!best || gap < best.gap) best = { gap, s: along, ribbon, depth: screen.depth };
    }
  }
  return best;
}
