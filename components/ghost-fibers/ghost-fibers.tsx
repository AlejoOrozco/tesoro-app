"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";
import styles from "./ghost-fibers.module.css";
import { mountGhostFibers } from "./ghost-fibers-mount";
import { toSettings, type GhostFibersProps } from "./ghost-fibers-types";

export type {
  GhostFibersFiberStyle,
  GhostFibersGradient,
  GhostFibersHoverEffect,
  GhostFibersProps,
} from "./ghost-fibers-types";

const VISUAL_PROPS = new Set<string>([
  "glowColor",
  "lineColor",
  "secondaryColor",
  "gradient",
  "speed",
  "scale",
  "rotation",
  "rollSpeed",
  "layers",
  "waves",
  "twist",
  "threads",
  "volume",
  "spread",
  "density",
  "thickness",
  "flow",
  "fiberStyle",
  "tips",
  "foldGlow",
  "perspective",
  "depthOfField",
  "focusDepth",
  "particles",
  "sparkle",
  "glow",
  "brightness",
  "vignette",
  "grain",
  "mouseInteraction",
  "hoverEffect",
  "mouseStrength",
  "pulseOnClick",
  "intro",
  "lightMode",
  "paused",
  "dpr",
]);

function domAttributes(props: GhostFibersProps): HTMLAttributes<HTMLDivElement> {
  const attributes: HTMLAttributes<HTMLDivElement> = {};
  for (const [key, value] of Object.entries(props)) {
    if (key === "className" || VISUAL_PROPS.has(key)) continue;
    Object.assign(attributes, { [key]: value });
  }
  return attributes;
}

function GhostFibers(props: GhostFibersProps) {
  const { className = "" } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settings = toSettings(props);
  const settingsRef = useRef(settings);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;
    return mountGhostFibers(container, canvas, settingsRef, wakeRef);
  }, []);

  useEffect(() => {
    settingsRef.current = settings;
    wakeRef.current?.();
  });

  return (
    <div ref={containerRef} className={`${styles.container}${className ? ` ${className}` : ""}`} {...domAttributes(props)}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    </div>
  );
}

export default GhostFibers;
