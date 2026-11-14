import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { experiences as staticExperiences, profile, type Experience } from "./data";
import { useCvContent } from "./ghost";
import { PROJECTS, type Project } from "./projects";
import ProjectZoom, { type Zoom } from "./ProjectZoom";

type Theme = "light" | "dark";

const LOGOS = import.meta.glob<string>("./assets/logos/*.png", { eager: true, import: "default" });
const logoOf = (id: string): string | undefined => LOGOS[`./assets/logos/${id}.png`];
/** Les expériences venues de Ghost ont pour id leur slug (`cv-experience-<id>`). */
const projectId = (e: Experience) => e.id.replace(/^cv-experience-/, "");

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem("theme") as Theme | null;
      if (saved) return saved;
    } catch {}
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("theme", theme); } catch {}
  }, [theme]);
  return [theme, () => setTheme((t) => (t === "dark" ? "light" : "dark"))];
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
  const [theme, toggleTheme] = useTheme();
  const [tech, setTech] = useState<string | null>(null);
  const { experiences, sideProjects } = useCvContent();
  const { zoom, go, zoomOut } = useZoom();

  const project = PROJECTS.find((p) => p.id === zoom.p) ?? null;
  const projectExp = project && (experiences.find((e) => projectId(e) === project.id) ?? staticExperiences.find((e) => e.id === project.id));

  useEffect(() => {
    if (!zoom.p) return;
    const on = (e: KeyboardEvent) => { if (e.key === "Escape") zoomOut(); };
    addEventListener("keydown", on);
    return () => removeEventListener("keydown", on);
  });

  // Compte, par technologie, le nombre d'expériences + projets où elle apparaît.
  const techCounts = useMemo(() => {
    const m = new Map<string, number>();
    const add = (list: string[]) => new Set(list).forEach((t) => m.set(t, (m.get(t) ?? 0) + 1));
    experiences.forEach((e) => add(e.stack));
    sideProjects.forEach((p) => add(p.stack));
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [experiences, sideProjects]);

  const toggle = (t: string) => setTech((cur) => (cur === t ? null : t));

  return (
    <>
      <header className="top">
        {project && projectExp ? (
          <Rail project={project} company={projectExp.company} zoom={zoom} go={go} />
        ) : (
          <nav>
            <a href="#parcours">Parcours</a>
            <a href="#tech">Technos</a>
            <a href="#projets">Projets</a>
            <a href="#contact">Contact</a>
          </nav>
        )}
        <button className="ghost" onClick={toggleTheme} aria-label="Changer de thème">
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </header>

      <main>
        {project && projectExp && (
          <ProjectZoom key={project.id} project={project} exp={projectExp} logo={logoOf(project.id)} zoom={zoom} go={go} zoomOut={zoomOut} />
        )}

        <div hidden={!!project}>
          <section className="hero">
            <p className="eyebrow">{profile.name}</p>
            <h1>{profile.title}</h1>
            <p className="tagline">{profile.tagline}</p>
            <div className="cta">
              <button className="btn" onClick={() => go({ p: "robeau" })}>Explorer le projet Robeau</button>
              <a className="btn ghost" href={`mailto:${profile.email}`}>Me contacter</a>
              <a className="btn ghost" href={profile.github} target="_blank" rel="noreferrer">GitHub</a>
            </div>
          </section>

          <section id="parcours">
            <h2>Parcours</h2>
            <p className="hint">Chaque projet s'ouvre : fonctionnalités d'un côté, architecture de l'autre. Cliquez pour plonger.</p>
            {tech && (
              <p className="filter">
                Filtre : <strong>{tech}</strong>{" "}
                <button className="link" onClick={() => setTech(null)}>réinitialiser</button>
              </p>
            )}
            <ol className="timeline">
              {experiences.map((e) => {
                const id = projectId(e);
                return (
                  <ExperienceCard key={e.id} exp={e} id={id} logo={logoOf(id)} tech={tech} onTech={toggle}
                    onOpen={PROJECTS.some((p) => p.id === id) ? () => go({ p: id }) : undefined} />
                );
              })}
              <li className="item edu">
                <div className="card">
                  <span className="when">{profile.education.year}</span>
                  <h3>{profile.education.school}</h3>
                  <p>{profile.education.degree}</p>
                </div>
              </li>
            </ol>
          </section>

          <section id="tech">
            <h2>Technologies</h2>
            <p className="hint">Cliquez sur une techno pour surligner les expériences et projets associés.</p>
            <div className="chips">
              {techCounts.map(([t, n]) => (
                <button key={t} className={"chip" + (tech === t ? " on" : "")} onClick={() => toggle(t)}>
                  {t} <small>{n}</small>
                </button>
              ))}
            </div>
          </section>

          <section id="projets">
            <h2>Projets personnels</h2>
            <div className="grid">
              {sideProjects.map((p) => {
                const dim = tech && !p.stack.includes(tech);
                return (
                  <article key={p.name} className={"card" + (dim ? " dim" : "")}>
                    <span className="when">{p.year}</span>
                    <h3>{p.url ? <a href={p.url} target="_blank" rel="noreferrer">{p.name}</a> : p.name}</h3>
                    <p>{p.description}</p>
                    <TechList list={p.stack} tech={tech} onTech={toggle} />
                  </article>
                );
              })}
            </div>
          </section>

          <section id="contact">
            <h2>Contact</h2>
            <p>
              <a href={`mailto:${profile.email}`}>{profile.email}</a> · {profile.location}
            </p>
            <p className="muted">
              {profile.languages.map((l) => `${l.name} (${l.level})`).join(" · ")} ·{" "}
              {profile.traits.join(", ")} · {profile.interests.join(", ")}
            </p>
            <button className="btn ghost" onClick={() => window.print()}>Imprimer / PDF</button>
          </section>
        </div>
      </main>
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

function TechList({ list, tech, onTech }: { list: string[]; tech: string | null; onTech: (t: string) => void }) {
  return (
    <div className="chips small">
      {list.map((t) => (
        <button key={t} className={"chip" + (tech === t ? " on" : "")} onClick={() => onTech(t)}>{t}</button>
      ))}
    </div>
  );
}

type CardProps = { exp: Experience; id: string; logo?: string; tech: string | null; onTech: (t: string) => void; onOpen?: () => void };

function ExperienceCard({ exp, id, logo, tech, onTech, onOpen }: CardProps) {
  const [open, setOpen] = useState(!!exp.current);
  const match = !tech || exp.stack.includes(tech);
  return (
    <li className={"item" + (match ? "" : " dim")}>
      <article className={"card xp" + (onOpen ? " zoomable" : "")} onClick={onOpen}>
        <span className={"plate" + (logo ? "" : " empty")} style={{ viewTransitionName: `logo-${id}` }}>
          {logo && <img src={logo} alt={`Logo ${exp.company}`} />}
        </span>
        <div className="xp-body">
          <span className="when">
            {exp.period}{exp.duration && <small> ({exp.duration})</small>}
            {exp.current && <em className="now">en cours</em>}
          </span>
          <h3>{onOpen ? <button className="xp-open" type="button">{exp.company}</button> : exp.company}</h3>
          <p className="role">{exp.role}</p>
          <p className="about">{exp.about}</p>
          {open && <ul>{exp.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
          <p className="xp-actions">
            <button className="link" type="button" aria-expanded={open} onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
              {open ? "Masquer les missions" : "Voir les missions"}
            </button>
            {onOpen && <span className="xp-cta" aria-hidden="true">Explorer l'architecture →</span>}
          </p>
        </div>
        <div className="xp-tech" onClick={(e) => e.stopPropagation()}>
          <TechList list={exp.stack} tech={tech} onTech={onTech} />
        </div>
      </article>
    </li>
  );
}
