# EEG Multi-Agent Big Data Storage System

Projet réalisé dans le cadre du module **Technologies de Stockage Big Data**.

L'objectif du projet est de concevoir une architecture distribuée capable de recevoir, analyser, prioriser et stocker des flux de données **EEG néonatales** en temps réel à l'aide d'un **système multi-agent**.

## Architecture

    Simulateur EEG
          │
          ▼
    Agent Acquisition
          │
          ▼
    Kafka - eeg-raw
          │
          ▼
    Agent Analyse
          │
     ┌────┴────┐
     ▼         ▼
    eeg-priority  eeg-alerts
         │
         ▼
    Agent Décision
         │
    ┌────┼───────────┐
    ▼    ▼           ▼
  Redis MongoDB     MinIO
    │    │           │
    └────┼───────────┘
         │
         ▼
    Agent Archivage
         │
         ▼
       FastAPI
         │
         ▼
    Dashboard React

## Système Multi-Agent

Le système est composé de quatre agents principaux :

- **Agent Acquisition** : génère et transmet les données EEG.
- **Agent Analyse** : analyse les signaux et détecte les anomalies.
- **Agent Décision** : détermine la stratégie de stockage selon la priorité.
- **Agent Archivage** : identifie et archive les anciennes données.

Les agents communiquent de manière asynchrone à l'aide de **Apache Kafka**.

### Communication entre les agents

    Acquisition
         │
         ▼
      eeg-raw
         │
         ▼
      Analyse
         │
         ├──────────────► eeg-alerts
         │
         ▼
    eeg-priority
         │
         ▼
      Décision
         │
         ▼
    Redis / MongoDB / MinIO
         │
         ▼
      Archivage

## Topics Kafka

| Topic | Description |
|---|---|
| `eeg-raw` | Flux brut des signaux EEG |
| `eeg-priority` | Résultats d'analyse et niveau de priorité |
| `eeg-alerts` | Alertes générées lors d'événements critiques |

## Stockage

Le projet utilise une approche de **Polyglot Persistence** afin d'adapter la technologie de stockage au type et à la priorité des données.

| Technologie | Utilisation |
|---|---|
| Redis | Cache et données critiques |
| MongoDB | Métadonnées et informations EEG |
| MinIO | Stockage des fichiers EEG et archivage |

### Politique de stockage

- **Critique** → Redis + MongoDB + MinIO
- **Normal** → MongoDB + MinIO
- **Ancien** → Archivage dans MinIO

Cette stratégie permet d'adapter le stockage à la criticité et au cycle de vie des données.

## Simulation EEG

Le projet utilise un simulateur permettant de générer artificiellement des données EEG afin de tester l'architecture sans utiliser de véritables capteurs.

Chaque donnée EEG simulée contient notamment :

- un identifiant patient ;
- un timestamp ;
- 16 canaux EEG ;
- un taux d'échantillonnage de 256 Hz ;
- les valeurs des signaux EEG ;
- un numéro de séquence (`step`).

Le système peut simuler plusieurs patients :

    P001
    P002
    PAT-2026-001
    PAT-2026-002
    PAT-2026-003

Les données sont envoyées continuellement vers Kafka via le topic `eeg-raw`.

Le simulateur peut également générer des valeurs anormales afin de tester la détection des événements critiques par l'agent d'analyse.

## API REST

Le backend FastAPI fournit plusieurs endpoints pour accéder aux données du système :

    POST /api/eeg
    GET  /api/eeg/{id}
    GET  /api/patients
    GET  /api/alerts
    GET  /api/dashboard
    GET  /api/agents/status

L'endpoint `/api/agents/status` permet notamment de consulter l'état des agents à partir des heartbeats enregistrés dans Redis.

## Dashboard

Le frontend est développé avec **React** et permet de superviser le système.

Il permet notamment de visualiser :

- les patients suivis ;
- les alertes ;
- l'activité des agents ;
- les informations EEG ;
- les informations liées au stockage ;
- l'état général du système.

## Technologies

### Backend

- Python
- FastAPI

### Système Multi-Agent

- Python
- Apache Kafka
- Communication asynchrone entre agents

### Streaming

- Apache Kafka
- Zookeeper

### Stockage

- MongoDB
- Redis
- MinIO

### Frontend

- React
- Chart.js

### Infrastructure

- Docker
- Docker Compose

## Structure du projet

    Projet-EEG-MultiAgent/
    │
    ├── agents/
    │   ├── acquisition/
    │   │   ├── agent.py
    │   │   ├── config.py
    │   │   └── producer.py
    │   │
    │   ├── analysis/
    │   │   ├── agent.py
    │   │   ├── analyzer.py
    │   │   └── consumer.py
    │   │
    │   ├── decision/
    │   │   ├── agent.py
    │   │   ├── consumer.py
    │   │   └── storage_policy.py
    │   │
    │   ├── archival/
    │   │   ├── agent.py
    │   │   └── archival_policy.py
    │   │
    │   ├── common/
    │   │   └── heartbeat.py
    │   │
    │   └── requirements.txt
    │
    ├── backend/
    │   ├── api/
    │   ├── services/
    │   └── main.py
    │
    ├── frontend/
    │
    ├── storage/
    │
    ├── docs/
    │
    ├── docker-compose.yml
    ├── .gitignore
    └── README.md

## Lancement du projet

### Prérequis

- Docker
- Docker Compose
- Git

### Cloner le projet

    git clone https://github.com/Ali9104/Projet-EEG-MultiAgent.git
    cd Projet-EEG-MultiAgent

### Lancer l'infrastructure

    docker compose up -d --build

### Vérifier l'état des services

    docker compose ps

Pour afficher également les conteneurs arrêtés :

    docker compose ps -a

### Arrêter les services

    docker compose down

> Ne pas utiliser `docker compose down -v` afin de conserver les données stockées dans les volumes MongoDB et MinIO.

## Big Data

L'architecture répond aux trois dimensions principales du Big Data :

- **Volume** : accumulation importante de signaux EEG provenant de plusieurs patients.
- **Vélocité** : génération et traitement continus des données EEG avec Kafka.
- **Variété** : présence de signaux EEG, métadonnées, niveaux de priorité et alertes.

L'utilisation combinée de **Kafka, MongoDB, Redis et MinIO** permet de construire une architecture distribuée adaptée au traitement et au stockage de flux de données EEG.

## Équipe

Projet réalisé dans le cadre du module **Technologies de Stockage Big Data**.

- **Ali Nouar**
- **Souhail El Bettachi**
- **Mohamed Bakkouri**
- **Youssef Benayad**
