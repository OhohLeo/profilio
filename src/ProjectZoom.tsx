import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Experience } from "./data";
import { ICON_NAMES, NH, NW, iconOf, type Feature, type FeatureIconType, type Project, type ZNode } from "./projects";

/** Niveau de zoom courant : projet › fonctionnalité › composant. */
export type Zoom = { p: string | null; f: string | null; n: string | null };

const ICONS: Record<FeatureIconType | "person", ReactNode> = {
  service: <><path d="M9 2l6 3.5v7L9 16l-6-3.5v-7z" /><circle cx="9" cy="9" r="2.2" /></>,
  bus: <path d="M2 6h13M12 3l3 3-3 3M16 12H3M6 9l-3 3 3 3" />,
  db: <><ellipse cx="9" cy="4.5" rx="6" ry="2.5" /><path d="M3 4.5v9c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-9M3 9c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5" /></>,
  ui: <><rect x="2" y="3" width="14" height="10" rx="1.5" /><path d="M6 16h6M9 13v3" /></>,
  mobile: <><rect x="5" y="2" width="8" height="14" rx="1.5" /><path d="M8 13.5h2" /></>,
  device: <><circle cx="9" cy="10" r="1.5" /><path d="M5.5 13.5a5 5 0 0 1 0-7M12.5 6.5a5 5 0 0 1 0 7M3 16a8.5 8.5 0 0 1 0-12M15 4a8.5 8.5 0 0 1 0 12" /></>,
  ai: <path d="M9 2l1.8 5.2L16 9l-5.2 1.8L9 16l-1.8-5.2L2 9l5.2-1.8z" />,
  infra: <><rect x="3" y="3" width="12" height="5" rx="1" /><rect x="3" y="10" width="12" height="5" rx="1" /><path d="M5.8 5.5h.01M5.8 12.5h.01" /></>,
  ext: <path d="M5 14a3.5 3.5 0 0 1-.5-7 4.5 4.5 0 0 1 8.7-1 3.8 3.8 0 0 1 .3 8z" />,
  file: <><rect x="3" y="2" width="12" height="14" rx="1" /><path d="M3 7h12M3 11h12M8 7v9" /></>,
  bell: <><path d="M3 12h12l-1.5-2V7a4.5 4.5 0 0 0-9 0v3zM7 15a2 2 0 0 0 4 0" /><path d="M9 1v1.5" /></>,
  chart: <><path d="M2 2v14h14M5 12l3-4 3 2 5-6" /></>,
  sliders: <><path d="M2 5h4m4 0h6M2 13h8m4 0h2" /><circle cx="8" cy="5" r="2" /><circle cx="12" cy="13" r="2" /></>,
  workflow: <><rect x="1.5" y="6" width="5" height="6" rx="1" /><rect x="12" y="1.5" width="4.5" height="5" rx="1" /><rect x="12" y="11.5" width="4.5" height="5" rx="1" /><path d="M6.5 9H9V4h3M9 9v5h3" /></>,
  tool: <path d="M11 2a4 4 0 0 0-4.5 5L2 11.5a2.1 2.1 0 0 0 3 3L9.5 10A4 4 0 0 0 15 5.5l-3 2-2-2z" />,
  calendar: <><rect x="2" y="3.5" width="14" height="12.5" rx="1.5" /><path d="M5 1.5v4m8-4v4M2 7.5h14M5 11h2m3 0h3M5 14h2" /></>,
  person: <><circle cx="9" cy="5.5" r="3.2" /><path d="M3 16c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /></>,
};
const Ico = ({ t }: { t: FeatureIconType | "person" }) => <svg className="ico" viewBox="0 0 18 18" aria-hidden="true">{ICONS[t]}</svg>;

// ---- géométrie ----
type Box = { x: number; y: number };
const RATIO = 760 / 526;

function bbox(boxes: Box[]) {
  const x0 = Math.min(...boxes.map((b) => b.x)), y0 = Math.min(...boxes.map((b) => b.y));
  const x1 = Math.max(...boxes.map((b) => b.x + NW)), y1 = Math.max(...boxes.map((b) => b.y + NH));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
/** Cadre `b` élargi de `pad`, puis étendu au ratio `r` du conteneur. */
function fit(b: { x: number; y: number; w: number; h: number }, r: number, pad: number, minW = 0) {
  let w = Math.max(b.w + 2 * pad, minW), h = b.h + 2 * pad;
  if (w / h < r) w = h * r; else h = w / r;
  return [b.x + b.w / 2 - w / 2, b.y + b.h / 2 - h / 2, w, h];
}
/** Segment entre deux blocs, coupé à leurs bords ; `off` décale pour séparer aller et retour. */
function seg(A: Box, B: Box, off = 0) {
  const ax = A.x + NW / 2, ay = A.y + NH / 2, bx = B.x + NW / 2, by = B.y + NH / 2;
  let dx = bx - ax, dy = by - ay;
  const L = Math.hypot(dx, dy); dx /= L; dy /= L;
  const t = Math.min(dx ? NW / 2 / Math.abs(dx) : 1e9, dy ? NH / 2 / Math.abs(dy) : 1e9);
  const px = -dy * off, py = dx * off;
  return { x1: ax + dx * (t + 2) + px, y1: ay + dy * (t + 2) + py, x2: bx - dx * (t + 3) + px, y2: by - dy * (t + 3) + py, dx, dy, ang: (Math.atan2(dy, dx) * 180) / Math.PI };
}
function wrapLabel(label: string): string[] {
  if (label.length <= 15) return [label];
  let best: { i: number; m: number } | null = null;
  for (let i = 0; i < label.length; i++) if (label[i] === " ") {
    const m = Math.max(i, label.length - i - 1);
    if (!best || m < best.m) best = { i, m };
  }
  return best ? [label.slice(0, best.i), label.slice(best.i + 1)] : [label];
}
function wrapRole(s: string): string[] {
  const out = [""];
  for (const w of s.split(" ")) {
    const l = out[out.length - 1];
    if (l && (l + " " + w).length > 27) out.push(w); else out[out.length - 1] = l ? l + " " + w : w;
  }
  return out;
}
/** Comprime un texte trop long pour sa case plutôt que de le laisser déborder. */
const squeeze = (s: string, max: number, w: number) => (s.length > max ? { textLength: w, lengthAdjust: "spacingAndGlyphs" as const } : {});
const featNodes = (f: Feature) => [...new Set(f.steps.flatMap((s) => [s.a, s.b]).filter(Boolean))];

type Props = {
  project: Project;
  exp: Experience;
  logo?: string;
  zoom: Zoom;
  go: (next: Partial<Zoom>) => void;
  zoomOut: () => void;
};

function BackButton({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button className="back-button" type="button" aria-label={label} data-tooltip={label} onClick={onBack}>
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 12H4m7-7-7 7 7 7" />
      </svg>
    </button>
  );
}

export default function ProjectZoom({ project: p, exp, logo, zoom, go, zoomOut }: Props) {
  const node = (id: string) => p.nodes.find((n) => n.id === id)!;
  const f = p.features.find((x) => x.id === zoom.f) ?? null;
  const n = p.nodes.find((x) => x.id === zoom.n) ?? null;
  const inv = useMemo(() => (f ? featNodes(f) : null), [f]);
  const [hoverFeat, setHoverFeat] = useState<string | null>(null);
  const [hoverStep, setHoverStep] = useState<number | null>(null);
  useEffect(() => { setHoverFeat(null); setHoverStep(null); }, [p.id, zoom.f, zoom.n]);

  const lit = hoverFeat ? featNodes(p.features.find((x) => x.id === hoverFeat)!) : [];
  const hot = f && hoverStep !== null ? [f.steps[hoverStep].a, f.steps[hoverStep].b] : [];

  // Liens de fond : une ligne par paire de blocs reliée par au moins une fonctionnalité.
  const base = useMemo(() => {
    const pairs = new Map<string, [string, string]>();
    p.features.forEach((x) => x.steps.forEach((s) => { if (s.b) pairs.set([s.a, s.b].sort((x, y) => x.localeCompare(y)).join("|"), [s.a, s.b]); }));
    return [...pairs.entries()].map(([k, [a, b]]) => ({ k, ...seg(node(a), node(b)) }));
  }, [p]);

  // Flèches et pastilles numérotées de la fonctionnalité ouverte.
  const { flows, badges } = useMemo(() => {
    const flows: { key: string; g: ReturnType<typeof seg> }[] = [];
    const badges: { i: number; key?: string; x: number; y: number }[] = [];
    if (!f) return { flows, badges };
    const count: Record<string, number> = {}, seen: Record<string, number> = {}, selfs: Record<string, number> = {};
    f.steps.forEach((s) => { if (s.b) count[s.a + ">" + s.b] = (count[s.a + ">" + s.b] ?? 0) + 1; });
    f.steps.forEach((s, i) => {
      const A = node(s.a);
      if (!s.b) {
        const k = (selfs[s.a] = (selfs[s.a] ?? 0) + 1);
        badges.push({ i, x: A.x + NW - 4 - (k - 1) * 19, y: A.y + 3 });
        return;
      }
      const key = s.a + ">" + s.b, g = seg(A, node(s.b), count[s.b + ">" + s.a] ? 7 : 0);
      const idx = (seen[key] = (seen[key] ?? 0) + 1), tot = count[key];
      if (idx === 1) flows.push({ key, g });
      const t = tot === 1 ? 0.46 : 0.25 + (0.42 * (idx - 1)) / (tot - 1);
      badges.push({ i, key, x: g.x1 + (g.x2 - g.x1) * t, y: g.y1 + (g.y2 - g.y1) * t });
    });
    return { flows, badges };
  }, [p, f]);

  // ---- zoom : le viewBox est animé hors de React ----
  const svgRef = useRef<SVGSVGElement>(null);
  const vb = useRef<number[] | null>(null);
  const last = useRef("");
  const [resized, setResized] = useState(0);
  useEffect(() => {
    let t = 0;
    const on = () => { clearTimeout(t); t = window.setTimeout(() => setResized((v) => v + 1), 120); };
    addEventListener("resize", on);
    return () => { removeEventListener("resize", on); clearTimeout(t); };
  }, []);
  useLayoutEffect(() => {
    const svg = svgRef.current!;
    const r = svg.clientWidth && svg.clientHeight ? svg.clientWidth / svg.clientHeight : RATIO;
    const narrow = svg.clientWidth < 520;
    const target = n ? fit({ x: n.x, y: n.y, w: NW, h: NH }, r, narrow ? 10 : 44)
      : inv ? fit(bbox(inv.map(node)), r, 30, narrow ? 360 : 430)
      : fit(bbox([...p.nodes, ...p.personas]), r, 16);
    const apply = () => svg.setAttribute("viewBox", vb.current!.map((v) => v.toFixed(2)).join(" "));
    const scene = p.id + "/" + resized;
    const instant = !vb.current || last.current !== scene || matchMedia("(prefers-reduced-motion: reduce)").matches;
    last.current = scene;
    if (instant) { vb.current = target; apply(); return; }
    const from = vb.current!.slice(), t0 = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      const k = Math.min(1, (now - t0) / 560), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      vb.current = from.map((v, i) => v + (target[i] - v) * e);
      apply();
      if (k < 1) raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [p, inv, n, resized]);

  const types = [...new Set(p.nodes.map((x) => iconOf(p, x)))];

  return (
    <section id="proj" className="pop">
      <div className="phead">
        <div className="project-identity">
          {!f && !n && <BackButton label="Revenir au parcours principal" onBack={zoomOut} />}
          {logo && <span className="plate" style={{ viewTransitionName: `logo-${p.id}` }}><img src={logo} alt={`Logo ${exp.company}`} /></span>}
        </div>
        <div>
          <p className="objective-label">Objectif de la plateforme</p>
          <h1 className="pitch">{p.pitch}</h1>
        </div>
      </div>

      <div className="zoom">
        <div className="zpanel">
          {n ? <NodePanel p={p} n={n} go={go} onBack={zoomOut} backLabel={f ? "Revenir à la fonctionnalité" : "Revenir à l’architecture"} />
            : f ? <FeaturePanel f={f} label={(id) => node(id).label} go={go} hover={hoverStep} onHover={setHoverStep} onBack={zoomOut} />
            : <Overview p={p} go={go} onHover={setHoverFeat} />}
        </div>

        <div className="stage">
          <div className="canvas">
            <svg ref={svgRef} role="group" aria-label="Schéma d'architecture simplifié" className={f ? "focus" : undefined}>
              <rect className="bg" x={-2000} y={-2000} width={5000} height={5000} onClick={() => (f || n) && zoomOut()} />
              <g>{base.map((g) => <line key={g.k} className="base" x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} />)}</g>
              <g>
                {flows.map(({ key, g }) => (
                  <g key={key} className={"flow" + (hot.length && hot.join(">") === key ? " hot" : "")}>
                    <line x1={g.x1} y1={g.y1} x2={g.x2 - g.dx * 6} y2={g.y2 - g.dy * 6} />
                    <path className="arrow" d="M0,0 L-9,-4.5 L-9,4.5 Z" transform={`translate(${g.x2},${g.y2}) rotate(${g.ang})`} />
                  </g>
                ))}
              </g>
              <g>
                {p.personas.map((u) => {
                  const cx = u.x + NW / 2;
                  return (
                    <g key={u.name} className={"persona" + (inv && !u.to.some((id) => inv.includes(id)) ? " dim" : "")}>
                      {u.to.map((id) => {
                        const g = seg(u, node(id));
                        return (
                          <g key={id}>
                            <line className="plink" x1={g.x1} y1={g.y1} x2={g.x2 - g.dx * 5} y2={g.y2 - g.dy * 5} />
                            <path className="parrow" d="M0,0 L-7,-3.5 L-7,3.5 Z" transform={`translate(${g.x2},${g.y2}) rotate(${g.ang})`} />
                          </g>
                        );
                      })}
                      <g className="ico" transform={`translate(${cx - 10},${u.y + 3}) scale(1.1)`}>{ICONS.person}</g>
                      <text className="pn" x={cx} y={u.y + 36}>{u.name}</text>
                      {wrapRole(u.role).map((l, i) => <text key={i} className="pr" x={cx} y={u.y + 49 + i * 11}>{l}</text>)}
                    </g>
                  );
                })}
              </g>
              <g>
                {p.nodes.map((x) => (
                  <NodeBox key={x.id} p={p} n={x} onOpen={() => go({ n: zoom.n === x.id ? null : x.id })}
                    cls={(inv && !inv.includes(x.id) && x.id !== zoom.n ? " dim" : "") + (x.id === zoom.n ? " in" : "")
                      + (lit.includes(x.id) ? " lit" : "") + (hot.includes(x.id) ? " hot" : "")} />
                ))}
              </g>
              <g>
                {badges.map((b) => (
                  <g key={b.i} className={"badge" + (hoverStep === b.i ? " hot" : "")}
                    onMouseEnter={() => setHoverStep(b.i)} onMouseLeave={() => setHoverStep(null)}>
                    <circle cx={b.x} cy={b.y} r={8.5} />
                    <text x={b.x} y={b.y + 3.4}>{b.i + 1}</text>
                  </g>
                ))}
              </g>
            </svg>
          </div>
          <div className="legend">
            {types.map((t) => <span key={t} className={`k-${p.nodes.find((x) => iconOf(p, x) === t)!.kind}`}><Ico t={t} />{ICON_NAMES[t]}</span>)}
            <span className="k-user"><Ico t="person" />Utilisateur</span>
          </div>
          <p className="touch-hint">{n ? "Touchez le fond du schéma pour revenir." : "Touchez un bloc pour zoomer dessus."}</p>
        </div>
      </div>
    </section>
  );
}

/** Un bloc du schéma : vue « de loin » (icône, nom, techno) et vue « de près » (sous-parties), fondues selon le zoom. */
function NodeBox({ p, n, cls, onOpen }: { p: Project; n: ZNode; cls: string; onOpen: () => void }) {
  const lines = wrapLabel(n.label), cx = n.x + 89;
  const ps = n.parts, rows = Math.ceil(ps.length / 2), top = n.y + 18, rh = (NH - 18 - 5 - (rows - 1) * 3) / rows;
  return (
    <g className={`node k-${n.kind}${cls}`} tabIndex={0} role="button" aria-label={`${n.label} – zoomer sur ce bloc`}
      onClick={onOpen} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}>
      <rect className="box" x={n.x} y={n.y} width={NW} height={NH} rx={9} />
      <g className="far">
        <g className="ico" transform={`translate(${n.x + 8},${n.y + 17}) scale(1.15)`}>{ICONS[iconOf(p, n)]}</g>
        {lines.map((l, i) => <text key={i} className="nl" x={cx} y={n.y + (lines.length === 1 ? 31 : 23) + i * 16} {...squeeze(l, 17, 112)}>{l}</text>)}
        <text className="nt" x={cx} y={n.y + 56} {...squeeze(n.tech, 22, 112)}>{n.tech}</text>
      </g>
      <g className="near">
        <text className="n-title" x={n.x + 8} y={n.y + 11.5}>{n.label}</text>
        <text className="n-kind" x={n.x + NW - 8} y={n.y + 11}>{ICON_NAMES[iconOf(p, n)].toUpperCase()}</text>
        {ps.map(([name], i) => {
          const full = ps.length === 1 || (ps.length === 3 && i === 2), w = full ? NW - 14 : (NW - 18) / 2;
          const x = n.x + 7 + (full ? 0 : (i % 2) * (w + 4)), y = top + Math.floor(i / 2) * (rh + 3);
          return (
            <g key={name} className="part">
              <rect x={x} y={y} width={w} height={rh} rx={2.5} />
              <text x={x + w / 2} y={y + rh / 2 + 2} {...squeeze(name, full ? 44 : 21, w - 5)}>{name}</text>
            </g>
          );
        })}
      </g>
    </g>
  );
}

function Overview({ p, go, onHover }: { p: Project; go: Props["go"]; onHover: (id: string | null) => void }) {
  return (
    <>
      <p className="lvl">Fonctionnalités principales</p>
      <ul className="flist">
        {p.features.map((x) => (
          <li key={x.id}>
            <button className="feat" type="button" onClick={() => go({ f: x.id, n: null })}
              onMouseEnter={() => onHover(x.id)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(x.id)} onBlur={() => onHover(null)}>
              <span className="feat-icon"><Ico t={x.icon} /></span>
              <div className="feat-copy"><b>{x.title}</b><span>{x.sum}</span></div>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function FeaturePanel({ f, label, go, hover, onHover, onBack }: { f: Feature; label: (id: string) => string; go: Props["go"]; hover: number | null; onHover: (i: number | null) => void; onBack: () => void }) {
  return (
    <>
      <div className="panel-heading feature-heading">
        <BackButton label="Revenir à l’architecture" onBack={onBack} />
        <span className="feat-icon"><Ico t={f.icon} /></span>
        <div><p className="lvl">Fonctionnalité</p><h2>{f.title}</h2></div>
      </div>
      <p className="sum">{f.sum}</p>
      <ol className="steps">
        {f.steps.map((s, i) => (
          <li key={i} className={hover === i ? "hot" : undefined}>
            <button type="button" className="step" aria-pressed={hover === i}
              onClick={() => onHover(hover === i ? null : i)}
              onMouseEnter={() => onHover(i)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(i)} onBlur={() => onHover(null)}>
              <span><small>{label(s.a)}{s.b && ` → ${label(s.b)}`}</small>{s.t}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="sub">Blocs traversés – zoomer dedans</p>
      <div className="chips">
        {featNodes(f).map((id) => <button key={id} className="chip" type="button" onClick={() => go({ n: id })}>{label(id)}</button>)}
      </div>
    </>
  );
}

function NodePanel({ p, n, go, onBack, backLabel }: { p: Project; n: ZNode; go: Props["go"]; onBack: () => void; backLabel: string }) {
  const used = p.features.filter((x) => featNodes(x).includes(n.id));
  return (
    <div className={`k-${n.kind}`}>
      <div className="panel-heading">
        <BackButton label={backLabel} onBack={onBack} />
        <div><p className="kind"><Ico t={iconOf(p, n)} />{ICON_NAMES[iconOf(p, n)]}</p><h2>{n.label}</h2></div>
      </div>
      <p className="tech">{n.tech}</p>
      <p className="ntext">{n.text}</p>
      <p className="sub">À l'intérieur</p>
      <dl className="parts">{n.parts.map(([name, desc]) => <div key={name}><dt>{name}</dt><dd>{desc}</dd></div>)}</dl>
      <p className="sub">Fonctionnalités qui passent par ce bloc</p>
      <div className="chips">
        {used.map((x) => <button key={x.id} className="chip" type="button" onClick={() => go({ f: x.id, n: null })}>{x.title}</button>)}
      </div>
    </div>
  );
}
