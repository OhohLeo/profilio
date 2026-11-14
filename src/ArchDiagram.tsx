import { useState } from "react";
import { robeau } from "./data";

export default function ArchDiagram({ activeTech, onTech }: { activeTech: string | null; onTech: (t: string) => void }) {
  const [sel, setSel] = useState("services");
  const byId = Object.fromEntries(robeau.nodes.map((n) => [n.id, n]));
  const node = byId[sel];
  const lit = (id: string) => !!activeTech && byId[id].tech.includes(activeTech);

  return (
    <div className="arch">
      <svg viewBox="0 0 760 400" role="img" aria-label="Architecture de la plateforme Robeau">
        {robeau.links.map(([a, b]) => (
          <line key={a + b} x1={byId[a].x} y1={byId[a].y} x2={byId[b].x} y2={byId[b].y}
            className={"edge" + (sel === a || sel === b ? " hot" : "")} />
        ))}
        {robeau.nodes.map((n) => (
          <g key={n.id} transform={`translate(${n.x},${n.y})`} tabIndex={0} role="button"
            className={`node ${n.group}` + (sel === n.id ? " sel" : "") + (lit(n.id) ? " lit" : "")}
            onClick={() => setSel(n.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSel(n.id)}>
            <rect x={-60} y={-24} width={120} height={48} rx={10} strokeDasharray={n.todo ? "4 3" : undefined} />
            <text textAnchor="middle" dy="0.35em">{n.label}</text>
          </g>
        ))}
      </svg>
      <aside className="panel">
        <h3>{node.label}</h3>
        <p>{node.text}</p>
        <div className="chips small">
          {node.tech.map((t) => (
            <button key={t} className={"chip" + (activeTech === t ? " on" : "")} onClick={() => onTech(t)}>{t}</button>
          ))}
        </div>
      </aside>
    </div>
  );
}
