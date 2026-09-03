# EEG Multi-Agent Big Data Storage System

Projet réalisé dans le cadre du module **Technologies de Stockage Big Data**.

L'objectif est de concevoir une architecture distribuée capable de recevoir, analyser, prioriser et stocker des flux de données **EEG néonatales** en temps réel à l'aide d'un **système multi-agent**.

## Architecture

```text
Capteurs / Simulateur EEG
          │
          ▼
       FastAPI
          │
          ▼
        Kafka
          │
          ▼
   Système Multi-Agent
          │
    ┌─────┼─────┐
    ▼     ▼     ▼
  Redis MongoDB MinIO
          │
          ▼
    Dashboard React
```

## Système Multi-Agent

Le système est composé de quatre agents principaux :

- **Agent Acquisition** : réception des données EEG.
- **Agent Analyse** : détection des anomalies et calcul du niveau de priorité.
- **Agent Décision** : choix de la stratégie de stockage.
- **Agent Archivage** : archivage des anciennes données EEG.

Les agents communiquent de manière asynchrone à l'aide de **Apache Kafka**.

## Topics Kafka

| Topic | Description |
|---|---|
| `eeg-raw` | Flux brut des signaux EEG |
| `eeg-priority` | Résultats d'analyse et niveau de priorité |
| `eeg-alerts` | Alertes générées pour les événements critiques |

## Stockage

Le projet utilise une approche de **Polyglot Persistence** afin d'adapter la technologie de stockage au type et à la priorité des données.

| Technologie | Utilisation |
|---|---|
| Redis | Cache et données critiques |
| MongoDB | Métadonnées EEG |
| MinIO | Stockage des fichiers EEG |

### Politique de stockage

- **Critique** → Redis + MongoDB + MinIO
- **Normal** → MongoDB + MinIO
- **Ancien** → Archivage MinIO

## Technologies

### Backend

- Python
- FastAPI

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

```text
projetECC/
│
├── agents/
│   ├── simulator.py
│   └── requirements.txt
│
├── backend/
│
├── frontend/
│
├── storage/
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Simulation EEG

Le projet utilise un simulateur permettant de générer artificiellement des données EEG afin de tester l'architecture sans utiliser de véritables capteurs.

Les données simulées sont envoyées vers Kafka via le topic :

```text
eeg-raw
```

Le système peut également simuler des anomalies afin de tester la détection et la gestion des données critiques.

## API REST

Les endpoints prévus sont :

```text
POST /api/eeg
GET  /api/eeg/{id}
GET  /api/patients
GET  /api/alerts
GET  /api/dashboard
```

## Lancement de l'infrastructure

Prérequis :

- Docker
- Docker Compose

Lancer les services :

```bash
docker compose up -d
```

Vérifier leur état :

```bash
docker compose ps
```

Arrêter les services :

```bash
docker compose down
```

## Big Data

L'architecture répond aux trois dimensions principales du Big Data :

- **Volume** : accumulation importante de signaux EEG.
- **Vélocité** : traitement d'un flux continu en temps réel avec Kafka.
- **Variété** : signaux EEG, métadonnées et alertes.

L'utilisation combinée de Kafka, MongoDB, Redis et MinIO permet de construire une architecture distribuée adaptée au traitement et au stockage de données EEG à grande échelle.



## Équipe

Projet réalisé dans le cadre du module **Technologies de Stockage Big Data**.

- **Ali Nouar**
- **Souhail El Bettachi**
- **Mohamed Bakkouri**
- **Youssef Benayad**
