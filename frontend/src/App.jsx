import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

const API_URL = "http://127.0.0.1:8000/api/eeg";

const CHART_COLORS = {
  normal: "#22c55e",
  critical: "#ef4444",
  archived: "#8b5cf6",
  blue: "#3b82f6",
};

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [archives, setArchives] = useState([]);
  const [archivePage, setArchivePage] = useState(1);
  const [archiveTotal, setArchiveTotal] = useState(0);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const [agentStatuses, setAgentStatuses] = useState({});

  const [loading, setLoading] = useState(true);

  const ARCHIVES_PER_PAGE = 20;

  /* =====================================================
     DASHBOARD
  ===================================================== */

  useEffect(() => {
    fetch(`${API_URL}/dashboard`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur serveur");
        }
        return response.json();
      })
      .then((data) => setDashboard(data))
      .catch((error) =>
        console.error("Erreur dashboard :", error)
      )
      .finally(() => setLoading(false));
  }, []);

  /* =====================================================
     PATIENTS
  ===================================================== */

  useEffect(() => {
    fetch(`${API_URL}/patients`)
      .then((response) => response.json())
      .then((data) => setPatients(data.patients || []))
      .catch((error) =>
        console.error("Erreur patients :", error)
      );
  }, []);

  /* =====================================================
     ALERTES
  ===================================================== */

  useEffect(() => {
    fetch(`${API_URL}/alerts`)
      .then((response) => response.json())
      .then((data) => setAlerts(data.alerts || []))
      .catch((error) =>
        console.error("Erreur alertes :", error)
      );
  }, []);

  /* =====================================================
     AGENTS STATUS
  ===================================================== */

  useEffect(() => {
    const fetchAgentStatuses = () => {
      fetch(`${API_URL}/agents/status`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Erreur statut agents");
          }

          return response.json();
        })
        .then((data) => {
          setAgentStatuses(data.agents || {});
        })
        .catch((error) =>
          console.error("Erreur statuts agents :", error)
        );
    };

    // Première récupération immédiate
    fetchAgentStatuses();

    // Actualisation toutes les 5 secondes
    const interval = setInterval(
      fetchAgentStatuses,
      5000
    );

    return () => clearInterval(interval);
  }, []);

  /* =====================================================
     ARCHIVES
  ===================================================== */

  useEffect(() => {
    setArchiveLoading(true);

    fetch(
      `${API_URL}/archives?page=${archivePage}&limit=${ARCHIVES_PER_PAGE}`
    )
      .then((response) => response.json())
      .then((data) => {
        setArchives(data.archives || []);
        setArchiveTotal(data.total || 0);
      })
      .catch((error) =>
        console.error("Erreur archives :", error)
      )
      .finally(() => setArchiveLoading(false));
  }, [archivePage]);

  /* =====================================================
     VALUES
  ===================================================== */

  const totalEEG = dashboard?.total_eeg ?? 0;
  const normalCount = dashboard?.normal ?? 0;
  const criticalCount = dashboard?.alerts ?? 0;
  const archivedCount = dashboard?.archived ?? archiveTotal;

  const totalArchivePages = Math.max(
    1,
    Math.ceil(archiveTotal / ARCHIVES_PER_PAGE)
  );

  /* =====================================================
     STORAGE CHART
  ===================================================== */

  const storageData = useMemo(
    () => [
      {
        name: "Normal",
        value: normalCount,
        color: CHART_COLORS.normal,
      },
      {
        name: "Critique",
        value: criticalCount,
        color: CHART_COLORS.critical,
      },
      {
        name: "Archivé",
        value: archivedCount,
        color: CHART_COLORS.archived,
      },
    ],
    [normalCount, criticalCount, archivedCount]
  );

  /* =====================================================
     ALERTS BY PATIENT
  ===================================================== */

  const alertsByPatient = useMemo(() => {
    const counter = {};

    alerts.forEach((alert) => {
      const patient = alert.patient_id || "Inconnu";

      counter[patient] = (counter[patient] || 0) + 1;
    });

    return Object.entries(counter).map(
      ([patient, count]) => ({
        patient,
        count,
      })
    );
  }, [alerts]);

  /* =====================================================
     AGENTS
  ===================================================== */

  const agents = [
    {
      name: "Acquisition",
      id: "acquisition",
      description: "Réception des données EEG",
      icon: "⇣",
    },
    {
      name: "Analyse",
      id: "analysis",
      description: "Détection des anomalies",
      icon: "⌁",
    },
    {
      name: "Décision",
      id: "decision",
      description: "Choix de la stratégie de stockage",
      icon: "◆",
    },
    {
      name: "Archivage",
      id: "archival",
      description: "Archivage des anciennes données",
      icon: "▣",
    },
  ];

  const activeAgentsCount = Object.values(
    agentStatuses
  ).filter((status) => status === "active").length;

  /* =====================================================
     PAGINATION
  ===================================================== */

  const goToPreviousPage = () => {
    if (archivePage > 1) {
      setArchivePage((page) => page - 1);
    }
  };

  const goToNextPage = () => {
    if (archivePage < totalArchivePages) {
      setArchivePage((page) => page + 1);
    }
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>

        <p>
          Chargement du système EEG...
        </p>
      </div>
    );
  }

  return (
    <div className="app">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="header">

        <div className="header-content">

          <div className="brand">

            <div className="brand-icon">
              EEG
            </div>

            <div>

              <h1>
                EEG Monitoring
              </h1>

              <p>
                Système Multi-Agent de gestion des EEG néonataux
              </p>

            </div>

          </div>

          <div className="system-status">

            <span className="status-dot"></span>

            Système opérationnel

          </div>

        </div>

      </header>

      <main className="container">

        {/* =================================================
            KPI
        ================================================= */}

        <section className="stats">

          <div className="stat-card">

            <div className="stat-icon blue">
              👶
            </div>

            <div className="stat-content">

              <span>
                Patients
              </span>

              <strong>
                {dashboard?.patients ?? 0}
              </strong>

              <small>
                patients surveillés
              </small>

            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon cyan">
              ◈
            </div>

            <div className="stat-content">

              <span>
                Total EEG
              </span>

              <strong>
                {totalEEG.toLocaleString()}
              </strong>

              <small>
                données collectées
              </small>

            </div>

          </div>

          <div className="stat-card critical-card">

            <div className="stat-icon red">
              !
            </div>

            <div className="stat-content">

              <span>
                Alertes critiques
              </span>

              <strong>
                {criticalCount.toLocaleString()}
              </strong>

              <small>
                anomalies détectées
              </small>

            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon purple">
              ▣
            </div>

            <div className="stat-content">

              <span>
                Archives
              </span>

              <strong>
                {archivedCount.toLocaleString()}
              </strong>

              <small>
                données archivées
              </small>

            </div>

          </div>

        </section>

        {/* =================================================
            AGENTS
        ================================================= */}

        <section className="panel agents-panel">

          <div className="panel-header">

            <div>

              <h2>
                Agents du système
              </h2>

              <p>
                État des agents multi-agents
              </p>

            </div>

            <div className="agents-online">

              <span></span>

              {activeAgentsCount} agent
              {activeAgentsCount > 1 ? "s" : ""} actif
              {activeAgentsCount > 1 ? "s" : ""}

            </div>

          </div>

          <div className="agents-grid">

            {agents.map((agent) => {

              const isActive =
                agentStatuses[agent.id] === "active";

              return (

                <div
                  className="agent-card"
                  key={agent.name}
                >

                  <div className="agent-icon">
                    {agent.icon}
                  </div>

                  <div className="agent-info">

                    <strong>
                      Agent {agent.name}
                    </strong>

                    <span>
                      {agent.description}
                    </span>

                  </div>

                  <div
                    className={`agent-status ${
                      isActive
                        ? "active"
                        : "inactive"
                    }`}
                  >

                    <span></span>

                    {isActive
                      ? "Actif"
                      : "Inactif"}

                  </div>

                </div>

              );
            })}

          </div>

        </section>

        {/* =================================================
            CHARTS
        ================================================= */}

        <section className="charts-grid">

          {/* STORAGE */}

          <div className="panel chart-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Répartition des données
                </h2>

                <p>
                  État des données EEG dans le système
                </p>

              </div>

            </div>

            <div className="chart-container">

              <ResponsiveContainer
                width="100%"
                height={300}
              >

                <PieChart>

                  <Pie
                    data={storageData}
                    cx="50%"
                    cy="48%"
                    innerRadius={72}
                    outerRadius={108}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >

                    {storageData.map(
                      (entry, index) => (

                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="none"
                        />

                      )
                    )}

                  </Pie>

                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid #26334a",
                      background: "#101827",
                      color: "#ffffff",
                    }}
                  />

                  <Legend />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </div>

          {/* ALERTS */}

          <div className="panel chart-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Alertes par patient
                </h2>

                <p>
                  Distribution des anomalies détectées
                </p>

              </div>

            </div>

            <div className="chart-container">

              {alertsByPatient.length === 0 ? (

                <div className="empty-state">
                  Aucune donnée disponible.
                </div>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >

                  <BarChart
                    data={alertsByPatient}
                    margin={{
                      top: 10,
                      right: 20,
                      left: -10,
                      bottom: 10,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#26334a"
                    />

                    <XAxis
                      dataKey="patient"
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 11,
                      }}
                      axisLine={{
                        stroke: "#334155",
                      }}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 11,
                      }}
                      axisLine={{
                        stroke: "#334155",
                      }}
                    />

                    <Tooltip
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid #26334a",
                        background: "#101827",
                        color: "#ffffff",
                      }}
                    />

                    <Bar
                      dataKey="count"
                      name="Alertes"
                      fill={CHART_COLORS.critical}
                      radius={[7, 7, 0, 0]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              )}

            </div>

          </div>

        </section>

        {/* =================================================
            PATIENTS
        ================================================= */}

        <section className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Patients
              </h2>

              <p>
                Patients actuellement surveillés
              </p>

            </div>

            <span className="count-badge">
              {patients.length} patient(s)
            </span>

          </div>

          {patients.length === 0 ? (

            <div className="empty-state">
              Aucun patient disponible.
            </div>

          ) : (

            <div className="patients">

              {patients.map((patient) => (

                <div
                  className="patient-card"
                  key={patient}
                >

                  <div className="patient-avatar">

                    {patient
                      .toString()
                      .slice(-2)}

                  </div>

                  <div className="patient-details">

                    <strong>
                      {patient}
                    </strong>

                    <span>
                      Surveillance EEG active
                    </span>

                  </div>

                  <div className="patient-status">

                    <span></span>

                    Actif

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* =================================================
            ALERTES
        ================================================= */}

        <section className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Alertes critiques
              </h2>

              <p>
                Dernières anomalies détectées
              </p>

            </div>

            <span className="critical-badge">
              {alerts.length} alertes
            </span>

          </div>

          {alerts.length === 0 ? (

            <div className="empty-state">
              Aucune alerte critique.
            </div>

          ) : (

            <div className="alerts">

              {alerts
                .slice(0, 10)
                .map((alert) => (

                  <div
                    className="alert"
                    key={alert._id}
                  >

                    <div className="alert-indicator">
                      !
                    </div>

                    <div className="alert-main">

                      <strong>
                        {alert.patient_id}
                      </strong>

                      <span>
                        Anomalie détectée
                      </span>

                    </div>

                    <div className="alert-info">

                      <span>
                        Step
                      </span>

                      <strong>
                        {alert.step}
                      </strong>

                    </div>

                    <div className="alert-info">

                      <span>
                        Amplitude
                      </span>

                      <strong>
                        {alert.max_amplitude}
                      </strong>

                    </div>

                    <span className="priority-badge">
                      {alert.priority}
                    </span>

                  </div>

                ))}

            </div>

          )}

        </section>

        {/* =================================================
            ARCHIVES
        ================================================= */}

        <section className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Archives EEG
              </h2>

              <p>
                Données archivées dans MinIO
              </p>

            </div>

            <span className="count-badge">
              {archiveTotal.toLocaleString()} archives
            </span>

          </div>

          {archiveLoading ? (

            <div className="empty-state">
              Chargement des archives...
            </div>

          ) : archives.length === 0 ? (

            <div className="empty-state">
              Aucune archive disponible.
            </div>

          ) : (

            <>

              <div className="archive-table-wrapper">

                <table className="archive-table">

                  <thead>

                    <tr>
                      <th>Patient</th>
                      <th>Step</th>
                      <th>Timestamp</th>
                      <th>Priorité</th>
                      <th>Amplitude</th>
                      <th>Fichier MinIO</th>
                    </tr>

                  </thead>

                  <tbody>

                    {archives.map((archive) => (

                      <tr key={archive._id}>

                        <td>
                          <strong>
                            {archive.patient_id}
                          </strong>
                        </td>

                        <td>
                          {archive.step}
                        </td>

                        <td>
                          {new Date(
                            archive.timestamp
                          ).toLocaleString()}
                        </td>

                        <td>

                          <span
                            className={
                              archive.priority ===
                              "CRITIQUE"
                                ? "priority-badge"
                                : "normal-badge"
                            }
                          >

                            {archive.priority}

                          </span>

                        </td>

                        <td>
                          {archive.max_amplitude}
                        </td>

                        <td className="archive-path">
                          {archive.archive_object}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

              <div className="pagination">

                <button
                  onClick={goToPreviousPage}
                  disabled={archivePage === 1}
                >
                  ← Précédent
                </button>

                <span>

                  Page{" "}

                  <strong>
                    {archivePage}
                  </strong>

                  {" "}sur{" "}

                  <strong>
                    {totalArchivePages}
                  </strong>

                </span>

                <button
                  onClick={goToNextPage}
                  disabled={
                    archivePage >= totalArchivePages
                  }
                >
                  Suivant →
                </button>

              </div>

            </>

          )}

        </section>

      </main>

      <footer className="footer">

        <p>
          EEG Multi-Agent System · Technologies de Stockage Big Data
        </p>

      </footer>

    </div>
  );
}

export default App;