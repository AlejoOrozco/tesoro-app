import { cameraFor } from "./ghost-fibers-camera";
import { BLOOM_LEVELS, CAMERA, INTRO_SECONDS, PLACEMENTS, RIBBON_GAIN, RIBBON_TINT } from "./ghost-fibers-constants";
import { clamp } from "./ghost-fibers-constants";
import { allocateTarget, drawPass } from "./ghost-fibers-targets";
import type { Camera, GhostRuntime, Settings } from "./ghost-fibers-types";

function resolveColors(runtime: GhostRuntime, settings: Settings): void {
  const key = `${settings.glowColor}|${settings.lineColor}|${settings.secondaryColor}|${settings.lightMode}`;
  if (key === runtime.state.colorKey) return;
  runtime.state.colorKey = key;
  runtime.state.glow = toRgb(runtime, settings.glowColor, [0.55, 0.36, 0.96]);
  runtime.state.secondary = settings.secondaryColor
    ? toRgb(runtime, settings.secondaryColor, runtime.state.glow)
    : runtime.state.glow.map((channel) => channel * 0.8);
  if (settings.lineColor) {
    runtime.state.line = toRgb(runtime, settings.lineColor, runtime.state.glow);
    return;
  }
  runtime.state.line = settings.lightMode
    ? runtime.state.glow
    : runtime.state.glow.map((channel) => channel + (1 - channel) * 0.72);
}

function toRgb(runtime: GhostRuntime, value: string, fallback: number[]): number[] {
  const probeContext = runtime.probeContext;
  if (!probeContext || !value) return fallback;
  const css = /^[0-9a-f]{3,8}$/i.test(value) ? `#${value}` : value;
  probeContext.clearRect(0, 0, 1, 1);
  probeContext.fillStyle = "#000000";
  probeContext.fillStyle = css;
  probeContext.fillRect(0, 0, 1, 1);
  const [red, green, blue] = probeContext.getImageData(0, 0, 1, 1).data;
  return [red / 255, green / 255, blue / 255];
}

function introEase(runtime: GhostRuntime, settings: Settings): number {
  const intro = settings.paused || runtime.reduce ? 1 : clamp(runtime.state.intro / INTRO_SECONDS, 0, 1);
  return 1 - (1 - intro) * (1 - intro) * (1 - intro);
}

function drawRibbons(
  runtime: GhostRuntime,
  settings: Settings,
  camera: Camera,
  ratio: number,
  easedIntro: number,
): void {
  const { gl, canvas, state, dots } = runtime;
  const dotsPerFiber = Math.round(260 * settings.density);
  const blurCap = 22 * clamp(Math.sqrt(56000 / (settings.threads * dotsPerFiber * settings.layers)), 0.45, 1);
  const area = Math.max(0.8 * settings.thickness, 0.45) ** 2 / 0.64;
  const load = Math.pow((settings.threads / 72) * settings.density * area, -0.75);
  gl.useProgram(dots.program);
  const u = dots.uniforms;
  gl.uniform1f(u.uTime, state.time);
  gl.uniform1f(u.uTwist, settings.twist);
  gl.uniform1f(u.uRoll, state.roll);
  gl.uniform1f(u.uWaves, settings.waves);
  gl.uniform1f(u.uWidth, 0.62 * settings.spread);
  gl.uniformMatrix3fv(u.uOrient, false, camera.orient);
  gl.uniform1f(u.uScale, settings.scale * state.fit);
  gl.uniformMatrix4fv(u.uViewProj, false, camera.viewProj);
  gl.uniform3f(u.uEye, camera.eye[0], camera.eye[1], camera.eye[2]);
  gl.uniform2f(u.uViewport, canvas.width, canvas.height);
  gl.uniform1f(u.uDpr, ratio);
  gl.uniform1f(u.uFibers, settings.threads);
  gl.uniform1f(u.uDots, dotsPerFiber);
  gl.uniform1f(u.uFlow, state.flow);
  gl.uniform1f(u.uSize, 1.6 * settings.thickness);
  gl.uniform1f(u.uFocus, state.focus);
  gl.uniform1f(u.uDof, settings.depthOfField);
  gl.uniform1f(u.uMaxCoc, blurCap);
  gl.uniform1f(u.uFocal, CAMERA);
  gl.uniform1f(u.uIntro, easedIntro);
  gl.uniform4f(u.uPulse, state.pulse.s, state.pulse.age, state.pulse.strength, state.pulse.ribbon);
  gl.uniform4f(
    u.uHover,
    state.hover.x * ratio,
    (state.height - state.hover.y) * ratio,
    140 * ratio,
    state.hover.presence * settings.mouseStrength,
  );
  gl.uniform1f(u.uPart, settings.hover === 1 ? 1 : 0);
  gl.uniform1f(u.uDotLength, settings.dotLength);
  gl.uniform1f(u.uSparkle, settings.sparkle);
  gl.uniform1f(u.uDepthSpread, 0.12);
  gl.uniform1f(u.uVolume, settings.volume);
  gl.uniform3f(u.uGlowColor, state.glow[0], state.glow[1], state.glow[2]);
  gl.uniform3f(u.uLineColor, state.line[0], state.line[1], state.line[2]);
  gl.uniform3f(u.uSecondaryColor, state.secondary[0], state.secondary[1], state.secondary[2]);
  gl.uniform1f(u.uTips, settings.tips);
  gl.uniform1f(u.uGradient, settings.gradient);
  gl.uniform1f(u.uFold, settings.foldGlow);
  for (let ribbon = 0; ribbon < settings.layers; ribbon += 1) {
    const place = PLACEMENTS[ribbon];
    gl.uniform1f(u.uRibbon, ribbon);
    gl.uniform4f(u.uPlace, place[0], place[1], place[2], place[3]);
    gl.uniform1f(u.uGain, RIBBON_GAIN[ribbon] * load);
    gl.uniform1f(u.uTint, RIBBON_TINT[ribbon]);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, settings.threads * dotsPerFiber);
  }
}

function drawDust(runtime: GhostRuntime, settings: Settings, camera: Camera, ratio: number, easedIntro: number): void {
  const dustCount = Math.round(420 * settings.particles);
  if (dustCount <= 0) return;
  const { gl, canvas, state, dust } = runtime;
  gl.useProgram(dust.program);
  const d = dust.uniforms;
  gl.uniformMatrix4fv(d.uViewProj, false, camera.viewProj);
  gl.uniform2f(d.uViewport, canvas.width, canvas.height);
  gl.uniform1f(d.uDpr, ratio);
  gl.uniform1f(d.uTime, state.time);
  gl.uniform1f(d.uSize, 2.2 * settings.thickness);
  gl.uniform1f(d.uFocus, state.focus);
  gl.uniform1f(d.uDof, settings.depthOfField);
  gl.uniform1f(d.uMaxCoc, 22);
  gl.uniform1f(d.uFocal, CAMERA);
  gl.uniform1f(d.uIntro, easedIntro);
  gl.uniform1f(d.uSparkle, settings.sparkle);
  gl.uniform1f(d.uScale, settings.scale * state.fit);
  gl.uniform1f(d.uGradient, settings.gradient);
  gl.uniform1f(d.uGain, 1 / settings.thickness);
  gl.uniform3f(d.uGlowColor, state.glow[0], state.glow[1], state.glow[2]);
  gl.uniform3f(d.uLineColor, state.line[0], state.line[1], state.line[2]);
  gl.uniform3f(d.uSecondaryColor, state.secondary[0], state.secondary[1], state.secondary[2]);
  gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, dustCount);
}

function drawBloom(runtime: GhostRuntime, settings: Settings): boolean {
  const blooming = settings.glow > 0.001 && !settings.lightMode;
  const { gl, canvas, scene, chain, bright, down, up } = runtime;
  gl.bindVertexArray(runtime.vao);
  if (!blooming) return false;
  chain.forEach((target, index) => {
    allocateTarget(
      gl,
      runtime.format,
      target,
      Math.max(1, Math.round(canvas.width / 2 ** (index + 1))),
      Math.max(1, Math.round(canvas.height / 2 ** (index + 1))),
    );
  });
  drawPass(gl, bright, chain[0], scene, [0.5 / scene.width, 0.5 / scene.height]);
  for (let index = 1; index < BLOOM_LEVELS; index += 1) {
    drawPass(gl, down, chain[index], chain[index - 1], [1 / chain[index - 1].width, 1 / chain[index - 1].height]);
  }
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  for (let index = BLOOM_LEVELS - 1; index > 0; index -= 1) {
    drawPass(gl, up, chain[index - 1], chain[index], [0.5 / chain[index].width, 0.5 / chain[index].height]);
  }
  gl.disable(gl.BLEND);
  return true;
}

function drawComposite(runtime: GhostRuntime, settings: Settings, ratio: number, blooming: boolean): void {
  const { gl, canvas, scene, chain, composite, state } = runtime;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(composite.program);
  const c = composite.uniforms;
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, scene.texture);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, blooming ? chain[0].texture : scene.texture);
  gl.uniform1i(c.uScene, 0);
  gl.uniform1i(c.uBloom, 1);
  gl.uniform1f(c.uGlow, blooming ? settings.glow : 0);
  gl.uniform1f(c.uBrightness, settings.brightness);
  gl.uniform1f(c.uLightMode, settings.lightMode ? 1 : 0);
  gl.uniform1f(c.uGrain, settings.grain);
  gl.uniform1f(c.uVignette, settings.vignette);
  gl.uniform1f(c.uFrame, state.frame % 977);
  gl.uniform2f(c.uView, canvas.width, canvas.height);
  gl.uniform1f(c.uDpr, ratio);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindVertexArray(null);
}

export function drawGhostFibers(runtime: GhostRuntime): void {
  const settings = runtime.settingsRef.current;
  resolveColors(runtime, settings);
  const camera = cameraFor(runtime, settings);
  runtime.state.camera = camera;
  const ratio = runtime.canvas.height / Math.max(runtime.state.height, 1);
  const easedIntro = introEase(runtime, settings);
  const { gl, canvas, scene } = runtime;
  allocateTarget(gl, runtime.format, scene, canvas.width, canvas.height);
  gl.bindVertexArray(runtime.vao);
  gl.bindFramebuffer(gl.FRAMEBUFFER, scene.framebuffer);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  drawRibbons(runtime, settings, camera, ratio, easedIntro);
  drawDust(runtime, settings, camera, ratio, easedIntro);
  gl.disable(gl.BLEND);
  const blooming = drawBloom(runtime, settings);
  drawComposite(runtime, settings, ratio, blooming);
}
