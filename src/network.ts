export type Point = { id: string; x: number; y: number; target: 0 | 1 };
export type Activation = "sigmoid" | "relu";
export type Network = {
  hidden: number;
  weights: number[];
  activation?: Activation;
};
const activate = (z: number, activation: Activation = "sigmoid") =>
  activation === "relu" ? Math.max(0, z) : sigmoid(z);
export const sigmoid = (z: number) =>
  z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));
export function createNetwork(
  hidden = 0,
  activation: Activation = "sigmoid",
): Network {
  let seed = 1257 + hidden;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  return {
    hidden,
    activation,
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
  const activations = z.map((v) => activate(v, net.activation));
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
    return activate(w[j] * x + w[j + 1] * y + w[j + 2], net.activation);
  }
  if (!n) return sigmoid(w[0] * x + w[1] * y + w[2]);
  let z = w[4 * n];
  for (let j = 0; j < n; j++)
    z +=
      w[3 * n + j] *
      activate(w[3 * j] * x + w[3 * j + 1] * y + w[3 * j + 2], net.activation);
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
          d =
            delta *
            net.weights[3 * n + j] *
            (net.activation === "relu" ? Number(f.z[j] > 0) : h * (1 - h));
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
export const datasetNames = [
  "Deux groupes",
  "XOR",
  "Cercles",
  "Lettre A",
  "Lettre S",
  "Lettre C",
  "Deux lunes",
  "Vagues",
  "Damier",
] as const;
export type Dataset = (typeof datasetNames)[number];
export function dataset(name: Dataset): Point[] {
  const point = (x: number, y: number, target: 0 | 1, i: number): Point => ({
    id: `${name}-${i}`,
    x,
    y,
    target,
  });
  const letters: Partial<Record<Dataset, string[]>> = {
    "Lettre A": ["01110", "11011", "11011", "11111", "11011", "11011", "11011"],
    "Lettre S": ["01111", "11000", "11000", "01110", "00011", "00011", "11110"],
    "Lettre C": ["01111", "11000", "11000", "11000", "11000", "11000", "01111"],
  };
  const glyph = letters[name];
  if (glyph) {
    // Surround the letter with background samples to teach its full outline.
    return Array.from({ length: 63 }, (_, i) => {
      const col = i % 7,
        row = Math.floor(i / 7);
      return point(
        (col - 3) * 0.7,
        (4 - row) * 0.6,
        glyph[row - 1]?.[col - 1] === "1" ? 0 : 1,
        i,
      );
    });
  }
  if (name === "Deux lunes")
    return Array.from({ length: 64 }, (_, i) => {
      const target = (i < 32 ? 0 : 1) as 0 | 1;
      const angle = ((i % 32) / 31) * Math.PI;
      const radius = 1.55 + 0.12 * Math.sin(i * 7);
      return point(
        target
          ? 0.8 - radius * Math.cos(angle)
          : -0.8 + radius * Math.cos(angle),
        target
          ? 0.45 - radius * Math.sin(angle)
          : radius * Math.sin(angle) - 0.45,
        target,
        i,
      );
    });
  if (name === "Vagues")
    return Array.from({ length: 72 }, (_, i) => {
      const target = (i < 36 ? 0 : 1) as 0 | 1;
      const x = -2.5 + ((i % 36) / 35) * 5;
      return point(
        x,
        1.1 * Math.sin(x * 1.6) +
          (target ? 0.7 : -0.7) +
          0.12 * Math.sin(i * 9),
        target,
        i,
      );
    });
  if (name === "Damier")
    return Array.from({ length: 81 }, (_, i) => {
      const col = i % 9,
        row = Math.floor(i / 9);
      return point(
        (col - 4) * 0.6,
        (row - 4) * 0.6,
        ((Math.floor(col / 3) + Math.floor(row / 3)) % 2) as 0 | 1,
        i,
      );
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
