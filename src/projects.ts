// Vue « zoom » des projets : fonctionnalités, architecture simplifiée et personas.
// Termes génériques uniquement : pas de nom de service interne, de client ni de fournisseur.
// L'identité (entreprise, période, rôle, technos) reste dans data.ts / Ghost ; le lien se fait par `id`.

export const GX = 20, GY = 20, DX = 190, DY = 110, NW = 150, NH = 66;

export type Kind = "device" | "core" | "data" | "front" | "ai" | "infra" | "ext";
export type IconType = "service" | "bus" | "db" | "ui" | "mobile" | "device" | "ai" | "infra" | "ext" | "file";
export type FeatureIconType = IconType | "bell" | "chart" | "sliders" | "workflow" | "tool" | "calendar";
export type ZNode = { id: string; x: number; y: number; kind: Kind; label: string; tech: string; text: string; parts: [string, string][] };
/** Étape d'une fonctionnalité : de `a` vers `b` (`b` vide = action interne au bloc `a`). */
export type Step = { a: string; b: string; t: string };
export type Feature = { id: string; icon: FeatureIconType; title: string; sum: string; steps: Step[] };
export type Persona = { name: string; x: number; y: number; role: string; to: string[] };
export type Project = {
  id: string;
  pitch: string;
  /** Icône par bloc quand elle diffère de celle de sa catégorie. */
  icons?: Record<string, IconType>;
  personas: Persona[];
  nodes: ZNode[];
  features: Feature[];
};

export const ICON_NAMES: Record<IconType, string> = {
  service: "Service", bus: "Bus de messages", db: "Base de données", ui: "Interface", mobile: "Appli mobile",
  device: "Équipement", ai: "IA & calcul", infra: "Infra", ext: "Tiers", file: "Fichier",
};
const KIND_ICON: Record<Kind, IconType> = { device: "device", core: "service", data: "db", front: "ui", ai: "ai", infra: "infra", ext: "ext" };
export const iconOf = (p: Project, n: ZNode): IconType => p.icons?.[n.id] ?? KIND_ICON[n.kind];

// Blocs et personas sont posés sur une grille (colonne, ligne).
const N = (id: string, c: number, r: number, kind: Kind, label: string, tech: string, text: string, parts: [string, string][]): ZNode =>
  ({ id, x: GX + c * DX, y: GY + r * DY, kind, label, tech, text, parts });
const F = (id: string, icon: FeatureIconType, title: string, sum: string, steps: [string, string, string][]): Feature =>
  ({ id, icon, title, sum, steps: steps.map(([a, b, t]) => ({ a, b, t })) });
const U = (name: string, c: number, r: number, role: string, to: string[]): Persona =>
  ({ name, x: GX + c * DX, y: GY + r * DY, role, to });

export const PROJECTS: Project[] = [
{
  id: "robeau",
  pitch: "Suivre les consommations d’eau des bâtiments, détecter les fuites et piloter les équipements à distance.",
  icons: { bus: "bus", terrain: "mobile" },
  personas: [U("Intervenant", 0, 1, "Pose les équipements et scanne les étiquettes", ["terrain"]), U("Pilote de chantiers", 0, 4, "Planifie interventions et stock", ["backoffice"]), U("Gestionnaire client", 3, 4, "Suit consommations, alertes et seuils de ses sites", ["web"])],
  nodes: [
    N("capteurs", 0, 0, "device", "Capteurs & compteurs", "radio longue portée", "Compteurs d'eau, capteurs et vannes posés dans les bâtiments. Ils émettent leurs relevés par radio longue portée.", [["Compteurs d'eau", "Relèvent les index de consommation"], ["Capteurs", "Mesures complémentaires dans le bâtiment"], ["Vannes pilotées", "Coupure d'eau à distance"]]),
    N("passerelle", 1, 0, "device", "Passerelles radio", "Linux embarqué", "Concentrateurs radio installés sur site. Un agent embarqué les configure et les met à jour sans intervention.", [["Concentrateur radio", "Reçoit les trames des capteurs"], ["Agent embarqué", "Pointage périodique signé, applique la configuration reçue"], ["Tunnel privé", "Rattache la passerelle au réseau privé du parc"], ["Mises à jour", "Paquets signés installés automatiquement"]]),
    N("reseau", 2, 0, "core", "Serveurs de réseau radio", "interne + tiers", "Authentifient les trames radio et les relaient à la plateforme. Un serveur interne cohabite avec plusieurs réseaux d'opérateurs.", [["Serveur interne", "Pour les passerelles du parc"], ["Réseaux tiers", "Reçus par abonnement ou par webhooks"], ["Broker de messages", "Transport chiffré, un certificat par passerelle"]]),
    N("ingestion", 3, 0, "core", "Ingestion des mesures", "Python", "Reçoit les trames de tous les réseaux, les décode et expose les mesures.", [["Réception", "Abonnements et webhooks entrants"], ["Décodeurs", "Traduisent chaque trame constructeur en mesures"], ["API de lecture", "Agrégations et interpolation"], ["Commandes", "Messages descendants vers les équipements"]]),
    N("parc", 1, 1, "infra", "Gestion du parc", "PKI · réseau privé", "Enrôle les passerelles, leur délivre leurs identités et distribue les mises à jour.", [["Enrôlement", "Vérifie les pointages signés, renvoie l'état désiré"], ["Coffre à secrets", "Clés racines et autorité de certification"], ["Réseau privé maillé", "Accès d'administration sans port exposé"], ["Dépôt de paquets", "Mises à jour signées"]]),
    N("bus", 2, 1, "core", "Bus d'événements", "NATS", "Relie les services : chaque mesure, alerte ou demande de calcul y circule sous forme d'événement.", [["Sujets d'événements", "Mesures reçues, alertes, notifications"], ["Files persistantes", "Jobs de calcul consommés à la demande"]]),
    N("stockage", 3, 1, "data", "Stockage", "PostgreSQL", "Une base relationnelle pour l'état et l'historique, découpée par domaine.", [["Séries de mesures", "Tables partitionnées dans le temps"], ["Référentiel", "Équipements, sites, groupes, seuils"], ["Cache", "Seuils et états transitoires"]]),
    N("notif", 1, 2, "ext", "E-mail & SMS", "prestataires tiers", "Canaux de notification des alertes.", [["E-mail", "Relais transactionnel"], ["SMS", "Alertes urgentes"]]),
    N("metier", 2, 2, "core", "Services métier", "Python", "Le même code tourne dans trois modes : API, traitement de flux et planificateur.", [["API métier", "Équipements, sites, groupes, seuils, alertes"], ["Traitement de flux", "Réagit aux événements du bus"], ["Planificateur", "Tâches récurrentes persistées"]]),
    N("calcul", 3, 2, "ai", "Calcul à la demande", "modèle de prévision", "Des workers lancés quand un job arrive et arrêtés dès qu'ils sont inactifs.", [["Seuils proposés", "Suggère des seuils d'alerte à partir de l'historique"], ["Prévisions", "Modèle de fondation pour séries temporelles"]]),
    N("backoffice", 0, 3, "front", "Back-office chantiers", "ERP open source", "Organise la pose des équipements : chantiers, interventions, stock.", [["Chantiers & sites", "Planification des poses"], ["Interventions", "De la planification à la clôture"], ["Stock", "Équipements par dépôt et par véhicule"], ["Liens publics", "Le client confirme sans créer de compte"]]),
    N("ia", 1, 3, "ai", "Services d'IA", "Claude · Document AI", "Modèles appelés pour lire ce que les humains photographient ou déposent.", [["Lecture d'étiquettes", "Extrait l'identifiant depuis une photo"], ["Lecture de documents", "Extraction de données structurées"]]),
    N("api", 2, 3, "core", "Portail d'API & identité", "passerelle d'API · SSO", "Point d'entrée unique : authentifie puis route vers les services.", [["Passerelle d'API", "Jetons et clés d'API, routage"], ["Gestion d'identité", "Comptes et organisations"], ["Fédération SSO", "Connexion via l'annuaire du client"]]),
    N("infra", 3, 3, "infra", "Déploiement & supervision", "Docker · Ansible", "Tout l'outillage qui livre et surveille la plateforme.", [["Déploiement", "Conteneurs livrés par playbooks"], ["Observabilité", "Métriques, journaux, tableaux de bord"], ["Sécurité", "Scans d'images et tests d'intrusion automatisés"], ["Intégration continue", "Tests et livraisons par pipeline"]]),
    N("terrain", 0, 2, "front", "Appli terrain", "mobile · hors ligne", "L'outil des intervenants qui posent les équipements.", [["Mode hors ligne", "Saisie sans réseau, synchronisation au retour"], ["Scan d'étiquettes", "Identifie l'équipement posé"]]),
    N("assistant", 1, 4, "ai", "Assistant IA", "protocole MCP", "Un assistant conversationnel interroge et modifie le back-office avec les droits de l'utilisateur connecté.", [["Connecteur d'outils", "Expose les actions du back-office"], ["Droits délégués", "Agit au nom de l'utilisateur, jamais au-delà"]]),
    N("web", 2, 4, "front", "Interface web", "React", "Le tableau de bord des gestionnaires de bâtiments.", [["Tableaux de bord", "Consommations par groupe et par site"], ["Alertes & seuils", "Réglage et suivi"], ["Cartographie", "Sites et équipements sur la carte"], ["Pilotage", "Vannes et configuration des équipements"]]),
  ],
  features: [
    F("collecte", "device", "Collecte des mesures", "Du compteur à la base de données, quel que soit le réseau radio.", [["capteurs", "passerelle", "Le capteur émet son relevé par radio."], ["passerelle", "reseau", "La passerelle relaie la trame sur un canal chiffré."], ["reseau", "ingestion", "Le serveur de réseau authentifie la trame et la transmet."], ["ingestion", "stockage", "La trame est décodée puis enregistrée."], ["ingestion", "bus", "Un événement « mesure reçue » est publié."]]),
    F("alertes", "bell", "Alertes de consommation", "Une fuite ou une surconsommation déclenche une notification.", [["bus", "metier", "Le traitement de flux reçoit chaque mesure."], ["metier", "stockage", "Il la compare aux seuils du site."], ["metier", "notif", "En cas de dépassement, l'alerte part par e-mail ou SMS."]]),
    F("pilotage", "sliders", "Suivi & pilotage", "Les gestionnaires consultent leurs sites et agissent à distance.", [["web", "api", "L'utilisateur se connecte, au besoin via le SSO de son entreprise."], ["api", "metier", "La requête authentifiée est routée vers l'API métier."], ["metier", "stockage", "Les consommations sont agrégées par site et par groupe."], ["metier", "bus", "Une commande de vanne est publiée."], ["bus", "ingestion", "Elle redescend vers l'équipement par le réseau radio."]]),
    F("previsions", "ai", "Prévisions & seuils proposés", "L'historique sert à prévoir la consommation et à suggérer des seuils.", [["metier", "bus", "Une demande de calcul est mise en file."], ["bus", "calcul", "Un worker démarre à la demande."], ["calcul", "stockage", "Il lit l'historique des mesures."], ["calcul", "bus", "Le résultat revient sous forme d'événement."]]),
    F("parc", "infra", "Parc de passerelles", "Des passerelles enrôlées, mises à jour et administrées sans rien exposer.", [["passerelle", "parc", "La passerelle pointe périodiquement avec une requête signée."], ["parc", "", "Le service vérifie la signature et émet les certificats."], ["parc", "passerelle", "Elle reçoit son état désiré : identités, configuration, mises à jour."], ["passerelle", "reseau", "Elle publie alors ses trames avec son propre certificat."]]),
    F("pose", "tool", "Pose sur le terrain", "L'intervenant pose, photographie, et le stock se met à jour.", [["terrain", "backoffice", "L'intervenant saisit sa pose, même hors ligne."], ["backoffice", "ia", "La photo de l'étiquette est lue par un modèle de vision."], ["backoffice", "", "L'équipement est rattaché à son emplacement, le stock est mis à jour."], ["assistant", "backoffice", "Un assistant IA peut interroger le back-office au nom de l'utilisateur."]]),
    F("exploitation", "infra", "Déploiement & supervision", "Livrer souvent, surveiller en continu.", [["infra", "metier", "Chaque service est livré en conteneur par un pipeline."], ["infra", "calcul", "Les jobs de calcul sont lancés à la demande."], ["infra", "", "Métriques, journaux et scans de sécurité alimentent les tableaux de bord."]]),
  ],
},
{
  id: "qos",
  pitch: "Centraliser les données des parcs solaires et éoliens pour suivre leur performance et alerter les exploitants.",
  icons: { bus: "bus", file: "bus" },
  personas: [U("Exploitant", 0, 1, "Suit sites, mesures et contrats", ["monolithe"]), U("Client", 1, 4, "Consulte ses centrales et ses événements", ["front"]), U("Équipe dev / SRE", 3, 4, "Développe, déploie et exploite la plateforme", ["gitops"])],
  nodes: [
    N("sources", 0, 0, "ext", "Sources de données", "fichiers · trames · SaaS", "Tout ce qui produit des mesures sur les centrales.", [["Équipements", "Onduleurs, enregistreurs, compteurs"], ["Dépôts de fichiers", "Relevés déposés par transfert"], ["Plateformes tierces", "Portails constructeurs, gestionnaire de réseau"]]),
    N("collecte", 1, 0, "core", "Chaîne de collecte", "Go", "Transforme des formats très variés en mesures homogènes.", [["Aiguillage", "Choisit le décodeur selon la source"], ["Décodeurs scriptés", "Une centaine de formats, ajoutés sans redéployer"], ["Synchronisations", "Fichiers, e-mails, bases, protocoles industriels"]]),
    N("file", 2, 0, "core", "File de messages", "AMQP", "Découple la collecte des calculs.", [["Fichiers à traiter", "Entrées de la collecte"], ["Jobs de calcul", "Demandes de recalcul et de rejeu"]]),
    N("calcul", 3, 0, "core", "Moteur de calcul", "Go", "Calcule les indicateurs des capteurs, au fil de l'eau ou sur l'historique.", [["Temps réel", "Indicateurs calculés à l'arrivée des mesures"], ["Historique", "Recalculs sur de longues périodes"], ["Répartiteur de jobs", "Distribue et acquitte le travail"]]),
    N("monolithe", 1, 1, "front", "Application historique", "Ruby on Rails", "Le monolithe d'origine, toujours en service pendant la migration.", [["Interface web", "Suivi des sites et des contrats"], ["Tâches de fond", "Traitements différés"], ["API REST", "Référentiel exposé aux autres services"]]),
    N("base", 2, 1, "data", "Base historique", "MySQL partitionné", "La base du monolithe : référentiel et mesures.", [["Référentiel", "Sites, centrales, capteurs"], ["Mesures", "Réparties sur plusieurs partitions"], ["Réplica", "Lectures déportées"]]),
    N("evts", 3, 1, "core", "Événements & règles", "Go · PostgreSQL", "Détecte, qualifie et notifie ce qui se passe sur les centrales.", [["Événements", "Création, catégorisation, statistiques"], ["Règles", "Conditions définies par l'exploitant"], ["Notifications", "E-mails aux bons destinataires"]]),
    N("algos", 0, 2, "ai", "Plateforme d'algorithmes", "Python · Redis", "Exécute des algorithmes d'analyse sur les données de production.", [["Exécution planifiée", "Tâches distribuées"], ["Exécution manuelle", "En ligne de commande"], ["Algorithmes", "Éolien et solaire"]]),
    N("cdc", 1, 2, "core", "Synchronisation", "capture de changements", "Le pont entre l'ancien et le nouveau monde : chaque modification de la base historique devient un événement.", [["Capture du journal", "Lit les changements de la base"], ["Table d'identifiants", "Anciens ↔ nouveaux"], ["Rejeu", "Reconstruit l'état depuis le début"], ["Audit", "Mesure l'écart entre les deux mondes"]]),
    N("bus", 2, 2, "core", "Bus d'événements", "Kafka", "La colonne vertébrale des nouveaux services.", [["Flux typés", "Schémas versionnés dans un registre"], ["Flux de synchro", "Changements venus de la base historique"]]),
    N("metier", 3, 2, "core", "Services métier", "Go · gRPC", "Les nouveaux microservices, un par domaine.", [["Référentiel", "Sites, centrales, capteurs"], ["Mesures", "Lecture des séries"], ["Compteurs", "Autorisations d'accès aux données, documents à signer"]]),
    N("tierce", 0, 3, "ext", "Plateforme de données", "tierce", "Entrepôt de séries temporelles éolien et solaire.", [["Séries temporelles", "Lues par les algorithmes"], ["Résultats", "Réinjectés après calcul"]]),
    N("auth", 1, 3, "core", "Authentification", "Go", "Service d'identité commun aux nouvelles interfaces.", [["Sessions", "Connexion et renouvellement"], ["Double facteur", "Seconde étape de vérification"], ["Utilisateurs", "Comptes et droits"]]),
    N("bff", 2, 3, "core", "API d'agrégation", "Go", "Une API taillée pour le portail : un seul appel côté navigateur, plusieurs services derrière.", [["Agrégation", "Compose les réponses de plusieurs services"], ["Contrôle des jetons", "Avec les clés publiques de l'authentification"]]),
    N("gitops", 3, 3, "infra", "Déploiement GitOps", "Kubernetes", "L'état de la production est décrit dans Git.", [["Dépôt Git", "Décrit l'état voulu du cluster"], ["Réconciliation", "Le cluster s'aligne tout seul"], ["Dépendances", "Mises à jour proposées automatiquement"]]),
    N("front", 2, 4, "front", "Portail web", "React", "La nouvelle interface des exploitants.", [["Sites & mesures", "Courbes et indicateurs"], ["Événements", "Suivi et acquittement"], ["Règles", "Configuration par l'exploitant"]]),
  ],
  features: [
    F("collecte", "device", "Collecte multi-sources", "Une centaine de formats en entrée, une seule forme de mesure en sortie.", [["sources", "collecte", "Fichiers, trames et relevés arrivent par de nombreux canaux."], ["collecte", "", "Un aiguillage choisit le décodeur adapté au format."], ["collecte", "base", "Les mesures décodées sont enregistrées."], ["collecte", "file", "Une demande de calcul est publiée."]]),
    F("calcul", "chart", "Calcul des indicateurs", "Des mesures brutes aux indicateurs de performance.", [["file", "calcul", "Le répartiteur distribue les jobs."], ["calcul", "base", "Lecture des mesures brutes, écriture des indicateurs."], ["calcul", "evts", "Les règles sont évaluées sur les nouvelles valeurs."]]),
    F("evenements", "bell", "Événements, règles & notifications", "Prévenir la bonne personne quand une centrale décroche.", [["calcul", "evts", "Une valeur anormale crée un événement."], ["evts", "bus", "L'événement est publié, catégorisé puis compté."], ["evts", "", "Les règles de l'exploitant décident qui prévenir, par e-mail."]]),
    F("migration", "workflow", "Du monolithe aux microservices", "Les nouveaux services grandissent à côté de l'application historique, sans coupure.", [["monolithe", "base", "L'application historique continue d'écrire dans sa base."], ["base", "cdc", "Chaque changement est capturé dans le journal de la base."], ["cdc", "bus", "Il devient un événement, avec de nouveaux identifiants."], ["bus", "metier", "Les nouveaux services construisent leur vue à partir du flux."], ["cdc", "", "Un audit mesure en continu l'écart entre les deux mondes."]]),
    F("portail", "ui", "Portail unifié", "Une interface moderne posée sur les nouveaux services.", [["front", "auth", "Connexion avec double facteur."], ["front", "bff", "Le portail n'appelle qu'une seule API."], ["bff", "metier", "Elle interroge les services en gRPC et assemble la réponse."]]),
    F("algorithmes", "ai", "Algorithmes éolien & solaire", "Une plateforme pour exécuter les algorithmes d'analyse.", [["algos", "", "Les algorithmes sont planifiés ou lancés à la main."], ["algos", "tierce", "Ils lisent les séries, calculent, puis réinjectent les résultats."]]),
    F("deploiement", "infra", "Déploiement continu", "Un changement poussé dans Git arrive en production sans geste manuel.", [["gitops", "", "L'état voulu est décrit dans un dépôt."], ["gitops", "metier", "Le cluster s'aligne automatiquement sur chaque changement."]]),
  ],
},
{
  id: "entech",
  pitch: "Superviser et piloter des installations industrielles avec une solution configurable pour chaque site.",
  icons: { classeur: "file" },
  personas: [U("Superviseur distant", 0, 0, "Consulte et pilote à distance", ["distant"]), U("Opérateur de site", 2, 0, "Pilote l'installation sur l'écran tactile", ["ihm"]), U("Intégrateur", 0, 1, "Configure l'affaire, dessine et met en service", ["classeur", "editeur"])],
  nodes: [
    N("distant", 1, 0, "front", "Accès distant", "partage d'écran · web", "Suivre et piloter l'installation sans être sur site.", [["Partage d'écran", "L'écran du site, vu à distance"], ["Accès web", "Consultation depuis un navigateur"]]),
    N("services", 3, 0, "ext", "Historique & alertes", "séries temporelles · SMS", "Services auxquels l'écran de supervision s'adosse.", [["Séries temporelles", "Archive des mesures"], ["Passerelle SMS", "Alertes envoyées aux astreintes"]]),
    N("editeur", 1, 1, "front", "Éditeur de synoptiques", "Qt / C++", "Outil graphique pour dessiner le schéma animé de chaque installation.", [["Symboles vectoriels", "Éléments réutilisables d'une affaire à l'autre"], ["Export", "Schéma décrit dans un fichier lu par l'écran"]]),
    N("ihm", 2, 1, "front", "IHM de supervision", "Qt / C++ · Raspberry Pi", "L'application plein écran de l'opérateur, sur écran tactile.", [["Socle commun", "Graphes, événements, accès, exports"], ["Client temps réel", "Dialogue avec le régulateur"], ["Écrans de l'affaire", "Menus, paramètres et synoptique propres au site"]]),
    N("simreg", 3, 1, "core", "Simulateur de régulateur", "Go", "Permet de développer l'écran sans régulateur ni matériel.", [["Faux régulateur", "Répond comme le vrai"]]),
    N("classeur", 0, 2, "data", "Classeur de configuration", "tableur", "La source de vérité d'une affaire : un simple tableur décrit appareils, communications, variables et registres.", [["Appareils", "Ce qui est installé sur le site"], ["Communication", "Liaisons et adresses"], ["Variables & registres", "Ce qui est lu, écrit, affiché"]]),
    N("generateur", 1, 2, "core", "Générateur de code", "Perl", "Transforme le classeur en code source prêt à compiler.", [["Lecture du classeur", "Appareils, variables, registres"], ["Code du régulateur", "Définitions et squelettes d'automates"], ["Code de l'IHM", "Arborescence et écrans de l'affaire"]]),
    N("regulateur", 2, 2, "core", "Régulateur temps réel", "C", "Le cœur de l'installation : il lit, décide et commande en continu.", [["Deux cadences", "Une boucle rapide, une boucle lente"], ["Automates & PID", "Séquences et régulation"], ["Maître de bus", "Interroge les appareils"], ["Serveur de données", "Alimente l'écran de supervision"]]),
    N("appareils", 3, 2, "device", "Appareils de terrain", "Modbus", "Le matériel de l'installation, joint par bus de terrain.", [["Automates", "Équipements programmables du site"], ["Variateurs", "Commande des moteurs"], ["Compteurs & capteurs", "Mesures de l'installation"]]),
    N("simapp", 1, 3, "core", "Simulateur d'appareils", "Go · Angular", "Remplace le matériel pendant la mise au point.", [["Faux appareils", "Exposent les registres décrits dans le classeur"], ["Console web", "Force les valeurs pendant les essais"]]),
  ],
  features: [
    F("generation", "file", "Une affaire, un classeur", "Décrire l'installation dans un tableur suffit à générer le socle de l'affaire.", [["classeur", "generateur", "L'intégrateur décrit l'installation dans un tableur."], ["generateur", "regulateur", "Le code du régulateur est généré."], ["generateur", "ihm", "Les écrans de l'affaire aussi."]]),
    F("supervision", "ui", "Supervision sur écran tactile", "L'opérateur voit l'installation et la commande depuis l'écran local.", [["ihm", "regulateur", "L'écran lit les données et envoie les commandes."], ["regulateur", "appareils", "Le régulateur interroge et pilote les appareils."]]),
    F("regulation", "sliders", "Régulation temps réel", "Lire, décider, commander, en boucle.", [["regulateur", "appareils", "Le maître de bus lit les entrées."], ["regulateur", "", "Automates et régulateurs PID calculent, sur deux cadences."], ["regulateur", "appareils", "Les consignes sont écrites vers les appareils."]]),
    F("synoptiques", "ui", "Synoptiques sur mesure", "Chaque site a son schéma animé, dessiné sans coder.", [["editeur", "", "L'intégrateur dessine l'installation avec des symboles vectoriels."], ["editeur", "ihm", "L'écran anime le schéma avec les valeurs en direct."]]),
    F("simulation", "tool", "Tester sans matériel", "Deux simulateurs permettent de valider une affaire au bureau.", [["classeur", "simapp", "Le simulateur lit le même classeur que le générateur."], ["simapp", "regulateur", "Il se substitue aux appareils face au régulateur."], ["ihm", "simreg", "Côté écran, un faux régulateur permet de développer l'IHM seule."]]),
    F("exploitation", "infra", "Historique, alertes & accès distant", "Garder la mémoire de l'installation et y accéder de loin.", [["ihm", "services", "Les mesures sont archivées, les alertes partent par SMS."], ["distant", "ihm", "L'écran se consulte et se pilote à distance."]]),
  ],
},
{
  id: "ijenko",
  pitch: "Suivre les consommations du logement et piloter ses équipements depuis une application mobile.",
  icons: { webapp: "mobile" },
  personas: [U("Habitant", 1, 0, "Pilote son logement et suit ses consommations", ["webapp"]), U("Opérateur du service", 3, 3, "Gère comptes, boîtiers et lieux", ["bo"])],
  nodes: [
    N("compteur", 0, 0, "device", "Compteur électrique", "téléinformation", "Le compteur du logement, lu en direct par le boîtier.", [["Sortie d'information", "Index et puissance en continu"]]),
    N("webapp", 2, 0, "front", "Application mobile", "Angular · TypeScript", "L'application web pour mobile de l'habitant.", [["Pilotage", "Équipements et scénarios"], ["Consommations", "Graphiques de suivi"], ["Programmes", "Calendrier hebdomadaire"]]),
    N("sdk", 3, 0, "core", "SDK client", "TypeScript", "Bibliothèque qui encapsule l'accès à l'API pour les interfaces.", [["Sessions", "Utilisateur et back-office"], ["Modèles typés", "Équipements, lieux, programmes"]]),
    N("zigbee", 0, 1, "device", "Capteurs sans fil", "ZigBee · C", "Prises, capteurs et compteurs d'impulsions en réseau maillé, avec leur micrologiciel.", [["Coordinateur", "Forme et tient le réseau maillé"], ["Prises & capteurs", "Mesure et commande"], ["Impulsions", "Comptage d'énergie"], ["Mise à jour", "Chargeur de démarrage"]]),
    N("box", 1, 1, "device", "Boîtier domotique", "Perl · Linux embarqué", "Le cerveau local du logement : il parle à tous les équipements et applique les règles.", [["Pilotes radio", "Un module par protocole"], ["Moteur de règles", "Scénarios exécutés localement"], ["Calendrier", "Programmes horaires"], ["Système", "Image Linux sur mesure"]]),
    N("hub", 2, 1, "core", "Hub de connexion", "Go", "Tient une connexion permanente avec chaque boîtier.", [["Canaux permanents", "Un canal chiffré par boîtier"], ["Relais d'ordres", "De l'API vers le bon boîtier"], ["Remontées", "Mesures et états vers l'API"]]),
    N("api", 3, 1, "core", "API REST", "Go", "Le point d'entrée de la plateforme, pour les habitants comme pour l'exploitation.", [["API utilisateur", "Équipements, lieux, programmes"], ["API back-office", "Comptes et boîtiers"], ["Contrat d'interface", "Spécification validée automatiquement"]]),
    N("tiers", 0, 2, "ext", "Objets connectés tiers", "thermostats · éclairage", "Produits d'autres fabricants intégrés au même modèle.", [["Thermostats", "Chauffage"], ["Éclairage", "Ampoules connectées"], ["Capteurs divers", "Autres fabricants"]]),
    N("boxop", 1, 2, "device", "Box opérateur", "Java embarqué", "La même application portée sur la box Internet d'un opérateur télécom.", [["Portage modulaire", "Mêmes fonctions, autre plateforme"]]),
    N("base", 2, 2, "data", "Base de données", "MySQL", "L'état de la plateforme et l'historique des logements.", [["Comptes & lieux", "Qui habite où"], ["Équipements", "Ce qui est installé"], ["Historiques", "Valeurs des attributs dans le temps"]]),
    N("bo", 3, 2, "front", "Back-office", "exploitation", "L'outil des opérateurs du service.", [["Comptes", "Création et support"], ["Boîtiers", "Association aux lieux"]]),
  ],
  features: [
    F("pilotage", "sliders", "Piloter son logement", "Un geste sur le téléphone, une prise qui s'éteint à la maison.", [["webapp", "sdk", "L'habitant appuie sur un équipement."], ["sdk", "api", "L'ordre arrive à l'API."], ["api", "hub", "Elle le confie au hub, qui sait quel boîtier est connecté."], ["hub", "box", "L'ordre descend par le canal chiffré."], ["box", "zigbee", "Le boîtier commande la prise ou le thermostat."]]),
    F("consommations", "chart", "Suivre ses consommations", "Du compteur au graphique.", [["compteur", "box", "Le boîtier lit le compteur en continu."], ["zigbee", "box", "Les prises remontent leurs mesures."], ["box", "hub", "Les valeurs partent vers la plateforme."], ["hub", "api", "Le hub les transmet à l'API."], ["api", "base", "Elles sont historisées."]]),
    F("scenarios", "calendar", "Scénarios & programmes", "Des règles composées en ligne, exécutées dans le logement.", [["webapp", "sdk", "L'habitant compose un programme."], ["sdk", "api", "Il est enregistré par l'API."], ["api", "hub", "L'API le pousse vers le boîtier concerné."], ["hub", "box", "Règles et calendrier sont transmis."], ["box", "", "Le boîtier les exécute localement."]]),
    F("protocoles", "device", "Plateforme multi-protocoles", "Un seul modèle d'équipement, quelle que soit la technologie.", [["zigbee", "box", "Réseau maillé sans fil."], ["compteur", "box", "Liaison directe avec le compteur."], ["tiers", "box", "Produits d'autres fabricants."], ["box", "", "Un pilote par protocole, un modèle commun."]]),
    F("operateur", "device", "Portage sur box opérateur", "Le service embarqué dans la box Internet d'un opérateur.", [["boxop", "", "L'application embarquée est portée sur une autre plateforme."], ["boxop", "hub", "Elle parle le même protocole au même hub."]]),
    F("exploitation", "infra", "Exploitation du service", "Les opérateurs gèrent comptes et boîtiers.", [["bo", "api", "L'opérateur gère comptes, boîtiers et lieux."], ["api", "base", "Les changements sont enregistrés."]]),
  ],
},
];
