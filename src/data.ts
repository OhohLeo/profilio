// Source unique du contenu. Issu du CV 2025 de Léo Martin.
// Volontairement absents : adresse, téléphone, âge, situation familiale.

export const profile = {
  name: "Léo Martin",
  title: "Product Builder Engineer",
  tagline: "Go / Python – IA – Microservices – Cloud – IoT",
  summary: "Ingénieur passionné par la création de produits de bout en bout, de l'embarqué au cloud, combinant IoT, backend et IA.",
  email: "lmartin.leo@gmail.com",
  website: "https://me.filou.org",
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
      "Déploiement d'une plateforme de gestion des passerelles LoRaWAN (ChirpStack, Nebula).",
      "Back-office : gestion des stocks et des interventions, mobilapp & site personnalisé (ERPNext, React, Capacitor, Antd).",
    ],
    stack: [
      "Python", "PostgreSQL", "NATS", "Claude", "React", "UmiJS", "Antd", "MakoJS",
      "Google Document AI", "TimeFS", "GCE", "Docker", "Grafana", "Ansible", "Trivy", "ZAP", "LoRaWAN", "ChirpStack", "Nebula", "ERPNext", "Capacitor",
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
  "API REST / gRPC", "Kafka / NATS", "Docker", "Git / GitLab-CI",
];

// Synthèse pour le PDF d'une page ; le site conserve le détail des missions.
export const resumeHighlights: Record<string, string[]> = {
  robeau: [
    "Conception et orchestration d'une plateforme IoT microservices : Python, PostgreSQL et NATS.",
    "Intégration des interfaces React et de solutions IA (Claude, Google Document AI, TimeFS).",
    "Déploiement et supervision cloud : GCE, Docker, Grafana, Ansible ; sécurité avec Trivy et ZAP.",
    "Déploiement d'une plateforme de gestion des passerelles LoRaWAN (ChirpStack, Nebula).",
    "Back-office : gestion des stocks et des interventions, mobilapp & site personnalisé (ERPNext, React, Capacitor, Antd).",
  ],
  qos: [
    "Migration d'un monolithe vers des microservices Go/gRPC sur GKE et Kubernetes.",
    "Traitement de flux Kafka (Go, Scala), APIs REST (Go, Ruby/Rails, MySQL, PostgreSQL).",
    "Plateforme d'exécution d'algorithmes en Python et Redis.",
  ],
  entech: [
    "Supervisions embarquées configurables : Qt/C++, Perl, Raspberry Pi et Modbus.",
    "Simulateurs de test en Go/Angular et mise en service chez les clients.",
  ],
  ijenko: [
    "Plateforme domotique multi-protocolaire en Perl et APIs REST en Go/Perl/MySQL.",
    "WebApp mobile Angular/TypeScript ; protocole ZigBee en C et intégration de capteurs tiers.",
  ],
};

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
