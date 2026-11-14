// Source unique du contenu. Issu du CV 2025 de Léo Martin.
// Volontairement absents : adresse, téléphone, âge, situation familiale.

export const profile = {
  name: "Léo Martin",
  title: "Senior Backend Engineer",
  tagline: "Go / Python – IA – Microservices – Cloud – IoT",
  email: "lmartin.leo@gmail.com",
  github: "https://github.com/OhohLeo",
  location: "Nantes (St-Herblain)",
  languages: [
    { name: "Français", level: "Langue maternelle" },
    { name: "Anglais", level: "980 TOEIC" },
  ],
  traits: ["Adaptatif", "Impliqué", "Persévérant"],
  interests: ["Musique", "Cinéma", "Randonnée"],
  education: {
    school: "INSA de Rennes",
    degree: "Diplôme d'ingénieur – Systèmes et Réseaux de Communication",
    year: 2009,
  },
};

export type Experience = {
  id: string;
  company: string;
  companyUrl?: string;
  period: string;
  duration?: string;
  about: string;
  role: string;
  bullets: string[];
  stack: string[];
  current?: boolean;
};

export const experiences: Experience[] = [
  {
    id: "robeau",
    company: "Robeau",
    period: "2025 – aujourd'hui",
    duration: "18 mois",
    current: true,
    about: "Installe, supervise et pilote les consommations d'eau dans les bâtiments.",
    role: "CTO fondateur – plateforme IoT supervisant + de 2 000 équipements",
    bullets: [
      "Orchestrateur d'une plateforme microservices (Python, PostgreSQL, NATS, Claude)",
      "Intégrateur de composants (React, UmiJS, Antd, MakoJS, Buckets)",
      "Intégrateur de solutions IA (Google Document AI, TimeFS)",
      "Déploiement & supervision de l'infra (GCE, Docker, Grafana, Ansible, Trivy, ZAP)",
    ],
    stack: [
      "Python", "PostgreSQL", "NATS", "Claude", "React", "UmiJS", "Antd", "MakoJS",
      "Google Document AI", "TimeFS", "GCE", "Docker", "Grafana", "Ansible", "Trivy", "ZAP",
    ],
  },
  {
    id: "qos",
    company: "QOS Energy / Univers",
    period: "2018 – 2024",
    about: "Développe une solution de gestion des énergies renouvelables.",
    role: "Acteur clé dans la conversion d'un monolithe en microservices",
    bullets: [
      "Mise en place d'une plateforme microservices (Go, gRPC, GKE, Kubernetes)",
      "Mise en place d'un traitement de flux (Kafka, Go, Scala, Aiven)",
      "Développement sur framework Rails (Ruby)",
      "Conception d'APIs REST/JSON (Go, Ruby, MySQL, PostgreSQL)",
      "Mise en place d'une plateforme d'exécution d'algorithmes (Python, Redis)",
    ],
    stack: [
      "Go", "gRPC", "GKE", "Kubernetes", "Kafka", "Scala", "Aiven", "Ruby", "Rails",
      "REST", "MySQL", "PostgreSQL", "Python", "Redis",
    ],
  },
  {
    id: "entech",
    company: "Entech",
    period: "2017",
    about: "Spécialisée dans les domaines des énergies et des process.",
    role: "Concepteur d'une solution de supervision adaptable et facilement configurable",
    bullets: [
      "Conception de supervisions embarquées (Qt/C++, Perl, Raspberry Pi, Modbus)",
      "Conception de simulateurs pour tester les implémentations (Go, Angular)",
      "Mise en service auprès des clients",
    ],
    stack: ["Qt", "C++", "Perl", "Raspberry Pi", "Modbus", "Go", "Angular"],
  },
  {
    id: "ijenko",
    company: "Ijenko",
    period: "2009 – 2016",
    about: "Service innovant d'éco-contrôle de la maison. Élue Smart-Home technology 2016.",
    role: "Développeur full-stack : embarqué, backend & interface utilisateur",
    bullets: [
      "Mise en place d'une plateforme domotique multi-protocolaire (Perl)",
      "Conception d'APIs REST/JSON (Go, Perl, MySQL)",
      "Conception d'une WebApp pour mobile (Angular, TypeScript)",
      "Responsable du protocole ZigBee (C)",
      "Intégration de nombreux capteurs tiers (Nest, Philips, 4-Noks…)",
    ],
    stack: ["Perl", "Go", "MySQL", "REST", "Angular", "TypeScript", "ZigBee", "C"],
  },
];

export const skills = [
  "Architecture", "Go", "Python", "TypeScript / React", "PostgreSQL",
  "API REST / gRPC", "Kafka / NATS", "Docker", "Git / GitLab-CI", "K8s / Docker",
];

export type SideProject = {
  name: string;
  year: number;
  description: string;
  stack: string[];
  url?: string;
};

export const sideProjects: SideProject[] = [
  {
    name: "Baby",
    year: 2026,
    description: "Appareil photo pour enfants.",
    stack: ["ESP32-S3", "C++", "Expo / React Native", "OpenCode"],
    url: "https://github.com/OhohLeo/baby",
  },
  {
    name: "Hifi-baby",
    year: 2024,
    description: "Lecteur audio connecté pour enfants.",
    stack: ["Raspberry Pi", "Go", "Vue 3"],
    url: "https://github.com/OhohLeo/hifi-baby",
  },
  {
    name: "Home server",
    year: 2022,
    description: "Serveur domestique auto-hébergé.",
    stack: ["Raspberry Pi", "XU4", "K3S", "Ansible"],
  },
];

// ---- Robeau : étude de cas (nœuds du schéma d'architecture) ----
export type ArchNode = {
  id: string;
  label: string;
  group: "device" | "core" | "front" | "ai" | "infra";
  x: number;
  y: number;
  text: string;
  tech: string[];
  /** À confirmer par Léo avant publication */
  todo?: boolean;
};

export const robeau = {
  pitch:
    "Robeau installe, supervise et pilote les consommations d'eau dans les bâtiments. J'y ai conçu et orchestré la plateforme de bout en bout : de la pose des équipements sur le terrain jusqu'à l'analyse des données.",
  metrics: [
    { value: "2 000+", label: "équipements supervisés" },
    { value: "18 mois", label: "de construction de la plateforme" },
    { value: "CTO", label: "fondateur" },
  ],
  nodes: [
    {
      id: "devices", label: "Équipements IoT", group: "device", x: 70, y: 150,
      text: "Compteurs, capteurs et passerelles posés dans les bâtiments, identifiés par leur EUI. Plus de 2 000 équipements supervisés.",
      tech: ["IoT"],
    },
    {
      id: "bus", label: "Bus de messages", group: "core", x: 260, y: 150,
      text: "NATS relie les microservices : ingestion, traitement et diffusion des événements.",
      tech: ["NATS"],
    },
    {
      id: "services", label: "Microservices", group: "core", x: 450, y: 70,
      text: "Plateforme de microservices Python que j'ai orchestrée : ingestion des mesures, règles métier, pilotage.",
      tech: ["Python"],
    },
    {
      id: "db", label: "Données", group: "core", x: 450, y: 230,
      text: "PostgreSQL pour l'état et l'historique, TimeFS pour les séries temporelles.",
      tech: ["PostgreSQL", "TimeFS"],
    },
    {
      id: "ai", label: "IA", group: "ai", x: 640, y: 70,
      text: "Intégration de Claude et de Google Document AI pour automatiser l'exploitation de documents et l'assistance.",
      tech: ["Claude", "Google Document AI"],
    },
    {
      id: "front", label: "Interfaces", group: "front", x: 640, y: 230,
      text: "Applications web assemblées à partir de composants : React, UmiJS, Ant Design, build MakoJS, stockage Buckets.",
      tech: ["React", "UmiJS", "Antd", "MakoJS"],
    },
    {
      id: "infra", label: "Infra & sécurité", group: "infra", x: 360, y: 340,
      text: "Déploiement sur GCE avec Docker et Ansible, supervision Grafana, scans de sécurité Trivy et ZAP.",
      tech: ["GCE", "Docker", "Ansible", "Grafana", "Trivy", "ZAP"],
    },
    {
      id: "backoffice", label: "Back-office terrain", group: "front", x: 160, y: 300,
      text: "Back-office de pose et suivi des équipements : chantiers, sites, interventions, emplacements, stock. (À valider avant publication.)",
      tech: ["Frappe", "ERPNext"],
      todo: true,
    },
  ] satisfies ArchNode[],
  links: [
    ["devices", "bus"], ["bus", "services"], ["services", "db"], ["services", "ai"],
    ["services", "front"], ["db", "front"], ["backoffice", "bus"], ["infra", "services"],
    ["infra", "db"],
  ] as [string, string][],
};
