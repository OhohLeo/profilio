import { Suspense, lazy, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { experiences as staticExperiences, profile, type Experience } from "./data";
import { useCvContent } from "./ghost";
import { PROJECTS, type Project } from "./projects";
import type { Zoom } from "./ProjectZoom";
const ProjectZoom = lazy(() => import("./ProjectZoom"));
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
  const filterDialog = useRef<HTMLDialogElement>(null);

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
      <div className={"toolbar" + (project ? " in-project" : "")} role="toolbar" aria-label="Actions">
        <button className="tool" type="button" onClick={toggleTheme} aria-pressed={theme === "dark"}
          aria-label={theme === "dark" ? "Activer le mode clair" : "Activer le mode sombre"}
          data-tooltip={theme === "dark" ? "Mode clair" : "Mode sombre"}>
          {theme === "dark" ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20 14a8.5 8.5 0 0 1-10-10A8.5 8.5 0 1 0 20 14Z" /></svg>
          )}
        </button>
        {!project && (
          <button className={"tool" + (tech.length ? " active" : "")} type="button" aria-label="Filtrer par technologie" data-tooltip="Filtrer par technologie" aria-haspopup="dialog" aria-controls="technology-filter"
            onClick={() => filterDialog.current?.showModal()}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="M3 4h18l-7 8v7l-4 2v-9Z" /></svg>
            {tech.length > 0 && <span className="filter-count" aria-label={`${tech.length} technologies sélectionnées`}>{tech.length}</span>}
          </button>
        )}
        <a className="tool" href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub (nouvel onglet)" data-tooltip="GitHub">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.1-1.46-1.1-1.46-.9-.62.07-.6.07-.6 1 .07 1.52 1.03 1.52 1.03.89 1.52 2.34 1.08 2.9.83.09-.64.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" /></svg>
        </a>
        <a className="tool" href={`${import.meta.env.BASE_URL}cv/leo-martin-cv.pdf`} download aria-label="Télécharger le CV (PDF, 1 page)" data-tooltip="Télécharger le CV (PDF)">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 20h16" /></svg>
        </a>
      </div>
      {project && projectExp && (
        <header className="top">
          <Rail project={project} company={projectExp.company} zoom={zoom} go={go} />
        </header>
      )}

      <a className="skip-link" href="#parcours">Aller au parcours</a>
      <main>
        {project && projectExp && (
          <Suspense fallback={<p className="hint" role="status">Chargement du projet…</p>}>
            <ProjectZoom key={project.id} project={project} exp={projectExp} logo={logoOf(project.id)} zoom={zoom} go={go} zoomOut={zoomOut} />
          </Suspense>
        )}

        <div hidden={!!project}>
          <header className="hero">
            <div className="hero-intro">
              <h1>{profile.title}</h1>
              <p className="profile-name">{profile.name}</p>
              <p className="tagline">{profile.tagline}</p>
            </div>
            <div className="hero-contact" aria-label="Coordonnées et CV">
              <span className="location"><Icon d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />{profile.location}</span>
              <a className="email" href={`mailto:${profile.email}`}><Icon d="M3 6h18v12H3Zm0 1 9 7 9-7" />{profile.email}</a>
              <a className="website" href={profile.website}><Icon d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3Z" />{profile.website.replace("https://", "")}</a>
            </div>
            <div className="personal-details">
              <p className="profile-summary">{profile.summary}</p>
              <p><span>Langues</span>{profile.languages.map((l) => `${l.name} (${l.level})`).join(" · ")}</p>
            </div>
          </header>

          <TechnologyFilter dialog={filterDialog} technologies={techCounts.map(([name]) => name)} tech={tech} matchMode={matchMode} onMatchMode={setMatchMode} onTech={toggle} onClear={() => setTech([])} />
          <div className="cv-layout">
            <div className="cv-content">
              <section id="parcours" aria-labelledby="parcours-heading">
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
        <PrivacyNote email={profile.email} />
      </main>
    </>
  );
}

function Icon({ d }: { d: string }) {
  return <svg className="ci" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}

/** Une ligne discrète ; le détail s'ouvre à la demande (ou via `#confidentialite`). */
function PrivacyNote({ email }: { email: string }) {
  const [open, setOpen] = useState(() => location.hash === "#confidentialite");
  useEffect(() => {
    const on = () => { if (location.hash === "#confidentialite") setOpen(true); };
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return (
    <footer className="site-footer" id="confidentialite">
      <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary>Confidentialité : aucun cookie, aucun traceur</summary>
        <p>
          Ni outil de mesure d'audience ni publicité. Seule votre préférence de thème (clair ou sombre) est mémorisée dans le stockage local de votre navigateur ; elle ne quitte pas votre appareil.
          Votre adresse IP peut apparaître dans les journaux techniques de l'hébergeur et du serveur de contenu, uniquement pour assurer le fonctionnement et la sécurité du service.
          Aucune autre donnée personnelle n'est collectée. Site personnel à but non commercial : pas de bandeau de consentement, faute de traceur à autoriser.
          Une question : <a href={`mailto:${email}`}>{email}</a>.
        </p>
      </details>
    </footer>
  );
}

function TechnologyFilter({ dialog, technologies, tech, matchMode, onMatchMode, onTech, onClear }: { dialog: React.RefObject<HTMLDialogElement | null>; technologies: string[]; tech: string[]; matchMode: MatchMode; onMatchMode: (mode: MatchMode) => void; onTech: (tech: string) => void; onClear: () => void }) {
  const [search, setSearch] = useState("");
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
  const visible = technologies.filter((name) => normalize(name).includes(normalize(search.trim())));
  const close = () => dialog.current?.close();
  return (
    <>
      <dialog ref={dialog} id="technology-filter" className="filter-sheet" aria-labelledby="filter-title" onClose={() => setSearch("")} onKeyDown={(event) => {
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

/** « 2024 – 2025 (18 mois) » → ["2024 – 2025", "18 mois"]. Sans regex : pas de retour arrière coûteux. */
function splitPeriod(value: string): [string, string | undefined] {
  const text = value.trimEnd();
  const open = text.lastIndexOf("(");
  const inner = open >= 0 && text.endsWith(")") ? text.slice(open + 1, -1) : "";
  return inner && !inner.includes(")") ? [text.slice(0, open).trimEnd(), inner] : [value, undefined];
}

type CardProps = { exp: Experience; id: string; logo?: string; tech: string[]; matchMode: MatchMode; onTech: (t: string) => void; onOpen?: () => void };

function ExperienceCard({ exp, id, logo, tech, matchMode, onTech, onOpen }: CardProps) {
  const match = matchesTechnologies(exp.stack, tech, matchMode);
  const [period, datedDuration] = splitPeriod(exp.period);
  const duration = exp.duration ?? datedDuration;
  const [open, setOpen] = useState(false);
  return (
    <li className={"item" + (match ? "" : " dim")}>
      <div className="period">
        <span className="when">{period}</span>
        {duration && <small>{duration}</small>}
        {exp.current && <em className="now">en cours</em>}
      </div>
      <article className={"card xp" + (onOpen ? " zoomable" : "") + (open ? " open" : "")} aria-label={exp.company} onClick={onOpen && ((e) => { if (!(e.target as Element).closest(".xp-tech")) onOpen(); })}>
        <div className="xp-company">
          <span className={"plate" + (logo ? "" : " empty")} style={{ viewTransitionName: `logo-${id}` }}>
            {logo && <img src={logo} alt={`Logo ${exp.company}`} />}
          </span>
        </div>
        <div className="xp-body">
          {!logo && <h3>{exp.company}</h3>}
          <p className="role">{exp.role}</p>
          <p className="about">{exp.about}</p>
          <button className="mission-toggle" type="button" aria-expanded={open} aria-controls={`missions-${id}`}
            onClick={(event) => { event.stopPropagation(); setOpen((v) => !v); }}>
            {open ? "Masquer les missions" : `Voir les ${exp.bullets.length} missions`}
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 8 5 5 5-5" /></svg>
          </button>
          <div className="xp-missions" id={`missions-${id}`}><div><ul>{exp.bullets.map((b) => <li key={b}>{b}</li>)}</ul></div></div>
        </div>
        <div className="xp-actions">
          {onOpen && <button className="xp-action-button architecture-button" type="button" aria-label={`Explorer l'architecture de ${exp.company}`} data-tooltip="Explorer l'architecture" onClick={(event) => { event.stopPropagation(); onOpen(); }}>
            <span className="xp-action-label"><span className="long">Explorer l'</span>Architecture</span>
            <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 16h22m-9-9 9 9-9 9" />
            </svg>
          </button>}
        </div>
        <div className="xp-tech">
          <TechList list={exp.stack} tech={tech} onTech={onTech} />
        </div>
      </article>
    </li>
  );
}
