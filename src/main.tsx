import {
  useEffect,
  useId,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import { forward, metrics, type Dataset } from "./network";
import { initial, reducer } from "./state";
import { loadPoints, savePoints } from "./storage";
import { LossChart, NetworkDiagram, Plot, type Tool } from "./visuals";
import "./style.css";
function Button({
  children,
  active,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      aria-pressed={active}
      className={`btn ${active ? "active" : ""} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}
function Panel({
  title,
  tag,
  children,
}: {
  title: string;
  tag?: string;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <h2>
        {tag && <span className="section-icon">{tag}</span>}
        {title}
      </h2>
      {children}
    </section>
  );
}
const f = (n: number) =>
  n.toLocaleString("fr-FR", { maximumFractionDigits: 3 });
function LegendOption({
  label,
  checked,
  onChange,
  children,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="legend-option">
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="legend-option-content">{children}</span>
    </label>
  );
}
function Metric({
  label,
  value,
  explanation,
}: {
  label: string;
  value: string;
  explanation: string;
}) {
  const id = useId();
  return (
    <div className="metric">
      <span>{label}</span>
      <div className="metric-value">
        <strong tabIndex={0} aria-label={label} aria-describedby={id}>
          {value}
        </strong>
        <div id={id} role="tooltip" className="metric-tooltip">
          {explanation}
        </div>
      </div>
    </div>
  );
}
function App() {
  const [loaded] = useState(loadPoints),
    [s, dispatch] = useReducer(
      reducer,
      loaded.points ?? undefined,
      (points) => {
        const state = initial(points);
        return loaded.points ? { ...state, data: null } : state;
      },
    ),
    [storageError, setStorageError] = useState(loaded.error);
  const [tool, setTool] = useState<Tool>("inspect"),
    [target, setTarget] = useState<0 | 1>(0),
    [rate, setRate] = useState(0.5),
    [speed, setSpeed] = useState(15),
    [mobileView, setMobileView] = useState("plot"),
    [showErrors, setShowErrors] = useState(false),
    [showBatch, setShowBatch] = useState(false),
    [showBoundary, setShowBoundary] = useState(true),
    [showGradient, setShowGradient] = useState(true);
  useEffect(() => {
    setStorageError(!savePoints(s.points));
  }, [s.points]);
  useEffect(() => {
    if (!s.playing) return;
    const id = window.setInterval(
      () => dispatch({ type: "step", rate, count: Math.max(1, speed / 60) }),
      Math.max(1000 / 60, 1000 / speed),
    );
    return () => clearInterval(id);
  }, [s.playing, rate, speed]);
  const m = useMemo(() => metrics(s.net, s.points), [s.net, s.points]),
    selected = s.points.find((p) => p.id === s.selected) ?? s.points[0],
    prediction = selected ? forward(s.net, selected.x, selected.y) : null;
  const contradiction = useMemo(
    () =>
      s.points.some((p, i) =>
        s.points
          .slice(i + 1)
          .some((q) => q.x === p.x && q.y === p.y && q.target !== p.target),
      ),
    [s.points],
  );
  return (
    <div className="app-shell" data-view={mobileView}>
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="brand-mark">⌘</div>
          <div>
            <p className="eyebrow">EXPLORER · COMPRENDRE · APPRENDRE</p>
            <h1>Le laboratoire des neurones</h1>
            <p className="subtitle">L’apprentissage devient visible.</p>
          </div>
        </div>
        <span className="local-badge">
          <span /> Tout se passe dans votre navigateur
        </span>
      </header>
      <nav className="mobile-tabs" aria-label="Vues du laboratoire">
        {[
          ["data", "Données et architecture"],
          ["plot", "Plan et entraînement"],
          ["network", "Réseau et calculs"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={mobileView === id}
            onClick={() => setMobileView(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <main className="workspace">
        <aside className="left-column network-column">
          <Panel title="Architecture" tag="♧">
            <div className="segmented">
              <Button
                active={!s.net.hidden}
                onClick={() => dispatch({ type: "architecture", hidden: 0 })}
              >
                Un neurone
              </Button>
              <Button
                active={s.net.hidden > 0}
                onClick={() =>
                  dispatch({ type: "architecture", hidden: s.memory })
                }
              >
                MLP
              </Button>
            </div>
            {s.net.hidden > 0 ? (
              <>
                <label className="counter-label">Neurones cachés</label>
                <div className="counter">
                  <Button
                    aria-label="Retirer un neurone caché"
                    disabled={s.net.hidden <= 1}
                    onClick={() =>
                      dispatch({
                        type: "architecture",
                        hidden: s.net.hidden - 1,
                      })
                    }
                  >
                    −
                  </Button>
                  <strong>{s.net.hidden}</strong>
                  <Button
                    aria-label="Ajouter un neurone caché"
                    disabled={s.net.hidden >= 32}
                    onClick={() =>
                      dispatch({
                        type: "architecture",
                        hidden: s.net.hidden + 1,
                      })
                    }
                  >
                    +
                  </Button>
                </div>
                <p className="footnote">
                  Une couche cachée · activation sigmoïde
                </p>
              </>
            ) : (
              <p className="footnote">
                Deux entrées, une sortie.
                <br />
                Une frontière linéaire.
              </p>
            )}
            <p className="reset-note">
              Changer l’architecture recommence l’entraînement et conserve vos
              points.
            </p>
          </Panel>
          <Panel title="Le réseau" tag="♧">
            <div className="network-labels">
              <span>Entrées</span>
              {s.net.hidden > 0 && <span>Couche cachée</span>}
              <span>Sortie</span>
            </div>
            <div
              className="network-scroll"
              tabIndex={0}
              aria-label="Schéma du réseau"
            >
              <NetworkDiagram
                net={s.net}
                index={s.inspected}
                onInspect={(index) => dispatch({ type: "inspect", index })}
              />
            </div>
            <div className="architecture-caption">
              2 entrées →{" "}
              {s.net.hidden
                ? `${s.net.hidden} caché${s.net.hidden > 1 ? "s" : ""} → `
                : ""}
              1 sortie<small>Activation : sigmoïde</small>
            </div>
            {s.net.hidden > 0 && (
              <p className="footnote">
                Cliquez sur un neurone caché pour voir sa carte d’activation.
              </p>
            )}
          </Panel>
        </aside>
        <aside className="right-column">
          <section className="panel calculations-panel">
            <h2>
              <span className="section-icon">ƒ</span> Les calculs
            </h2>
            <div
              className="calculations"
              tabIndex={0}
              role="region"
              aria-label="Calculs détaillés"
            >
              {selected && prediction ? (
                <>
                  <p className="sample-info">
                    Échantillon{" "}
                    {s.selected ? "sélectionné" : "affiché (premier point)"}
                    <br />
                    x₁ = {f(selected.x)} · x₂ = {f(selected.y)}
                    <br />
                    Cible : <b>{selected.target}</b>
                  </p>
                  {s.net.hidden
                    ? prediction.z.map((z, j) => (
                        <section className="neuron-calculation" key={j}>
                          <h3>
                            Neurone h{j + 1} · {f(prediction.activations[j])}
                          </h3>
                          <p>
                            z = ({f(s.net.weights[j * 3])}) × ({f(selected.x)})
                            + ({f(s.net.weights[j * 3 + 1])}) × ({f(selected.y)}
                            ) + ({f(s.net.weights[j * 3 + 2])}) = {f(z)}
                          </p>
                          <p>h = σ(z) = {f(prediction.activations[j])}</p>
                        </section>
                      ))
                    : null}
                  <p className="formula">
                    {s.net.hidden ? "zₒ = Σ vⱼhⱼ + bₒ" : "zₒ = w₁x₁ + w₂x₂ + b"}
                  </p>
                  <p>
                    {s.net.hidden
                      ? `Poids de sortie : ${s.net.weights
                          .slice(s.net.hidden * 3, s.net.hidden * 4)
                          .map(f)
                          .join(
                            " ; ",
                          )} · biais ${f(s.net.weights[s.net.hidden * 4])}`
                      : `w₁ = ${f(s.net.weights[0])} · w₂ = ${f(s.net.weights[1])} · b = ${f(s.net.weights[2])}`}
                  </p>
                  <p className="output-calculation">
                    zₒ ={" "}
                    {s.net.hidden
                      ? prediction.activations
                          .map(
                            (h, j) =>
                              "(" +
                              f(s.net.weights[s.net.hidden * 3 + j]) +
                              ") × (" +
                              f(h) +
                              ")",
                          )
                          .join(" + ") +
                        " + (" +
                        f(s.net.weights[s.net.hidden * 4]) +
                        ")"
                      : "(" +
                        f(s.net.weights[0]) +
                        ") × (" +
                        f(selected.x) +
                        ") + (" +
                        f(s.net.weights[1]) +
                        ") × (" +
                        f(selected.y) +
                        ") + (" +
                        f(s.net.weights[2]) +
                        ")"}
                    <br />
                    zₒ = {f(prediction.outputZ)}
                    <br />ŷ = σ(zₒ) = <b>{f(prediction.output)}</b>
                    <br />
                    Classe prédite : {Number(prediction.output >= 0.5)}
                    <br />
                    Erreur de ce point : {f(metrics(s.net, [selected]).loss)}
                    <br />
                    Erreur moyenne : {f(m.loss)}
                  </p>
                </>
              ) : (
                <p>Ajoutez un point dans le plan pour afficher ses calculs.</p>
              )}
              <p className="footnote">
                σ(z) = 1 / (1 + e⁻ᶻ). Valeurs arrondies à l’affichage.
                L’entraînement utilise{" "}
                {s.batchSize === "all"
                  ? "tous les points"
                  : `des lots de ${s.batchSize} points au maximum`}
                . Les anneaux bleus indiquent le dernier lot.
              </p>
            </div>
          </section>
          <p className="save-status" role="status">
            {storageError
              ? "Sauvegarde locale indisponible. Vous pouvez continuer à expérimenter."
              : loaded.points
                ? "✓ Points restaurés · sauvegarde automatique locale"
                : "✓ Points sauvegardés sur cet appareil"}
          </p>
        </aside>
        <div className="center-column">
          <section className="panel plot-panel">
            <div className="plot-heading">
              <div>
                <p className="eyebrow">
                  {s.inspected === null
                    ? "VUE DU RÉSEAU"
                    : "VUE D’UN NEURONE CACHÉ"}
                </p>
                <h2>
                  <span className="section-icon" aria-hidden="true">
                    ▧
                  </span>
                  {s.inspected === null
                    ? "Frontière de décision"
                    : `Activation de h${s.inspected + 1}`}
                </h2>
              </div>
              <span className="mode-pill">
                {s.net.hidden
                  ? `MLP · ${s.net.hidden} caché${s.net.hidden > 1 ? "s" : ""}`
                  : "Un neurone"}
              </span>
            </div>
            <div className="plot-toolbar">
              <select
                className="dataset-select"
                title="Choisir un dessin prédéfini remplace les points du plan."
                aria-label="Dessins prédéfinis"
                value=""
                onChange={(event) => {
                  const name = event.target.value;
                  if (name === "empty")
                    dispatch({ type: "points", points: [] });
                  else if (name)
                    dispatch({ type: "dataset", name: name as Dataset });
                }}
              >
                <option value="">Choisir un modèle…</option>
                <option value="empty">Modèle vide</option>
                {(["Deux groupes", "XOR", "Cercles"] as Dataset[]).map(
                  (name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ),
                )}
              </select>
              <div
                className="class-buttons joined-buttons"
                role="group"
                aria-label="Classe du point à ajouter"
              >
                <Button active={target === 0} onClick={() => setTarget(0)}>
                  <span className="dot black" />
                  Noir (0)
                </Button>
                <Button active={target === 1} onClick={() => setTarget(1)}>
                  <span className="dot white" />
                  Blanc (1)
                </Button>
              </div>
              <div className="tool-buttons">
                <div
                  className="joined-buttons"
                  role="group"
                  aria-label="Outil du plan"
                >
                  <Button
                    active={tool === "add"}
                    onClick={() => setTool("add")}
                  >
                    ＋ Ajouter
                  </Button>
                  <Button
                    active={tool === "delete"}
                    onClick={() => setTool("delete")}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      aria-hidden="true"
                    >
                      <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
                    </svg>{" "}
                    Supprimer
                  </Button>
                  <Button
                    active={tool === "inspect"}
                    onClick={() => setTool("inspect")}
                    title="Sélectionner un point"
                  >
                    ⌖ Inspecter
                  </Button>
                </div>
              </div>
            </div>
            {s.inspected !== null && (
              <button
                className="back-link"
                onClick={() => dispatch({ type: "inspect", index: null })}
              >
                ← Revenir à la sortie du réseau
              </button>
            )}
            <div className="plot-stage">
              <Plot
                net={s.net}
                points={s.points}
                index={s.inspected}
                tool={tool}
                target={target}
                selected={s.selected}
                lastBatch={s.lastBatch}
                showErrors={showErrors}
                showBatch={showBatch}
                showBoundary={showBoundary}
                showGradient={showGradient}
                onPoints={(points) => dispatch({ type: "points", points })}
                onSelect={(id) => dispatch({ type: "select", id })}
              />
            </div>
            <div
              className="legend"
              role="group"
              aria-label="Options d’affichage"
            >
              <div className="legend-options">
                <LegendOption
                  label="Erreurs de classification"
                  checked={showErrors}
                  onChange={setShowErrors}
                >
                  <span>Erreurs de classification</span>
                </LegendOption>
                <LegendOption
                  label="Dernier lot"
                  checked={showBatch}
                  onChange={setShowBatch}
                >
                  <span className="last-batch">
                    Dernier lot : {s.lastBatch.length} / {s.points.length}{" "}
                    points
                  </span>
                </LegendOption>
              </div>
              <div className="legend-options">
                <LegendOption
                  label="Frontière à 0,5"
                  checked={showBoundary}
                  onChange={setShowBoundary}
                >
                  <span>
                    {s.inspected === null
                      ? "Frontière à 0,5"
                      : "Activation à 0,5"}
                  </span>
                </LegendOption>
                <LegendOption
                  label="Gradient 0 vers 1"
                  checked={showGradient}
                  onChange={setShowGradient}
                >
                  <span>Gradient 0 → 1</span>
                </LegendOption>
              </div>
            </div>
            <p className="footnote">
              {s.points.length} échantillons · modifiables dans le plan
            </p>
            <p className="plot-help">
              {tool === "add"
                ? `Cliquez dans le plan pour ajouter un point ${target ? "blanc (1)" : "noir (0)"}.`
                : tool === "delete"
                  ? "Survolez puis cliquez sur le point à supprimer."
                  : "Cliquez sur un point pour découvrir son calcul."}{" "}
              {showGradient && (
                <>
                  Le fond représente{" "}
                  {s.inspected === null
                    ? "la prédiction du réseau"
                    : "l’activation du neurone"}
                  .
                </>
              )}
            </p>
            {!s.points.length && (
              <p className="notice">
                Ajoutez des points ou chargez un jeu pour commencer.
              </p>
            )}
            {contradiction && (
              <p className="notice">
                Deux points au même endroit ont des cibles opposées : le réseau
                ne peut pas satisfaire les deux.
              </p>
            )}
          </section>
        </div>
        <aside
          className="training-column"
          aria-label="Entraînement et réglages"
        >
          <section className="panel training">
            <div className="training-top">
              <h2>
                <span className="section-icon">▥</span>Entraînement
              </h2>
              <span className="live-status">
                {s.playing ? "● En cours" : "● En pause"}
              </span>
            </div>
            <div className="speed-row">
              <div className="speed-control">
                <label htmlFor="speed">Vitesse</label>
                <input
                  id="speed"
                  type="range"
                  min="0"
                  max="5"
                  value={[1, 5, 15, 60, 180, 600].indexOf(speed)}
                  onChange={(e) =>
                    setSpeed([1, 5, 15, 60, 180, 600][+e.target.value])
                  }
                />
                <span>{speed} pas/s</span>
              </div>
              <div className="batch-control">
                <label htmlFor="batch-size">Batch size</label>
                <input
                  id="batch-size"
                  type="range"
                  min="1"
                  max={Math.max(1, s.points.length)}
                  step="1"
                  disabled={s.points.length <= 1}
                  value={
                    s.batchSize === "all"
                      ? Math.max(1, s.points.length)
                      : s.batchSize
                  }
                  aria-valuetext={
                    s.batchSize === "all"
                      ? `all (${s.points.length} points)`
                      : `${s.batchSize} points`
                  }
                  aria-describedby="batch-value"
                  onChange={(e) =>
                    dispatch({
                      type: "batch-size",
                      value:
                        Number(e.target.value) >= s.points.length
                          ? "all"
                          : Number(e.target.value),
                    })
                  }
                  title="Nombre de points utilisés pour une mise à jour. Changer ce réglage met en pause et conserve les poids."
                />
                <output id="batch-value" htmlFor="batch-size">
                  {s.batchSize === "all"
                    ? `all (${s.points.length})`
                    : s.batchSize}
                </output>
              </div>
            </div>
            <div className="settings learning-settings">
              <label>
                Learning rate{" "}
                <input
                  type="number"
                  title="Taux d’apprentissage : amplitude de chaque ajustement des poids. Une valeur plus grande accélère les changements, mais peut rendre l’apprentissage instable."
                  min="0.001"
                  max="5"
                  step="0.001"
                  value={rate}
                  onChange={(e) => {
                    const n = +e.target.value;
                    if (n >= 0.001 && n <= 5) setRate(n);
                  }}
                />
              </label>
            </div>
            <div className="training-controls">
              <Button
                title="Conserve les points et l’architecture"
                onClick={() => dispatch({ type: "reset" })}
              >
                ↺ Réinitialiser l’entraînement
              </Button>
              <Button
                disabled={!s.points.length}
                onClick={() => {
                  dispatch({ type: "play", value: false });
                  dispatch({ type: "step", rate });
                }}
              >
                ▹ Un pas
              </Button>
              <Button
                className="primary"
                disabled={!s.points.length}
                onClick={() => dispatch({ type: "play", value: !s.playing })}
              >
                {s.playing ? "Ⅱ Pause" : "▶ Lecture"}
              </Button>
            </div>
            <div className="training-results">
              <div className="stats">
                <Metric
                  label="MISES À JOUR"
                  value={s.step.toLocaleString("fr-FR")}
                  explanation="Nombre d’ajustements des poids depuis la réinitialisation. Un clic sur Un pas ajoute une mise à jour, quelle que soit la taille du lot."
                />
                <Metric
                  label="ÉPOQUES TERMINÉES"
                  value={s.epochs.toLocaleString("fr-FR")}
                  explanation="Nombre de passages complets sur tous les points. Chaque point est utilisé une fois par époque, puis les points sont remélangés. Changer le batch size conserve le passage en cours."
                />
                <Metric
                  label="ÉCHANTILLONS TRAITÉS"
                  value={s.samplesSeen.toLocaleString("fr-FR")}
                  explanation="Nombre cumulé de points utilisés pour ajuster les poids, répétitions comprises. Avec 48 points et un lot de 20, les lots 20, 20 et 8 donnent 48 échantillons traités et une époque terminée."
                />
                <Metric
                  label="PASSAGE COURANT"
                  value={s.batchCursor + " / " + s.points.length}
                  explanation="Points déjà parcourus dans le passage actuel. À N / N, le passage est terminé et compté comme une époque ; le prochain pas commence un nouveau mélange. Le dernier lot peut être plus petit, même après un passage à all."
                />
                <Metric
                  label="BIEN CLASSÉS"
                  value={
                    s.points.length ? Math.round(m.accuracy * 100) + " %" : "—"
                  }
                  explanation="Part des échantillons du jeu complet dont la classe prédite correspond à la cible. Ce score n’est pas limité au dernier lot et ne mesure pas la réussite sur des données nouvelles."
                />
                <Metric
                  label="ERREUR MOYENNE"
                  value={s.points.length ? f(m.loss) : "—"}
                  explanation="Entropie croisée binaire moyenne sur tous les points. Une valeur plus faible est meilleure ; elle peut encore diminuer quand tous les points sont correctement classés."
                />
              </div>
              <LossChart values={s.history} />
            </div>
            <p className="footnote">
              Un pas = une mise à jour du lot. Score et erreur sur tous les
              points.
            </p>
          </section>
        </aside>
      </main>
      <footer>
        Le laboratoire des neurones{" "}
        <span>Deux entrées. Des possibilités à explorer.</span>
      </footer>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
