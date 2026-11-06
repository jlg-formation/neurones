import { useEffect, useMemo, useRef, useState } from "react";
import { evaluate, forward, type Network, type Point } from "./network";
export type Tool = "inspect" | "add" | "delete";
const SIZE = 520,
  PAD = 35,
  INNER = 450;
export const toScreen = (v: number) => PAD + ((v + 3) / 6) * INNER;
export const fromScreen = (v: number) => ((v - PAD) / INNER) * 6 - 3;
export function field(
  net: Network,
  index: number | null,
  x: number,
  y: number,
) {
  return evaluate(net, x, y, index);
}
export function contour(net: Network, index: number | null) {
  const n = 80,
    paths: string[] = [];
  const grid = Array.from({ length: n + 1 }, (_, j) =>
    Array.from({ length: n + 1 }, (_, i) =>
      field(net, index, -3 + (i * 6) / n, 3 - (j * 6) / n),
    ),
  );
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const values = [
          grid[j][i],
          grid[j][i + 1],
          grid[j + 1][i + 1],
          grid[j + 1][i],
        ],
        coords = [
          [i, j],
          [i + 1, j],
          [i + 1, j + 1],
          [i, j + 1],
        ];
      const hits: number[][] = [];
      for (let e = 0; e < 4; e++) {
        const next = (e + 1) % 4,
          a = values[e],
          b = values[next];
        if (a >= 0.5 !== b >= 0.5) {
          const t = (0.5 - a) / (b - a);
          hits.push([
            PAD +
              ((coords[e][0] + t * (coords[next][0] - coords[e][0])) * INNER) /
                n,
            PAD +
              ((coords[e][1] + t * (coords[next][1] - coords[e][1])) * INNER) /
                n,
          ]);
        }
      }
      for (let k = 0; k + 1 < hits.length; k += 2)
        paths.push(
          `M${hits[k][0]},${hits[k][1]}L${hits[k + 1][0]},${hits[k + 1][1]}`,
        );
    }
  return paths.join("");
}
export function Plot({
  net,
  points,
  index,
  tool,
  target,
  selected,
  lastBatch,
  showErrors,
  showBatch,
  showBoundary,
  showGradient,
  onPoints,
  onSelect,
}: {
  net: Network;
  points: Point[];
  index: number | null;
  tool: Tool;
  target: 0 | 1;
  selected: string | null;
  lastBatch: string[];
  showErrors: boolean;
  showBatch: boolean;
  showBoundary: boolean;
  showGradient: boolean;
  onPoints: (p: Point[]) => void;
  onSelect: (id: string | null) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    [hover, setHover] = useState<string | null>(null);
  const path = useMemo(
    () => (showBoundary ? contour(net, index) : ""),
    [net, index, showBoundary],
  );
  const batchIds = useMemo(() => new Set(lastBatch), [lastBatch]);
  useEffect(() => {
    if (!showGradient) return;
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const n = 160,
      image = ctx.createImageData(n, n);
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const v = field(
            net,
            index,
            -3 + ((i + 0.5) * 6) / n,
            3 - ((j + 0.5) * 6) / n,
          ),
          k = (j * n + i) * 4;
        const a = [224, 218, 252],
          b = [210, 242, 226];
        for (let c = 0; c < 3; c++)
          image.data[k + c] = a[c] + (b[c] - a[c]) * v;
        image.data[k + 3] = 255;
      }
    ctx.putImageData(image, 0, 0);
  }, [net, index, showGradient]);
  function position(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * SIZE,
      y: ((e.clientY - r.top) / r.height) * SIZE,
    };
  }
  function nearest(x: number, y: number) {
    let best: Point | undefined,
      d = 14;
    for (const p of points) {
      const dist = Math.hypot(toScreen(p.x) - x, toScreen(-p.y) - y);
      if (dist < d) {
        d = dist;
        best = p;
      }
    }
    return best;
  }
  return (
    <div className="plot-wrap">
      <canvas
        ref={canvas}
        width={160}
        height={160}
        className="field-canvas"
        hidden={!showGradient}
        aria-hidden="true"
      />
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className={`plot tool-${tool}`}
        role="img"
        aria-label={
          index === null
            ? "Plan interactif des prédictions"
            : `Carte d’activation du neurone h${index + 1}`
        }
        onPointerLeave={() => setHover(null)}
        onPointerMove={(e) => {
          const p = position(e);
          setHover(nearest(p.x, p.y)?.id ?? null);
        }}
        onPointerDown={(e) => {
          const p = position(e);
          if (p.x < PAD || p.x > PAD + INNER || p.y < PAD || p.y > PAD + INNER)
            return;
          const hit = nearest(p.x, p.y);
          if (tool === "add")
            onPoints([
              ...points,
              {
                id: crypto.randomUUID(),
                x: fromScreen(p.x),
                y: -fromScreen(p.y),
                target,
              },
            ]);
          else if (tool === "delete") {
            if (hit) onPoints(points.filter((p) => p.id !== hit.id));
          } else onSelect(hit && hit.id !== selected ? hit.id : null);
        }}
      >
        {[-3, -2, -1, 0, 1, 2, 3].map((v) => (
          <g key={v}>
            <line
              x1={toScreen(v)}
              y1={PAD}
              x2={toScreen(v)}
              y2={PAD + INNER}
              className={v === 0 ? "axis" : "grid-line"}
            />
            <line
              x1={PAD}
              y1={toScreen(v)}
              x2={PAD + INNER}
              y2={toScreen(v)}
              className={v === 0 ? "axis" : "grid-line"}
            />
            <text x={toScreen(v)} y={PAD + INNER + 20} textAnchor="middle">
              {v}
            </text>
            <text x={PAD - 12} y={toScreen(-v) + 4} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        <rect
          x={PAD}
          y={PAD}
          width={INNER}
          height={INNER}
          fill="none"
          stroke="#ada9c1"
        />
        {showBoundary && (
          <path
            className="decision-boundary"
            d={path}
            fill="none"
            stroke="#6551d9"
            strokeWidth="2.6"
          />
        )}
        {points.map((p) => {
          const wrong =
            Number(forward(net, p.x, p.y).output >= 0.5) !== p.target;
          return (
            <g key={p.id}>
              {showBatch && batchIds.has(p.id) && (
                <circle
                  className="batch-ring"
                  cx={toScreen(p.x)}
                  cy={toScreen(-p.y)}
                  r="10.5"
                  fill="none"
                  stroke="#2682dd"
                  strokeWidth="2.6"
                >
                  <title>Échantillon utilisé au dernier pas</title>
                </circle>
              )}
              <circle
                cx={toScreen(p.x)}
                cy={toScreen(-p.y)}
                r={selected === p.id || hover === p.id ? 15 : 8}
                fill="none"
                stroke={
                  selected === p.id
                    ? "#6551d9"
                    : hover === p.id && tool === "delete"
                      ? "#e35968"
                      : showErrors && wrong
                        ? "#e8a36b"
                        : "transparent"
                }
                strokeWidth="2"
              />
              <circle
                cx={toScreen(p.x)}
                cy={toScreen(-p.y)}
                r="4.8"
                fill={p.target ? "#fff" : "#242333"}
                stroke="#242333"
                strokeWidth="1.3"
              >
                <title>{`(${p.x.toFixed(2)}, ${p.y.toFixed(2)}) · cible ${p.target}`}</title>
              </circle>
            </g>
          );
        })}
        <text
          x={PAD + INNER / 2}
          y={SIZE - 3}
          textAnchor="middle"
          className="axis-label"
        >
          x₁
        </text>
        <text x="4" y={SIZE / 2 - 16} className="axis-label">
          x₂
        </text>
      </svg>
    </div>
  );
}
export function NetworkDiagram({
  net,
  index,
  onInspect,
}: {
  net: Network;
  index: number | null;
  onInspect: (n: number | null) => void;
}) {
  const n = net.hidden,
    h = Math.max(230, n * 49 + 60),
    mid = h / 2,
    ys = Array.from(
      { length: n },
      (_, j) => 35 + (j * (h - 70)) / Math.max(1, n - 1),
    );
  if (n === 1) ys[0] = mid;
  const inputs = [mid - 43, mid + 43];
  return (
    <svg
      viewBox={`0 0 300 ${h}`}
      className="network-svg"
      aria-label={`2 entrées, ${n} neurones cachés, 1 sortie`}
    >
      {n
        ? ys.flatMap((y, j) => [
            ...inputs.map((a, i) => (
              <line
                key={`i${j}-${i}`}
                x1="40"
                y1={a}
                x2="150"
                y2={y}
                className="connection"
              />
            )),
            <line
              key={`o${j}`}
              x1="150"
              y1={y}
              x2="260"
              y2={mid}
              className="connection"
            />,
          ])
        : inputs.map((y, i) => (
            <line
              key={i}
              x1="40"
              y1={y}
              x2="260"
              y2={mid}
              className="connection"
            />
          ))}
      {inputs.map((y, i) => (
        <g key={i}>
          <circle cx="40" cy={y} r="24" className="input-node" />
          <text x="40" y={y + 5} textAnchor="middle">
            x{i ? "₂" : "₁"}
          </text>
        </g>
      ))}
      {ys.map((y, j) => (
        <g
          key={j}
          role="button"
          tabIndex={0}
          aria-label={`Inspecter le neurone caché h${j + 1}`}
          aria-pressed={index === j}
          onClick={() => onInspect(j)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onInspect(j);
            }
          }}
          className="neuron-button"
        >
          <circle
            cx="150"
            cy={y}
            r="21"
            className={
              index === j ? "hidden-node selected-node" : "hidden-node"
            }
          />
          <text x="150" y={y + 5} textAnchor="middle">
            h{String(j + 1).replace(/\d/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[+d])}
          </text>
        </g>
      ))}
      <g
        role="button"
        tabIndex={0}
        aria-label="Afficher la sortie du réseau"
        onClick={() => onInspect(null)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onInspect(null);
          }
        }}
        className="neuron-button"
      >
        <circle cx="260" cy={mid} r="26" className="output-node" />
        <text x="260" y={mid + 5} textAnchor="middle">
          ŷ
        </text>
      </g>
    </svg>
  );
}
export function LossChart({ values }: { values: number[] }) {
  const max = values.reduce((a, v) => Math.max(a, v), 0.1),
    stride = Math.max(1, Math.ceil(values.length / 500));
  const sample = values
    .map((v, i) => ({ v, i }))
    .filter(({ i }) => i % stride === 0 || i === values.length - 1);
  const path = sample
    .map(
      ({ v, i }, j) =>
        `${j ? "L" : "M"}${(i / Math.max(1, values.length - 1)) * 500},${65 - (v / max) * 60}`,
    )
    .join(" ");
  return (
    <svg
      viewBox="0 0 510 85"
      className="loss-chart"
      role="img"
      aria-label="Évolution de l’erreur moyenne"
    >
      <line x1="0" y1="65" x2="500" y2="65" stroke="#d9d6e8" />
      {values.length > 1 ? (
        <>
          <path d={`${path}L500,65L0,65Z`} fill="#eeebfc" />
          <path d={path} fill="none" stroke="#7866df" strokeWidth="2" />
        </>
      ) : (
        <circle cx="2" cy={65 - (values[0] / max) * 60} r="2" fill="#7866df" />
      )}
      <text x="0" y="82">
        0
      </text>
      <text x="500" y="82" textAnchor="end">
        {values.length - 1} mises à jour
      </text>
    </svg>
  );
}
