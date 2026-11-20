"use client";

import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import "./hold-button.css";
import type {
  HoldButtonDirection,
  HoldButtonProps,
  HoldButtonStyle,
  HoldGesture,
  HoldInput,
  HoldMotion,
  HoldPhase,
  HoldReleaseOptions,
} from "./hold-button.types";

const TAP_MS = 250;
const HIT_PAD = 10;
const LINEAR = (t: number): number => t;
const EASE_OUT = (t: number): number => 1 - Math.pow(1 - t, 3);

const HoldButton: React.FC<HoldButtonProps> = ({
  children = "Mantén para eliminar",
  doneLabel = "Eliminado",
  icon = null,
  doneIcon = null,
  backgroundColor = "#27272a",
  fillColor = "#853b35",
  textColor = "#f5f5f5",
  fillTextColor = "#ffffff",
  size = "md",
  radius = 8,
  fillDirection = "right",
  holdTime = 2000,
  releaseTime = 200,
  pressScale = 0.97,
  wave = true,
  waveAmplitude = 6,
  glow = true,
  resetAfter = 1200,
  disabled = false,
  onHold,
  onTap,
  className = "",
}) => {
  const [phase, setPhase] = useState<HoldPhase>("idle");
  const [input, setInput] = useState<HoldInput>(null);
  const phaseRef = useRef<HoldPhase>("idle");
  const inputRef = useRef<HoldInput>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const gesture = useRef<HoldGesture>({ pointerId: null, start: 0, rect: null });
  const timers = useRef({ complete: 0, reset: 0 });
  const hintId = useId();

  const go = (next: HoldPhase, kind: HoldInput = null): void => {
    phaseRef.current = next;
    inputRef.current = kind;
    setPhase(next);
    setInput(kind);
  };

  const clearTimers = (): void => {
    clearTimeout(timers.current.complete);
    clearTimeout(timers.current.reset);
  };

  const motion = useRef<HoldMotion>({ raf: 0, p: 0, from: 0, to: 0, start: 0 });
  const drive = (to: number, duration: number, ease: (t: number) => number): void => {
    const current = motion.current;
    cancelAnimationFrame(current.raf);
    current.from = current.p;
    current.to = to;
    current.start = performance.now();
    const step = (now: number): void => {
      const progress = duration > 0 ? Math.min(1, (now - current.start) / duration) : 1;
      current.p = current.from + (current.to - current.from) * ease(progress);
      buttonRef.current?.style.setProperty("--hb-p", current.p.toFixed(4));
      if (progress < 1) {
        current.raf = requestAnimationFrame(step);
        return;
      }
      current.raf = 0;
      if (current.to === 1) complete();
    };
    current.raf = requestAnimationFrame(step);
  };

  const complete = (): void => {
    if (phaseRef.current !== "holding") return;
    if (performance.now() - gesture.current.start < holdTime - 50) return;
    clearTimers();
    go("done", inputRef.current);
    onHold?.();
    if (resetAfter > 0) {
      timers.current.reset = window.setTimeout(() => {
        go("idle");
        drive(0, releaseTime, EASE_OUT);
      }, resetAfter);
    }
  };

  const begin = (kind: HoldInput): boolean => {
    if (disabled || phaseRef.current !== "idle") return false;
    const button = buttonRef.current;
    if (!button) return false;
    gesture.current.start = performance.now();
    gesture.current.rect = button.getBoundingClientRect();
    go("holding", kind);
    drive(1, holdTime, LINEAR);
    timers.current.complete = window.setTimeout(complete, holdTime + 100);
    return true;
  };

  const release = ({ drifted = false }: HoldReleaseOptions = {}): void => {
    if (phaseRef.current !== "holding") return;
    clearTimers();
    const held = performance.now() - gesture.current.start;
    go("idle");
    drive(0, releaseTime, EASE_OUT);
    if (!drifted && held < TAP_MS) onTap?.();
  };
  const releaseRef = useRef(release);
  releaseRef.current = release;

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>): void => {
    if (event.button !== 0 || !event.isPrimary || gesture.current.pointerId !== null) return;
    if (!begin("pointer")) return;
    gesture.current.pointerId = event.pointerId;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch (error: unknown) {
      if (!(error instanceof DOMException)) throw error;
    }
  };

  const endPointer = (event: React.PointerEvent<HTMLButtonElement>, options?: HoldReleaseOptions): void => {
    if (event.pointerId !== gesture.current.pointerId) return;
    gesture.current.pointerId = null;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch (error: unknown) {
      if (!(error instanceof DOMException)) throw error;
    }
    release(options);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>): void => {
    if (event.pointerId !== gesture.current.pointerId) return;
    const rect = gesture.current.rect;
    if (!rect) return;
    const outside =
      event.clientX < rect.left - HIT_PAD ||
      event.clientX > rect.right + HIT_PAD ||
      event.clientY < rect.top - HIT_PAD ||
      event.clientY > rect.bottom + HIT_PAD;
    if (outside) endPointer(event, { drifted: true });
  };

  const handlePointerLeave = (event: React.PointerEvent<HTMLButtonElement>): void => {
    if (event.pointerType !== "touch") endPointer(event, { drifted: true });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === "Escape") {
      if (inputRef.current === "key") release({ drifted: true });
      return;
    }
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (!event.repeat) begin("key");
    }
  };

  const handleKeyUp = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (inputRef.current === "key") release();
    }
  };

  useLayoutEffect(() => {
    const button = buttonRef.current;
    if (!button) return undefined;
    const measure = (): void => {
      button.style.setProperty("--hb-w", `${button.offsetWidth}px`);
      button.style.setProperty("--hb-h", `${button.offsetHeight}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(button);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (phase !== "holding") return undefined;
    const cancel = (): void => releaseRef.current({ drifted: true });
    const onVisibility = (): void => {
      if (document.hidden) cancel();
    };
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [phase]);

  useEffect(() => {
    const pending = timers.current;
    const current = motion.current;
    return () => {
      clearTimeout(pending.complete);
      clearTimeout(pending.reset);
      cancelAnimationFrame(current.raf);
    };
  }, []);

  const direction: HoldButtonDirection = fillDirection === "up" ? "up" : "right";
  const seconds = Math.round(holdTime / 100) / 10;
  const labels = (
    <>
      <span className="hold-button__idle" aria-hidden={phase === "done"}>
        {icon ? <span className="hold-button__icon">{icon}</span> : null}
        {children}
      </span>
      <span className="hold-button__done" aria-hidden={phase !== "done"}>
        {doneIcon ? <span className="hold-button__icon">{doneIcon}</span> : null}
        {doneLabel}
      </span>
    </>
  );

  const cssVars: HoldButtonStyle = {
    "--hb-radius": `${radius}px`,
    "--hb-bg": backgroundColor,
    "--hb-fill": fillColor,
    "--hb-text": textColor,
    "--hb-fill-text": fillTextColor,
    "--hb-hold": `${holdTime}ms`,
    "--hb-cycles": holdTime / 1100,
    "--hb-release": `${releaseTime}ms`,
    "--hb-press": pressScale,
    "--hb-wave": `${wave ? waveAmplitude : 0}px`,
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      disabled={disabled}
      className={`hold-button hold-button--${size}${className ? ` ${className}` : ""}`}
      data-phase={phase}
      data-input={input ?? undefined}
      data-direction={direction}
      data-glow={glow ? "true" : undefined}
      aria-describedby={hintId}
      style={cssVars}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => endPointer(event)}
      onPointerCancel={(event) => endPointer(event, { drifted: true })}
      onLostPointerCapture={(event) => endPointer(event, { drifted: true })}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span className="hold-button__pulse" aria-hidden="true" />
      <span className="hold-button__label">{labels}</span>
      <span className="hold-button__clip" aria-hidden="true">
        <span className="hold-button__fill">
          <span className="hold-button__label hold-button__label--fill">{labels}</span>
        </span>
        <span className="hold-button__crest" aria-hidden="true">
          <span className="hold-button__label hold-button__label--fill">{labels}</span>
        </span>
      </span>
      <span id={hintId} className="hold-button__sr">
        Mantén pulsado {seconds} segundos para confirmar
      </span>
    </button>
  );
};

export { HoldButton };
