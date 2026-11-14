import { useEffect, useMemo, useState } from "react";
import { experiences, profile, robeau, sideProjects, type Experience } from "./data";
import ArchDiagram from "./ArchDiagram";

type Theme = "light" | "dark";

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

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const [tech, setTech] = useState<string | null>(null);

  // Compte, par technologie, le nombre d'expériences + projets où elle apparaît.
  const techCounts = useMemo(() => {
    const m = new Map<string, number>();
    const add = (list: string[]) => new Set(list).forEach((t) => m.set(t, (m.get(t) ?? 0) + 1));
    experiences.forEach((e) => add(e.stack));
    sideProjects.forEach((p) => add(p.stack));
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, []);

  const toggle = (t: string) => setTech((cur) => (cur === t ? null : t));

  return (
    <>
      <header className="top">
        <nav>
          <a href="#parcours">Parcours</a>
          <a href="#robeau">Robeau</a>
          <a href="#tech">Technos</a>
          <a href="#projets">Projets</a>
          <a href="#contact">Contact</a>
        </nav>
        <button className="ghost" onClick={toggleTheme} aria-label="Changer de thème">
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">{profile.name}</p>
          <h1>{profile.title}</h1>
          <p className="tagline">{profile.tagline}</p>
          <div className="cta">
            <a className="btn" href="#robeau">Voir le projet Robeau</a>
            <a className="btn ghost" href={`mailto:${profile.email}`}>Me contacter</a>
            <a className="btn ghost" href={profile.github} target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </section>

        <section id="parcours">
          <h2>Parcours</h2>
          {tech && (
            <p className="filter">
              Filtre : <strong>{tech}</strong>{" "}
              <button className="link" onClick={() => setTech(null)}>réinitialiser</button>
            </p>
          )}
          <ol className="timeline">
            {experiences.map((e) => (
              <ExperienceCard key={e.id} exp={e} tech={tech} onTech={toggle} />
            ))}
            <li className="item edu">
              <span className="when">{profile.education.year}</span>
              <div className="card">
                <h3>{profile.education.school}</h3>
                <p>{profile.education.degree}</p>
              </div>
            </li>
          </ol>
        </section>

        <section id="robeau">
          <h2>Étude de cas : Robeau</h2>
          <p className="lead">{robeau.pitch}</p>
          <ul className="metrics">
            {robeau.metrics.map((m) => (
              <li key={m.label}><strong>{m.value}</strong><span>{m.label}</span></li>
            ))}
          </ul>
          <ArchDiagram activeTech={tech} onTech={toggle} />
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
      </main>
    </>
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

function ExperienceCard({ exp, tech, onTech }: { exp: Experience; tech: string | null; onTech: (t: string) => void }) {
  const [open, setOpen] = useState(!!exp.current);
  const match = !tech || exp.stack.includes(tech);
  return (
    <li className={"item" + (match ? "" : " dim")}>
      <span className="when">{exp.period}{exp.duration && <small> ({exp.duration})</small>}</span>
      <div className="card">
        <button className="head" onClick={() => setOpen(!open)} aria-expanded={open}>
          <h3>{exp.company}{exp.current && <em className="now">en cours</em>}</h3>
          <span className="caret">{open ? "−" : "+"}</span>
        </button>
        <p className="about">{exp.about}</p>
        <p className="role">{exp.role}</p>
        {open && <ul>{exp.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
        <TechList list={exp.stack} tech={tech} onTech={onTech} />
      </div>
    </li>
  );
}
