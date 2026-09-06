'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Pencil,
  Highlighter,
  Flame,
  Eraser,
  RotateCcw,
  Trash2,
  Minimize2,
  Maximize2,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tool = 'pen' | 'highlighter' | 'laser' | 'eraser';

interface StrokePoint {
  x: number;
  y: number;
}

interface Stroke {
  tool: Tool;
  color: string;
  width: number;
  points: StrokePoint[];
}

interface LaserPoint {
  x: number;
  y: number;
  alpha: number;
}

interface ScreenAnnotationToolbarProps {
  isActive?: boolean;
  onToggleActive?: (active: boolean) => void;
  className?: string;
}

const COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'White', hex: '#ffffff' },
];

const STROKE_WIDTHS = [
  { label: 'S', value: 2 },
  { label: 'M', value: 5 },
  { label: 'L', value: 10 },
];

export function ScreenAnnotationToolbar({
  isActive = true,
  onToggleActive,
  className,
}: ScreenAnnotationToolbarProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentTool, setCurrentTool] = useState<Tool>('pen');
  const [currentColor, setCurrentColor] = useState<string>('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  // Laser pointer glow trail
  const laserTrailRef = useRef<LaserPoint[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Resize canvas to match parent container dynamically
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          canvas.width = width;
          canvas.height = height;
          redrawAll(strokes);
        }
      }
    });

    const parent = canvas.parentElement;
    if (parent) {
      resizeObserver.observe(parent);
    }

    return () => resizeObserver.disconnect();
  }, [strokes]);

  // Redraw persistent strokes
  const redrawAll = useCallback((strokeList: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokeList) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width * 3;
      } else if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = stroke.width * 4;
      } else {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
      }

      ctx.stroke();
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';
    }
  }, []);

  // Laser point animation loop for fading trail
  useEffect(() => {
    if (currentTool !== 'laser') return;

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      redrawAll(strokes);

      // Draw fading laser points
      const trail = laserTrailRef.current;
      for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        p.alpha *= 0.92; // fade factor

        if (p.alpha > 0.05) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6 * p.alpha, 0, Math.PI * 2);
          ctx.fillStyle = currentColor;
          ctx.shadowColor = currentColor;
          ctx.shadowBlur = 12;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1.0;
        }
      }

      // Filter out dead trail points
      laserTrailRef.current = trail.filter((p) => p.alpha > 0.05);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentTool, currentColor, redrawAll, strokes]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isActive) return;
    const { x, y } = getCanvasCoords(e);

    if (currentTool === 'laser') {
      laserTrailRef.current.push({ x, y, alpha: 1.0 });
      return;
    }

    setIsDrawing(true);
    const newStroke: Stroke = {
      tool: currentTool,
      color: currentColor,
      width: strokeWidth,
      points: [{ x, y }],
    };
    setStrokes((prev) => [...prev, newStroke]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    if (currentTool === 'laser') {
      laserTrailRef.current.push({ x, y, alpha: 1.0 });
      return;
    }

    if (!isDrawing) return;

    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const updatedStroke = {
        ...last,
        points: [...last.points, { x, y }],
      };
      const updatedStrokes = [...prev.slice(0, -1), updatedStroke];
      redrawAll(updatedStrokes);
      return updatedStrokes;
    });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleUndo = () => {
    setStrokes((prev) => {
      const next = prev.slice(0, -1);
      redrawAll(next);
      return next;
    });
  };

  const handleClearAll = () => {
    setStrokes([]);
    laserTrailRef.current = [];
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <>
      {/* Interactive Overlay Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className={cn(
          'absolute inset-0 z-20 h-full w-full pointer-events-auto',
          currentTool === 'laser'
            ? 'cursor-crosshair'
            : currentTool === 'eraser'
            ? 'cursor-cell'
            : 'cursor-crosshair',
          !isActive && 'pointer-events-none hidden'
        )}
      />

      {/* Floating Toolbar Container */}
      <div
        className={cn(
          'absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-2xl border border-white/15 bg-black/80 px-3 py-2 shadow-2xl backdrop-blur-xl transition-all',
          className
        )}
      >
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white px-2 py-1 hover:text-indigo-400"
            title="Expand Annotation Toolbar"
          >
            <Pencil className="h-4 w-4 text-indigo-400" />
            <span>Annotate</span>
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        ) : (
          <>
            {/* Tool Selection */}
            <div className="flex items-center gap-1 border-r border-white/10 pr-2">
              {[
                { id: 'pen', label: 'Pen', icon: <Pencil className="h-4 w-4" /> },
                { id: 'highlighter', label: 'Highlighter', icon: <Highlighter className="h-4 w-4" /> },
                { id: 'laser', label: 'Laser Pointer', icon: <Flame className="h-4 w-4 text-rose-400" /> },
                { id: 'eraser', label: 'Eraser', icon: <Eraser className="h-4 w-4" /> },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setCurrentTool(t.id as Tool)}
                  title={t.label}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-xl transition-colors',
                    currentTool === t.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:bg-white/10 hover:text-white'
                  )}
                >
                  {t.icon}
                </button>
              ))}
            </div>

            {/* Colors */}
            <div className="flex items-center gap-1 border-r border-white/10 pr-2">
              {COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setCurrentColor(c.hex)}
                  title={c.name}
                  className={cn(
                    'h-5 w-5 rounded-full transition-transform',
                    currentColor === c.hex
                      ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-black'
                      : 'opacity-70 hover:opacity-100'
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>

            {/* Stroke Width */}
            <div className="flex items-center gap-1 border-r border-white/10 pr-2">
              {STROKE_WIDTHS.map((sw) => (
                <button
                  key={sw.label}
                  onClick={() => setStrokeWidth(sw.value)}
                  className={cn(
                    'h-7 w-7 rounded-lg text-xs font-mono font-bold transition-colors',
                    strokeWidth === sw.value
                      ? 'bg-white/20 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  {sw.label}
                </button>
              ))}
            </div>

            {/* Undo & Clear */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleUndo}
                title="Undo stroke"
                disabled={strokes.length === 0}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                onClick={handleClearAll}
                title="Clear all drawings"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-500/20 hover:text-rose-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <button
                onClick={() => setCollapsed(true)}
                title="Minimize toolbar"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white ml-1"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
