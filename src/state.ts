import {
  createNetwork,
  dataset,
  metrics,
  train,
  xorSolution,
  type Network,
  type Point,
  type Dataset,
} from "./network";
export const lessons = [
  {
    title: "Un seul neurone",
    data: "Deux groupes" as Dataset,
    hidden: 0,
    text: "Avancez de quelques pas. Les poids et le biais déplacent la droite pour séparer les deux groupes.",
  },
  {
    title: "Les limites",
    data: "XOR" as Dataset,
    hidden: 0,
    text: "Aucune droite ne peut séparer ces quatre points. Entraîner plus longtemps ne résout pas cette limite géométrique.",
  },
  {
    title: "Une couche cachée",
    data: "Cercles" as Dataset,
    hidden: 1,
    text: "Ajoutez des neurones avec +, puis entraînez à nouveau. Cliquez sur h₁, h₂… pour explorer leurs activations.",
  },
  {
    title: "Le défi XOR",
    data: "XOR" as Dataset,
    hidden: 2,
    text: "Deux neurones cachés suffisent à représenter le XOR. Comparez un entraînement avec une solution préparée.",
  },
];
export type BatchSize = number | "all";
const batchStart = () => ({
  batchOrder: [] as string[],
  batchCursor: 0,
  batchSeed: 7919,
  lastBatch: [] as string[],
  epochs: 0,
  samplesSeen: 0,
});

// Fisher–Yates with state-owned randomness keeps reducer calls pure and reproducible.
function shuffled(ids: string[], seed: number) {
  const order = [...ids];
  for (let i = order.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = Math.floor((seed / 4294967296) * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { order, seed };
}
export type State = {
  points: Point[];
  net: Network;
  lesson: number;
  data: Dataset | null;
  step: number;
  history: number[];
  playing: boolean;
  inspected: number | null;
  selected: string | null;
  memory: number;
  prepared: boolean;
  batchSize: BatchSize;
  batchOrder: string[];
  batchCursor: number;
  batchSeed: number;
  lastBatch: string[];
  epochs: number;
  samplesSeen: number;
};
export type Action =
  | { type: "step"; rate: number; count?: number }
  | { type: "batch-size"; value: BatchSize }
  | { type: "play"; value: boolean }
  | { type: "architecture"; hidden: number }
  | { type: "lesson"; index: number }
  | { type: "load-example" }
  | { type: "dataset"; name: Dataset }
  | { type: "points"; points: Point[] }
  | { type: "reset" }
  | { type: "solution" }
  | { type: "inspect"; index: number | null }
  | { type: "select"; id: string | null };
export const fresh = (points: Point[], hidden = 0) => {
  const net = createNetwork(hidden);
  return {
    ...batchStart(),
    net,
    points,
    step: 0,
    history: [metrics(net, points).loss],
    playing: false,
    inspected: null,
    selected: null,
    prepared: false,
  };
};
export function initial(points = dataset("Deux groupes")): State {
  return {
    ...fresh(points),
    lesson: 0,
    data: "Deux groupes",
    memory: 1,
    batchSize: "all",
  };
}
export function reducer(s: State, a: Action): State {
  if (
    a.type === "batch-size" &&
    a.value !== "all" &&
    (!Number.isInteger(a.value) || a.value < 1)
  )
    return s;
  const next = reduce(s, a);
  // The rightmost slider position always means all, including after data edits.
  return next.batchSize !== "all" && next.batchSize >= next.points.length
    ? { ...next, batchSize: "all" }
    : next;
}
function reduce(s: State, a: Action): State {
  switch (a.type) {
    case "step": {
      if (!s.points.length) return s;
      let net = s.net;
      let {
        batchOrder,
        batchCursor,
        batchSeed,
        lastBatch,
        epochs,
        samplesSeen,
      } = s;
      const byId = new Map(s.points.map((p) => [p.id, p]));
      const losses: number[] = [];
      const count = a.count ?? 1;
      for (let i = 0; i < count; i++) {
        if (!batchOrder.length || batchCursor >= batchOrder.length) {
          const next = shuffled(
            s.points.map((p) => p.id),
            batchSeed,
          );
          batchOrder = next.order;
          batchSeed = next.seed;
          batchCursor = 0;
        }
        const size = s.batchSize === "all" ? s.points.length : s.batchSize;
        lastBatch = batchOrder.slice(batchCursor, batchCursor + size);
        batchCursor += lastBatch.length;
        const batch = lastBatch.map((id) => byId.get(id)!);
        samplesSeen += batch.length;
        if (batchCursor === s.points.length) epochs++;
        net = train(net, batch, a.rate);
        losses.push(metrics(net, s.points).loss);
      }
      return {
        ...s,
        net,
        step: s.step + count,
        history: [...s.history, ...losses],
        prepared: false,
        batchOrder,
        batchCursor,
        batchSeed,
        lastBatch,
        epochs,
        samplesSeen,
      };
    }
    case "batch-size":
      return { ...s, batchSize: a.value, playing: false };
    case "play":
      return { ...s, playing: a.value && s.points.length > 0 };
    case "architecture":
      if (!Number.isInteger(a.hidden) || a.hidden < 0 || a.hidden > 32)
        return s;
      return {
        ...s,
        ...fresh(s.points, a.hidden),
        memory: a.hidden || s.memory,
      };
    case "lesson": {
      const l = lessons[a.index];
      return {
        ...s,
        ...fresh(s.points, l.hidden),
        lesson: a.index,
        memory: l.hidden || s.memory,
      };
    }
    case "load-example": {
      const lesson = lessons[s.lesson];
      return {
        ...s,
        ...fresh(dataset(lesson.data), lesson.hidden),
        data: lesson.data,
        memory: lesson.hidden || s.memory,
      };
    }
    case "dataset":
      return { ...s, ...fresh(dataset(a.name), s.net.hidden), data: a.name };
    case "points":
      return {
        ...s,
        ...batchStart(),
        points: a.points,
        playing: false,
        step: 0,
        history: [metrics(s.net, a.points).loss],
        data: null,
        prepared: false,
        selected: a.points.some((p) => p.id === s.selected) ? s.selected : null,
      };
    case "reset":
      return { ...s, ...fresh(s.points, s.net.hidden) };
    case "solution": {
      const net = xorSolution(),
        points = s.points;
      return {
        ...s,
        ...fresh(points, 2),
        net,
        history: [metrics(net, points).loss],
        memory: 2,
        prepared: true,
      };
    }
    case "inspect":
      return { ...s, inspected: a.index };
    case "select":
      return { ...s, selected: a.id };
  }
}
