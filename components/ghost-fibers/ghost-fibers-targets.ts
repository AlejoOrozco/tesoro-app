import type { Program, Target } from "./ghost-fibers-types";

export function makeTarget(gl: WebGL2RenderingContext): Target {
  return { texture: null, framebuffer: gl.createFramebuffer(), width: 0, height: 0 };
}

export function allocateTarget(
  gl: WebGL2RenderingContext,
  format: number,
  target: Target,
  width: number,
  height: number,
): void {
  if (target.texture && target.width === width && target.height === height) return;
  if (target.texture) gl.deleteTexture(target.texture);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texStorage2D(gl.TEXTURE_2D, 1, format, width, height);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  target.texture = texture;
  target.width = width;
  target.height = height;
}

export function drawPass(
  gl: WebGL2RenderingContext,
  program: Program,
  target: Target,
  source: Target,
  texel: number[],
): void {
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
  gl.viewport(0, 0, target.width, target.height);
  gl.useProgram(program.program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, source.texture);
  gl.uniform1i(program.uniforms.uSource, 0);
  gl.uniform2f(program.uniforms.uTexel, texel[0], texel[1]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
