import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { experiences as staticExperiences, profile, type Experience } from "./data";
import { useCvContent } from "./ghost";
import { PROJECTS, type Project } from "./projects";
import ProjectZoom, { type Zoom } from "./ProjectZoom";
import { matchesTechnologies, type MatchMode } from "./technologies";

const LOGOS = import.meta.glob<string>("./assets/logos/*.png", { eager: true, import: "default" });
const logoOf = (id: string): string | undefined => LOGOS[`./assets/logos/${id}.png`];
/** Les expériences venues de Ghost ont pour id leur slug (`cv-experience-<id>`). */
const projectId = (e: Experience) => e.id.replace(/^cv-experience-/, "");

type Theme = "light" | "dark";

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch {}
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#10191f" : "#f5f7f8");
    try { localStorage.setItem("theme", theme); } catch {}
  }, [theme]);
  return { theme, toggleTheme: () => setTheme((current) => current === "dark" ? "light" : "dark") };
}

/** `#robeau` ouvre un projet, `#robeau-alertes` une de ses fonctionnalités ; tout autre hash est une ancre de la page. */
function parseHash(): Zoom {
  const h = decodeURIComponent(location.hash.slice(1)), i = h.indexOf("-");
  const p = PROJECTS.find((x) => x.id === (i < 0 ? h : h.slice(0, i)));
  if (!p) return { p: null, f: null, n: null };
  const f = i > 0 ? h.slice(i + 1) : null;
  return { p: p.id, f: p.features.some((x) => x.id === f) ? f : null, n: null };
}

function useZoom() {
  const [zoom, setZoom] = useState<Zoom>(parseHash);
  const scrollY = useRef(0);
  useEffect(() => {
    const on = () => setZoom(parseHash());
    addEventListener("hashchange", on);
    addEventListener("popstate", on);
    return () => { removeEventListener("hashchange", on); removeEventListener("popstate", on); };
  }, []);
  // En entrant dans un projet on repart du haut ; en sortant on retrouve sa place dans le CV.
  useLayoutEffect(() => { window.scrollTo(0, zoom.p ? 0 : scrollY.current); }, [zoom.p]);

  const go = (next: Partial<Zoom>) => {
    const z = { ...zoom, ...next };
    const moved = z.p !== zoom.p;
    if (moved) { z.f = next.f ?? null; z.n = null; if (z.p) scrollY.current = window.scrollY; }
    const hash = z.p ? z.p + (z.f ? "-" + z.f : "") : "";
    if (location.hash.slice(1) !== hash) history.pushState(null, "", hash ? "#" + hash : location.pathname + location.search);
    const animate = moved && "startViewTransition" in document && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (animate) document.startViewTransition(() => flushSync(() => setZoom(z)));
    else setZoom(z);
  };
  const zoomOut = () => {
    if (zoom.n) go({ n: null }); else if (zoom.f) go({ f: null }); else if (zoom.p) go({ p: null });
  };
  return { zoom, go, zoomOut };
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [tech, setTech] = useState<string[]>([]);
  const [matchMode, setMatchMode] = useState<MatchMode>("any");
  const { experiences } = useCvContent();
  const { zoom, go, zoomOut } = useZoom();

  const project = PROJECTS.find((p) => p.id === zoom.p) ?? null;
  const projectExp = project && (experiences.find((e) => projectId(e) === project.id) ?? staticExperiences.find((e) => e.id === project.id));

  useEffect(() => {
    if (!zoom.p) return;
    const on = (e: KeyboardEvent) => { if (e.key === "Escape") zoomOut(); };
    addEventListener("keydown", on);
    return () => removeEventListener("keydown", on);
  });

  // Compte les technologies des expériences affichées.
  const techCounts = useMemo(() => {
    const m = new Map<string, number>();
    const add = (list: string[]) => new Set(list).forEach((t) => m.set(t, (m.get(t) ?? 0) + 1));
    experiences.forEach((e) => add(e.stack));
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [experiences]);

  const toggle = (t: string) => setTech((cur) => cur.includes(t) ? cur.filter((name) => name !== t) : [...cur, t]);

  return (
    <>
      <button className="theme-toggle" type="button" onClick={toggleTheme} aria-pressed={theme === "dark"}
        aria-label={theme === "dark" ? "Activer le mode clair" : "Activer le mode sombre"}
        data-tooltip={theme === "dark" ? "Mode clair" : "Mode sombre"}>
        {theme === "dark" ? (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M20 14a8.5 8.5 0 0 1-10-10A8.5 8.5 0 1 0 20 14Z" />
          </svg>
        )}
      </button>
      {project && projectExp && (
        <header className="top">
          <Rail project={project} company={projectExp.company} zoom={zoom} go={go} />
        </header>
      )}

      <main>
        {project && projectExp && (
          <ProjectZoom key={project.id} project={project} exp={projectExp} logo={logoOf(project.id)} zoom={zoom} go={go} zoomOut={zoomOut} />
        )}

        <div hidden={!!project}>
          <header className="hero">
            <div className="hero-intro">
              <p className="eyebrow">Ingénierie · Produit · Impact</p>
              <h1>{profile.title}</h1>
              <p className="profile-name">{profile.name}</p>
              <p className="tagline">{profile.tagline}</p>
            </div>
            <div className="hero-contact" aria-label="Coordonnées et CV">
              <span className="location">{profile.location}</span>
              <a className="email" href={`mailto:${profile.email}`}>{profile.email}</a>
              <a className="website" href={profile.website}>{profile.website.replace("https://", "")}</a>
              <div className="cta">
                <a className="btn" href={`${import.meta.env.BASE_URL}cv/leo-martin-cv.pdf`} download>
                  <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M10 2v10m-4-4 4 4 4-4M3 13v4h14v-4" />
                  </svg>
                  Télécharger le CV <small>PDF · 1 page</small>
                </a>
                <a className="btn ghost" href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a>
              </div>
            </div>
            <div className="personal-details">
              <p className="profile-summary">{profile.summary}</p>
              <p><span>Langues</span>{profile.languages.map((l) => `${l.name} (${l.level})`).join(" · ")}</p>
            </div>
          </header>

          <TechnologyFilter technologies={techCounts.map(([name]) => name)} tech={tech} matchMode={matchMode} onMatchMode={setMatchMode} onTech={toggle} onClear={() => setTech([])} />
          <div className="cv-layout">
            <div className="cv-content">
              <section id="parcours" aria-labelledby="parcours-heading">
                <p className="eyebrow">Du terrain au produit</p>
                <h2 id="parcours-heading">Parcours professionnel</h2>
                <p className="hint">Explorez les projets pour découvrir leurs fonctionnalités et leur architecture.</p>
                <ol className="timeline">
                  {experiences.map((e) => {
                    const id = projectId(e);
                    return (
                      <ExperienceCard key={e.id} exp={e} id={id} logo={logoOf(id)} tech={tech} matchMode={matchMode} onTech={toggle}
                        onOpen={PROJECTS.some((p) => p.id === id) ? () => go({ p: id }) : undefined} />
                    );
                  })}
                  <li className="item edu">
                    <div className="period"><span className="when">{profile.education.year}</span></div>
                    <div className="card">
                      <h3>{profile.education.school}</h3>
                      <p>{profile.education.degree}</p>
                    </div>
                  </li>
                </ol>
              </section>

            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function TechnologyFilter({ technologies, tech, matchMode, onMatchMode, onTech, onClear }: { technologies: string[]; tech: string[]; matchMode: MatchMode; onMatchMode: (mode: MatchMode) => void; onTech: (tech: string) => void; onClear: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState("");
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
  const visible = technologies.filter((name) => normalize(name).includes(normalize(search.trim())));
  const close = () => dialog.current?.close();
  return (
    <>
      <button className={"filter-fab" + (tech.length ? " active" : "")} type="button" aria-label="Filtrer par technologie" data-tooltip="Filtrer par technologie" aria-haspopup="dialog" aria-controls="technology-filter"
        onClick={() => { setSearch(""); dialog.current?.showModal(); }}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 4h18l-7 8v7l-4 2v-9Z" />
        </svg>
        {tech.length > 0 && <span className="filter-count" aria-label={`${tech.length} technologies sélectionnées`}>{tech.length}</span>}
      </button>
      <dialog ref={dialog} id="technology-filter" className="filter-sheet" aria-labelledby="filter-title" onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = [...event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), select:not(:disabled)")].filter((element) => element.getClientRects().length > 0);
        const first = controls[0], last = controls[controls.length - 1];
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      }} onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
      }}>
        <div className="sheet-header">
          <h2 id="filter-title">Technologies</h2>
          <button className="icon-button" type="button" onClick={close} aria-label="Fermer les filtres" data-tooltip="Fermer">×</button>
        </div>
        <input className="tech-search" type="search" aria-label="Rechercher une technologie" placeholder="Rechercher une techno…" value={search} onChange={(event) => setSearch(event.target.value)} />
        {tech.length > 1 && <label className="match-mode">Correspondance
          <select value={matchMode} onChange={(event) => onMatchMode(event.target.value as MatchMode)}>
            <option value="any">Au moins une</option><option value="all">Toutes</option>
          </select>
        </label>}
        <div className="chips" aria-label="Technologies disponibles">
          {visible.map((name) => <button key={name} type="button" className={"chip" + (tech.includes(name) ? " on" : "")} aria-pressed={tech.includes(name)} title={tech.includes(name) ? `Retirer ${name}` : `Ajouter ${name}`} onClick={() => onTech(name)}>{name}</button>)}
        </div>
        {visible.length === 0 && <p className="hint" role="status">Aucune technologie trouvée.</p>}
        <div className="sheet-footer">
          <button className="link" type="button" onClick={onClear} disabled={!tech.length}>Tout effacer</button>
          <button className="btn" type="button" onClick={close}>Voir le CV</button>
        </div>
      </dialog>
    </>
  );
}

/** Échelle de zoom : parcours › projet › fonctionnalité › composant. Les crans déjà franchis ramènent en arrière. */
function Rail({ project, company, zoom, go }: { project: Project; company: string; zoom: Zoom; go: (next: Partial<Zoom>) => void }) {
  const f = project.features.find((x) => x.id === zoom.f);
  const n = project.nodes.find((x) => x.id === zoom.n);
  const stops: { k: string; v?: string; to?: Partial<Zoom> }[] = [
    { k: "Parcours", v: profile.name, to: { p: null } },
    { k: "Projet", v: company, to: { f: null, n: null } },
    { k: "Fonctionnalité", v: f ? f.title : n ? "Vue d'ensemble" : undefined, to: { n: null } },
    { k: "Composant", v: n?.label },
  ];
  const cur = n ? 3 : f ? 2 : 1;
  return (
    <nav className="rail" aria-label="Niveau de zoom">
      {stops.map((s, i) => (
        <span key={s.k} className={"rail-item" + (s.v ? "" : " off")}>
          {i > 0 && <span className="sep" aria-hidden="true">›</span>}
          {!s.v ? <span className="stop"><small>{s.k}</small><b>–</b></span>
            : i === cur ? <span className="stop cur" aria-current="step"><small>{s.k}</small><b>{s.v}</b></span>
            : <button className="stop" type="button" onClick={() => go(s.to!)}><small>{s.k}</small><b>{s.v}</b></button>}
        </span>
      ))}
    </nav>
  );
}

function TechList({ list, tech, onTech }: { list: string[]; tech: string[]; onTech: (t: string) => void }) {
  return (
    <div className="chips small">
      {list.map((t) => (
        <button key={t} type="button" className={"chip" + (tech.includes(t) ? " on" : "")} aria-pressed={tech.includes(t)} title={tech.includes(t) ? `Retirer ${t}` : `Filtrer par ${t}`} onClick={() => onTech(t)}>{t}</button>
      ))}
    </div>
  );
}

type CardProps = { exp: Experience; id: string; logo?: string; tech: string[]; matchMode: MatchMode; onTech: (t: string) => void; onOpen?: () => void };

function ExperienceCard({ exp, id, logo, tech, matchMode, onTech, onOpen }: CardProps) {
  const match = matchesTechnologies(exp.stack, tech, matchMode);
  const datedDuration = exp.period.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  const period = datedDuration?.[1] ?? exp.period;
  const duration = exp.duration ?? datedDuration?.[2];
  return (
    <li className={"item" + (match ? "" : " dim")}>
      <div className="period">
        <span className="when">{period}</span>
        {duration && <small>{duration}</small>}
        {exp.current && <em className="now">en cours</em>}
      </div>
      <article className={"card xp" + (onOpen ? " zoomable" : "")} aria-label={exp.company} onClick={onOpen}>
        <div className="xp-company">
          <span className={"plate" + (logo ? "" : " empty")} style={{ viewTransitionName: `logo-${id}` }}>
            {logo && <img src={logo} alt={`Logo ${exp.company}`} />}
          </span>
        </div>
        <div className="xp-body">
          {!logo && <h3>{exp.company}</h3>}
          <p className="role">{exp.role}</p>
          <p className="about">{exp.about}</p>
          <div className="xp-missions"><div><ul>{exp.bullets.map((b) => <li key={b}>{b}</li>)}</ul></div></div>
        </div>
        <div className="xp-actions">
          {onOpen && <button className="xp-action-button architecture-button" type="button" aria-label={`Explorer l'architecture de ${exp.company}`} data-tooltip="Explorer l'architecture" onClick={(event) => { event.stopPropagation(); onOpen(); }}>
            <span className="xp-action-label">Architecture</span>
            <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 16h22m-9-9 9 9-9 9" />
            </svg>
          </button>}
        </div>
        <div className="xp-tech" onClick={(e) => e.stopPropagation()}>
          <TechList list={exp.stack} tech={tech} onTech={onTech} />
        </div>
      </article>
    </li>
  );
}
