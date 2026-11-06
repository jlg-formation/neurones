import { describe, expect, it } from "vitest";
import {
  createNetwork,
  dataset,
  forward,
  gradient,
  metrics,
  sigmoid,
  train,
  xorSolution,
} from "./network";
import { initial, reducer } from "./state";
import { parsePoints } from "./storage";
import {
  fromScreen,
  toScreen,
  field,
  contour,
  hiddenBoundary,
} from "./visuals";
describe("moteur mathématique", () => {
  it("la grille optimisée correspond à la propagation détaillée", () => {
    for (const n of [0, 1, 3, 8]) {
      const net = createNetwork(n);
      for (const p of dataset("Cercles")) {
        const result = forward(net, p.x, p.y);
        expect(field(net, null, p.x, p.y)).toBeCloseTo(result.output, 14);
        for (let j = 0; j < n; j++)
          expect(field(net, j, p.x, p.y)).toBeCloseTo(
            result.activations[j],
            14,
          );
      }
    }
  });
  it("calcule une propagation connue et reste stable aux extrêmes", () => {
    expect(
      forward({ hidden: 0, weights: [2, -1, 0.5] }, 1, 2).output,
    ).toBeCloseTo(sigmoid(0.5));
    expect(
      forward({ hidden: 1, weights: [1, 2, 0, 3, -1] }, 1, 0).output,
    ).toBeCloseTo(sigmoid(3 * sigmoid(1) - 1));
    expect(sigmoid(-1000)).toBe(0);
    expect(sigmoid(1000)).toBe(1);
    expect(
      metrics({ hidden: 0, weights: [1000, 0, 0] }, [
        { id: "a", x: 1, y: 0, target: 0 },
      ]).loss,
    ).toBe(1000);
  });
  for (const n of [0, 1, 3, 8])
    it(`gradient analytique = différences finies (${n} cachés)`, () => {
      const net = createNetwork(n),
        points = dataset("XOR"),
        g = gradient(net, points),
        epsilon = 1e-5;
      g.forEach((value, i) => {
        const a = { ...net, weights: [...net.weights] },
          b = { ...net, weights: [...net.weights] };
        a.weights[i] += epsilon;
        b.weights[i] -= epsilon;
        expect(value).toBeCloseTo(
          (metrics(a, points).loss - metrics(b, points).loss) / (2 * epsilon),
          7,
        );
      });
    });
  it("résout le XOR avec deux neurones cachés", () =>
    expect(metrics(xorSolution(), dataset("XOR")).accuracy).toBe(1));
  it("apprend les groupes et le XOR depuis une initialisation reproductible", () => {
    for (const [n, name] of [
      [0, "Deux groupes"],
      [2, "XOR"],
    ] as const) {
      let net = createNetwork(n);
      const p = dataset(name),
        before = metrics(net, p).loss;
      for (let i = 0; i < 6000; i++) net = train(net, p, 0.5);
      expect(metrics(net, p).loss).toBeLessThan(before);
      expect(metrics(net, p).accuracy).toBe(1);
    }
  });
  it("utilise le gradient moyen de tous les points", () => {
    const net = createNetwork(3),
      p = dataset("XOR");
    const g = gradient(net, p);
    g.forEach((v, i) =>
      expect(v).toBeCloseTo(
        p.reduce((s, p) => s + gradient(net, [p])[i], 0) / p.length,
        12,
      ),
    );
  });
});
describe("transitions", () => {
  it("réinitialise le réseau et conserve les points en changeant d’architecture", () => {
    let s = initial();
    s = reducer(s, { type: "step", rate: 0.5 });
    s = reducer(s, { type: "play", value: true });
    const points = s.points;
    s = reducer(s, { type: "architecture", hidden: 3 });
    expect(s.points).toBe(points);
    expect(s.step).toBe(0);
    expect(s.playing).toBe(false);
    expect(s.net.hidden).toBe(3);
    expect(s.history).toHaveLength(1);
  });
  it("conserve les poids lors de l’édition et efface une sélection supprimée", () => {
    let s = initial();
    s = reducer(s, { type: "select", id: s.points[0].id });
    const net = s.net;
    s = reducer(s, { type: "points", points: s.points.slice(1) });
    expect(s.net).toBe(net);
    expect(s.selected).toBeNull();
    expect(s.data).toBeNull();
  });
  it("restaure l’étape guidée et charge une solution déclarée", () => {
    let s = reducer(initial(), { type: "lesson", index: 3 });
    expect(s.net.hidden).toBe(2);
    s = reducer(s, { type: "load-example" });
    s = reducer(s, { type: "solution" });
    expect(s.prepared).toBe(true);
    expect(metrics(s.net, s.points).accuracy).toBe(1);
    s = reducer(s, { type: "lesson", index: 0 });
    expect(s.net.hidden).toBe(0);
    expect(s.points).toHaveLength(4);
    s = reducer(s, { type: "load-example" });
    expect(s.points).toHaveLength(40);
  });
});

describe("protection du dessin", () => {
  it("conserve exactement les points personnalisés dans tout le parcours et pour tous les réseaux", () => {
    const points = [
      { id: "noir", x: 0.37, y: -1.29, target: 0 as const },
      { id: "blanc", x: -2.13, y: 0.83, target: 1 as const },
    ];
    let s = reducer(initial(), { type: "points", points });
    for (const index of [1, 2, 3, 0]) {
      s = reducer(s, { type: "lesson", index });
      expect(s.points).toBe(points);
      expect(s.data).toBeNull();
    }
    for (const hidden of [1, 3, 2, 0, 8]) {
      s = reducer(s, { type: "architecture", hidden });
      expect(s.points).toBe(points);
    }
    s = reducer(s, { type: "solution" });
    expect(s.points).toBe(points);
    expect(s.data).toBeNull();
    s = reducer(s, { type: "reset" });
    expect(s.points).toBe(points);
  });
  it("ne charge les points conseillés que sur une action explicite", () => {
    const start = initial();
    let s = reducer(start, { type: "lesson", index: 3 });
    expect(s.points).toBe(start.points);
    expect(s.data).toBe(start.data);
    s = reducer(s, { type: "load-example" });
    expect(s.points).toEqual(dataset("XOR"));
    expect(s.data).toBe("XOR");
    expect(s.net.hidden).toBe(2);
    s = reducer(s, { type: "dataset", name: "Cercles" });
    expect(s.points).toEqual(dataset("Cercles"));
  });
});
describe("persistance et géométrie", () => {
  it("valide le format local et rejette des points corrompus", () => {
    const points = dataset("XOR");
    expect(parsePoints(JSON.stringify({ version: 1, points }))).toEqual(points);
    for (const raw of [
      "oops",
      "{}",
      JSON.stringify({ version: 2, points }),
      JSON.stringify({ version: 1, points: [...points, points[0]] }),
      JSON.stringify({
        version: 1,
        points: [{ id: "x", x: 9, y: 0, target: 1 }],
      }),
    ])
      expect(parsePoints(raw)).toBeNull();
    expect(parsePoints('{"version":1,"points":[]}')).toEqual([]);
  });
  it("convertit les coordonnées sans déformation", () => {
    for (const v of [-3, -1, 0, 0.25, 3])
      expect(fromScreen(toScreen(v))).toBeCloseTo(v, 12);
  });
  it("évalue la carte cachée et produit une frontière réelle", () => {
    const net = createNetwork(3);
    expect(field(net, 1, 0.2, 0.7)).toBe(forward(net, 0.2, 0.7).activations[1]);
    expect(contour({ hidden: 0, weights: [1, 0, 0] }, null)).toContain("M260,");
    expect(contour({ hidden: 0, weights: [0, 0, 2] }, null)).toBe("");
  });
});

describe("lots d’entraînement", () => {
  it("met à jour les poids avec le seul lot et mesure l’erreur sur tout le jeu", () => {
    for (const size of [1, 2, 7, 10, 19, 20, 32, 39, "all"] as const) {
      const before = reducer(initial(), { type: "batch-size", value: size });
      const after = reducer(before, { type: "step", rate: 0.5 });
      const batch = after.lastBatch.map((id) =>
        before.points.find((p) => p.id === id)!,
      );
      expect(batch).toHaveLength(size === "all" ? 40 : size);
      expect(after.net).toEqual(train(before.net, batch, 0.5));
      expect(after.history.at(-1)).toBe(metrics(after.net, after.points).loss);
      expect(after.step).toBe(1);
      expect(reducer(before, { type: "step", rate: 0.5 })).toEqual(after);
    }
  });
  it("parcourt chaque point une fois, garde le dernier lot incomplet et remélange", () => {
    let s = reducer(initial(dataset("Cercles")), {
      type: "batch-size",
      value: 20,
    });
    const ids: string[] = [];
    for (const size of [20, 20, 8]) {
      s = reducer(s, { type: "step", rate: 0.5 });
      expect(s.lastBatch).toHaveLength(size);
      ids.push(...s.lastBatch);
    }
    expect(new Set(ids).size).toBe(48);
    expect([...ids].sort()).toEqual(s.points.map((p) => p.id).sort());
    const order = s.batchOrder;
    s = reducer(s, { type: "step", rate: 0.5 });
    expect(s.lastBatch).toHaveLength(20);
    expect(s.batchOrder).not.toEqual(order);
  });
  it("utilise tous les points disponibles si le lot est plus grand que le jeu", () => {
    let s = reducer(initial(dataset("XOR")), { type: "batch-size", value: 32 });
    for (let i = 0; i < 3; i++) {
      s = reducer(s, { type: "step", rate: 0.5 });
      expect(new Set(s.lastBatch).size).toBe(4);
    }
  });
  it("le lot de taille un visite tous les points sans répétition", () => {
    let s = reducer(initial(), { type: "batch-size", value: 1 });
    const ids: string[] = [];
    for (let i = 0; i < 40; i++) {
      s = reducer(s, { type: "step", rate: 0.5 });
      ids.push(...s.lastBatch);
    }
    expect(new Set(ids).size).toBe(40);
  });
  it("la lecture groupée a le même résultat que les pas individuels", () => {
    const start = reducer(initial(), { type: "batch-size", value: 10 });
    let s = start;
    for (let i = 0; i < 10; i++) s = reducer(s, { type: "step", rate: 0.5 });
    expect(reducer(start, { type: "step", rate: 0.5, count: 10 })).toEqual(s);
  });
  it("changer la taille met en pause et conserve les paramètres, le dernier lot et la progression", () => {
    let s = reducer(initial(), { type: "step", rate: 0.5 });
    s = reducer(s, { type: "play", value: true });
    const before = s;
    s = reducer(s, { type: "batch-size", value: 10 });
    expect(s.playing).toBe(false);
    expect(s.net).toBe(before.net);
    expect(s.history).toBe(before.history);
    expect(s.step).toBe(before.step);
    expect(s.lastBatch).toEqual(before.lastBatch);
    expect(s.batchCursor).toBe(before.batchCursor);
    expect(s.samplesSeen).toBe(before.samplesSeen);
    expect(s.epochs).toBe(before.epochs);
  });
  it("efface les lots aux changements de données ou d’architecture et aux réinitialisations", () => {
    const s = reducer(reducer(initial(), { type: "batch-size", value: 10 }), {
      type: "step",
      rate: 0.5,
    });
    for (const action of [
      { type: "points", points: s.points.slice(1) },
      { type: "architecture", hidden: 3 },
      { type: "dataset", name: "XOR" },
      { type: "lesson", index: 2 },
      { type: "reset" },
      { type: "solution" },
    ] as const) {
      const next = reducer(s, action);
      expect(next.lastBatch).toEqual([]);
      expect(next.batchOrder).toEqual([]);
      expect(next.batchSize).toBe(next.points.length <= 10 ? "all" : 10);
    }
    const empty = reducer(s, { type: "points", points: [] });
    expect(reducer(empty, { type: "step", rate: 0.5 })).toBe(empty);
  });
  it("adapte la taille au nombre de points et conserve le mode all lors des ajouts", () => {
    let s = reducer(initial(), { type: "batch-size", value: 7 });
    s = reducer(s, { type: "points", points: s.points.slice(0, 7) });
    expect(s.batchSize).toBe("all");
    s = reducer(s, { type: "points", points: dataset("Cercles") });
    expect(s.batchSize).toBe("all");
    s = reducer(s, { type: "batch-size", value: 47 });
    expect(s.batchSize).toBe(47);
    s = reducer(s, { type: "batch-size", value: 48 });
    expect(s.batchSize).toBe("all");
    s = reducer(s, { type: "points", points: s.points.slice(0, 1) });
    s = reducer(s, { type: "batch-size", value: 1 });
    expect(s.batchSize).toBe("all");
    s = reducer(s, { type: "points", points: [] });
    expect(s.batchSize).toBe("all");
  });
  it("refuse une taille de lot invalide", () => {
    const s = initial();
    for (const value of [0, -1, 1.5, NaN, Infinity])
      expect(reducer(s, { type: "batch-size", value })).toBe(s);
  });
});

describe("compteurs d’entraînement", () => {
  it("compte 20 + 20 + 8 échantillons comme une époque et trois mises à jour", () => {
    let s = reducer(initial(dataset("Cercles")), {
      type: "batch-size",
      value: 20,
    });
    for (const expected of [20, 40, 48]) {
      s = reducer(s, { type: "step", rate: 0.5 });
      expect(s.samplesSeen).toBe(expected);
      expect(s.batchCursor).toBe(expected);
      expect(s.epochs).toBe(expected === 48 ? 1 : 0);
    }
    expect(s.step).toBe(3);
    s = reducer(s, { type: "step", rate: 0.5 });
    expect(s.samplesSeen).toBe(68);
    expect(s.batchCursor).toBe(20);
    expect(s.epochs).toBe(1);
  });
  it("continue le même passage après plusieurs changements de taille, y compris all", () => {
    let s = reducer(initial(dataset("Cercles")), {
      type: "batch-size",
      value: 20,
    });
    s = reducer(s, { type: "step", rate: 0.5 });
    const first = s.lastBatch;
    s = reducer(s, { type: "batch-size", value: 10 });
    s = reducer(s, { type: "step", rate: 0.5 });
    const second = s.lastBatch;
    expect(s.samplesSeen).toBe(30);
    expect(s.epochs).toBe(0);
    s = reducer(s, { type: "batch-size", value: "all" });
    s = reducer(s, { type: "step", rate: 0.5 });
    expect(s.lastBatch).toHaveLength(18);
    expect(new Set([...first, ...second, ...s.lastBatch]).size).toBe(48);
    expect(s.epochs).toBe(1);
    expect(s.samplesSeen).toBe(48);
    expect(s.step).toBe(3);
    s = reducer(s, { type: "step", rate: 0.5 });
    expect(s.lastBatch).toHaveLength(48);
    expect(s.epochs).toBe(2);
    expect(s.samplesSeen).toBe(96);
  });
  it("réinitialise tous les compteurs quand le jeu ou le réseau change", () => {
    const s = reducer(initial(), { type: "step", rate: 0.5, count: 3 });
    expect(s.epochs).toBe(3);
    expect(s.samplesSeen).toBe(120);
    for (const action of [
      { type: "reset" },
      { type: "points", points: s.points.slice(1) },
      { type: "dataset", name: "XOR" },
      { type: "architecture", hidden: 3 },
      { type: "lesson", index: 2 },
      { type: "solution" },
    ] as const) {
      const next = reducer(s, action);
      expect([
        next.step,
        next.epochs,
        next.samplesSeen,
        next.batchCursor,
      ]).toEqual([0, 0, 0, 0]);
    }
  });
});

describe("activation ReLU", () => {
  it("calcule le gradient et les cartes à partir de ReLU", () => {
    const net = createNetwork(3, "relu"),
      points = dataset("XOR");
    const g = gradient(net, points),
      epsilon = 1e-5;
    for (const p of points) {
      const result = forward(net, p.x, p.y);
      expect(result.activations).toEqual(result.z.map((z) => Math.max(0, z)));
      expect(field(net, null, p.x, p.y)).toBeCloseTo(result.output, 14);
      result.activations.forEach((h, j) =>
        expect(field(net, j, p.x, p.y)).toBe(h),
      );
    }
    g.forEach((v, i) => {
      const a = { ...net, weights: [...net.weights] },
        b = { ...net, weights: [...net.weights] };
      a.weights[i] += epsilon;
      b.weights[i] -= epsilon;
      expect(v).toBeCloseTo(
        (metrics(a, points).loss - metrics(b, points).loss) / (2 * epsilon),
        7,
      );
    });
  });
  it("réinitialise et conserve le choix après changement d’architecture et de données", () => {
    let s = reducer(initial(), { type: "architecture", hidden: 3 });
    s = reducer(s, { type: "step", rate: 0.1 });
    const points = s.points;
    s = reducer(s, { type: "activation", value: "relu" });
    expect(s.points).toBe(points);
    expect(s.step).toBe(0);
    expect(s.playing).toBe(false);
    for (const action of [
      { type: "reset" },
      { type: "architecture", hidden: 4 },
      { type: "dataset", name: "XOR" },
    ] as const) {
      s = reducer(s, action);
      expect(s.net.activation).toBe("relu");
    }
  });
});

describe("frontières cachées", () => {
  it("trace exactement z=0 pour les deux activations", () => {
    for (const activation of ["sigmoid", "relu"] as const) {
      expect(
        hiddenBoundary({ hidden: 1, activation, weights: [1, 0, 0, 1, 0] }, 0),
      ).toBe("M260,485L260,35");
      expect(
        hiddenBoundary({ hidden: 1, activation, weights: [0, 1, 0, 1, 0] }, 0),
      ).toBe("M35,260L485,260");
    }
  });
  it("omet les frontières hors du plan et les neurones constants", () => {
    for (const weights of [
      [1, 0, 4],
      [0, 0, 0],
      [0, 0, 1],
      [1, 1, 6],
    ]) {
      expect(
        hiddenBoundary({ hidden: 1, weights: [...weights, 1, 0] }, 0),
      ).toBe("");
    }
  });
});
