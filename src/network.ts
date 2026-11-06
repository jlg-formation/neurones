export type Point = { id: string; x: number; y: number; target: 0 | 1 };
export type Network = { hidden: number; weights: number[] };
export const sigmoid = (z: number) =>
  z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));
export function createNetwork(hidden = 0): Network {
  let seed = 1257 + hidden;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  return {
    hidden,
    weights: Array.from(
      { length: hidden ? hidden * 4 + 1 : 3 },
      () => (random() - 0.5) * 2.4,
    ),
  };
}
export function forward(net: Network, x: number, y: number) {
  const w = net.weights;
  const z = Array.from(
    { length: net.hidden },
    (_, j) => w[j * 3] * x + w[j * 3 + 1] * y + w[j * 3 + 2],
  );
  const activations = z.map(sigmoid);
  const outputZ = net.hidden
    ? activations.reduce(
        (s, h, j) => s + h * w[net.hidden * 3 + j],
        w[net.hidden * 4],
      )
    : w[0] * x + w[1] * y + w[2];
  return { z, activations, outputZ, output: sigmoid(outputZ) };
}

/** Allocation-free evaluation for the dense visualization grid. */
export function evaluate(
  net: Network,
  x: number,
  y: number,
  hiddenIndex: number | null = null,
): number {
  const w = net.weights,
    n = net.hidden;
  if (hiddenIndex !== null) {
    const j = hiddenIndex * 3;
    return sigmoid(w[j] * x + w[j + 1] * y + w[j + 2]);
  }
  if (!n) return sigmoid(w[0] * x + w[1] * y + w[2]);
  let z = w[4 * n];
  for (let j = 0; j < n; j++)
    z += w[3 * n + j] * sigmoid(w[3 * j] * x + w[3 * j + 1] * y + w[3 * j + 2]);
  return sigmoid(z);
}
export function metrics(net: Network, points: Point[]) {
  if (!points.length) return { loss: 0, accuracy: 0 };
  let loss = 0,
    correct = 0;
  for (const p of points) {
    const { output, outputZ: z } = forward(net, p.x, p.y);
    loss += Math.max(z, 0) - z * p.target + Math.log1p(Math.exp(-Math.abs(z)));
    correct += Number(Number(output >= 0.5) === p.target);
  }
  return { loss: loss / points.length, accuracy: correct / points.length };
}
export function gradient(net: Network, points: Point[]) {
  const g = net.weights.map(() => 0),
    n = net.hidden;
  if (!points.length) return g;
  for (const p of points) {
    const f = forward(net, p.x, p.y),
      delta = (f.output - p.target) / points.length;
    if (!n) {
      g[0] += delta * p.x;
      g[1] += delta * p.y;
      g[2] += delta;
    } else {
      for (let j = 0; j < n; j++) {
        const h = f.activations[j],
          d = delta * net.weights[3 * n + j] * h * (1 - h);
        g[j * 3] += d * p.x;
        g[j * 3 + 1] += d * p.y;
        g[j * 3 + 2] += d;
        g[3 * n + j] += delta * h;
      }
      g[4 * n] += delta;
    }
  }
  return g;
}
export function train(net: Network, points: Point[], rate: number): Network {
  const g = gradient(net, points);
  return { ...net, weights: net.weights.map((w, i) => w - rate * g[i]) };
}
export const xorSolution = (): Network => ({
  hidden: 2,
  weights: [8, 8, 8, 8, 8, -8, 16, -16, -8],
});
export type Dataset = "Deux groupes" | "XOR" | "Cercles";
export function dataset(name: Dataset): Point[] {
  const point = (x: number, y: number, target: 0 | 1, i: number): Point => ({
    id: `${name}-${i}`,
    x,
    y,
    target,
  });
  if (name === "XOR")
    return [
      [-1, -1, 0],
      [-1, 1, 1],
      [1, -1, 1],
      [1, 1, 0],
    ].map(([x, y, t], i) => point(x, y, t as 0 | 1, i));
  if (name === "Cercles")
    return Array.from({ length: 48 }, (_, i) => {
      const target = (i < 20 ? 0 : 1) as 0 | 1,
        angle = i * 2.399963;
      const r = target
        ? 2.05 + 0.45 * Math.sin(i * 7) ** 2
        : 0.25 + 1.05 * Math.sqrt(i / 20);
      return point(Math.cos(angle) * r, Math.sin(angle) * r, target, i);
    });
  return Array.from({ length: 40 }, (_, i) => {
    const t = (i < 20 ? 0 : 1) as 0 | 1,
      center = t ? 1.4 : -1.4;
    return point(
      center + Math.sin(i * 9.1) * 0.85,
      center + Math.cos(i * 4.7) * 0.85,
      t,
      i,
    );
  });
}
