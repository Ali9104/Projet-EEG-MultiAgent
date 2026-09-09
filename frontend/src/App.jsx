import { useEffect, useMemo, useState, useCallback, memo } from "react";
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

const API_URL = import.meta.env?.VITE_API_URL || "http://127.0.0.1:8000/api/eeg";

const CHART_COLORS = {
  normal: "#22c55e",
  critical: "#ef4444",
  archived: "#8b5cf6",
  blue: "#3b82f6",
};

const TRACE_PATHS = {
  patients: "0,14 8,14 16,6 20,22 24,14 34,14 42,6 46,22 50,14 64,14",
  volume: "0,14 4,10 8,18 12,8 16,20 20,10 24,16 28,8 32,18 36,10 40,16 44,8 48,18 52,12 56,16 60,10 64,14",
  critical: "0,14 8,14 12,2 16,26 20,14 32,14 38,3 42,25 46,14 64,14",
  archived: "0,9 8,19 16,11 24,17 32,13 40,14 48,14 56,14 64,14",
};

const AGENTS_METADATA = [
  { name: "Acquisition", id: "acquisition", description: "Réception des données EEG", icon: "⇣" },
  { name: "Analyse", id: "analysis", description: "Détection des anomalies", icon: "⌁" },
  { name: "Décision", id: "decision", description: "Choix de la stratégie de stockage", icon: "◆" },
  { name: "Archivage", id: "archival", description: "Archivage des anciennes données", icon: "▣" },
];

const ARCHIVES_PER_PAGE = 20;

// Composants secondaires extraits
const Trace = memo(({ shape, className }) => (
  <svg className={`stat-trace ${className}`} viewBox="0 0 64 28" preserveAspectRatio="none" aria-hidden="true">
    <polyline points={TRACE_PATHS[shape]} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));

const StatCard = memo(({ shape, colorClass, title, value, subtitle }) => (
  <div className={`stat-card ${colorClass === "red" ? "critical-card" : ""}`}>
    <Trace shape={shape} className={colorClass} />
    <div className="stat-content">
      <span>{title}</span>
      <strong>{value.toLocaleString()}</strong>
      <small>{subtitle}</small>
    </div>
  </div>
));

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
  const [error, setError] = useState(null);

  // Chargement des données initiales
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, patRes, alertRes] = await Promise.all([
        fetch(`${API_URL}/dashboard`),
        fetch(`${API_URL}/patients`),
        fetch(`${API_URL}/alerts`),
      ]);

      if (!dashRes.ok || !patRes.ok || !alertRes.ok) {
        throw new Error("Erreur lors de la récupération des données principales.");
      }

      const [dashData, patData, alertData] = await Promise.all([
        dashRes.json(),
        patRes.json(),
        alertRes.json(),
      ]);

      setDashboard(dashData);
      setPatients(patData.patients || []);
      setAlerts(alertData.alerts || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Polling du statut des agents avec gestion de nettoyage
  useEffect(() => {
    const controller = new AbortController();

    const fetchAgentStatuses = async () => {
      try {
        const response = await fetch(`${API_URL}/agents/status`, { signal: controller.signal });
        if (!response.ok) throw new Error();
        const data = await response.json();
        setAgentStatuses(data.agents || {});
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Erreur statuts agents :", err);
        }
      }
    };

    fetchAgentStatuses();
    const interval = setInterval(fetchAgentStatuses, 5000);

    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, []);

  // Chargement des archives paginées
  useEffect(() => {
    const controller = new AbortController();
    setArchiveLoading(true);

    fetch(`${API_URL}/archives?page=${archivePage}&limit=${ARCHIVES_PER_PAGE}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setArchives(data.archives || []);
        setArchiveTotal(data.total || 0);
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error("Erreur archives :", err);
      })
      .finally(() => setArchiveLoading(false));

    return () => controller.abort();
  }, [archivePage]);

  // Mémorisation des variables
  const totalEEG = dashboard?.total_eeg ?? 0;
  const normalCount = dashboard?.normal ?? 0;
  const criticalCount = dashboard?.alerts ?? 0;
  const archivedCount = dashboard?.archived ?? archiveTotal;
  const totalArchivePages = Math.max(1, Math.ceil(archiveTotal / ARCHIVES_PER_PAGE));

  const storageData = useMemo(() => [
    { name: "Normal", value: normalCount, color: CHART_COLORS.normal },
    { name: "Critique", value: criticalCount, color: CHART_COLORS.critical },
    { name: "Archivé", value: archivedCount, color: CHART_COLORS.archived },
  ], [normalCount, criticalCount, archivedCount]);

  const alertsByPatient = useMemo(() => {
    const counter = alerts.reduce((acc, alert) => {
      const patient = alert.patient_id || "Inconnu";
      acc[patient] = (acc[patient] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counter).map(([patient, count]) => ({ patient, count }));
  }, [alerts]);

  const activeAgentsCount = useMemo(
    () => Object.values(agentStatuses).filter((status) => status === "active").length,
    [agentStatuses]
  );

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Chargement du système EEG...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <p>Une erreur est survenue : {error}</p>
        <button onClick={fetchInitialData}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="brand">
            <div className="brand-icon">EEG</div>
            <div>
              <h1>EEG Monitoring</h1>
              <p>Système Multi-Agent de gestion des EEG néonataux</p>
            </div>
          </div>
          <div className="system-status">
            <span className="status-dot"></span>
            Système opérationnel
          </div>
        </div>
      </header>

      <main className="container">
        {/* KPI */}
        <section className="stats">
          <StatCard shape="patients" colorClass="blue" title="Patients" value={dashboard?.patients ?? 0} subtitle="patients surveillés" />
          <StatCard shape="volume" colorClass="cyan" title="Total EEG" value={totalEEG} subtitle="données collectées" />
          <StatCard shape="critical" colorClass="red" title="Alertes critiques" value={criticalCount} subtitle="anomalies détectées" />
          <StatCard shape="archived" colorClass="purple" title="Archives" value={archivedCount} subtitle="données archivées" />
        </section>

        {/* AGENTS */}
        <section className="panel agents-panel">
          <div className="panel-header">
            <div>
              <h2>Agents du système</h2>
              <p>État des agents multi-agents</p>
            </div>
            <div className="agents-online">
              <span></span>
              {activeAgentsCount} agent{activeAgentsCount > 1 ? "s" : ""} actif{activeAgentsCount > 1 ? "s" : ""}
            </div>
          </div>
          <div className="agents-grid">
            {AGENTS_METADATA.map((agent) => {
              const isActive = agentStatuses[agent.id] === "active";
              return (
                <div className="agent-card" key={agent.id}>
                  <div className="agent-icon">{agent.icon}</div>
                  <div className="agent-info">
                    <strong>Agent {agent.name}</strong>
                    <span>{agent.description}</span>
                  </div>
                  <div className={`agent-status ${isActive ? "active" : "inactive"}`}>
                    <span></span>
                    {isActive ? "Actif" : "Inactif"}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* GRAPHIES */}
        <section className="charts-grid">
          <div className="panel chart-panel">
            <div className="panel-header">
              <h2>Répartition des données</h2>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={storageData} cx="50%" cy="48%" innerRadius={72} outerRadius={108} paddingAngle={4} dataKey="value" nameKey="name">
                    {storageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    wrapperStyle={{ zIndex: 1000 }}
                    contentStyle={{ borderRadius: "10px", background: "#101827", color: "#fff" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel chart-panel">
            <div className="panel-header">
              <h2>Alertes par patient</h2>
            </div>
            <div className="chart-container">
              {alertsByPatient.length === 0 ? (
                <div className="empty-state">Aucune donnée disponible.</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={alertsByPatient} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#26334a" />
                    <XAxis dataKey="patient" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Tooltip
                      wrapperStyle={{ zIndex: 1000 }}
                      contentStyle={{ borderRadius: "10px", background: "#101827", color: "#fff" }}
                    />
                    <Bar dataKey="count" name="Alertes" fill={CHART_COLORS.critical} radius={[7, 7, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        {/* ARCHIVES TABLE */}
        <section className="panel">
          <div className="panel-header">
            <h2>Archives EEG</h2>
            <span className="count-badge">{archiveTotal.toLocaleString()} archives</span>
          </div>

          {archiveLoading ? (
            <div className="empty-state">Chargement des archives...</div>
          ) : archives.length === 0 ? (
            <div className="empty-state">Aucune archive disponible.</div>
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
                    {archives.map((archive, index) => (
                      <tr key={archive._id || index}>
                        <td><strong>{archive.patient_id}</strong></td>
                        <td>{archive.step}</td>
                        <td>{archive.timestamp ? new Date(archive.timestamp).toLocaleString() : "N/A"}</td>
                        <td>
                          <span className={archive.priority === "CRITIQUE" ? "priority-badge" : "normal-badge"}>
                            {archive.priority}
                          </span>
                        </td>
                        <td>{archive.max_amplitude}</td>
                        <td className="archive-path">{archive.archive_object}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button onClick={() => setArchivePage((p) => Math.max(p - 1, 1))} disabled={archivePage === 1}>
                  ← Précédent
                </button>
                <span>Page <strong>{archivePage}</strong> sur <strong>{totalArchivePages}</strong></span>
                <button onClick={() => setArchivePage((p) => Math.min(p + 1, totalArchivePages))} disabled={archivePage >= totalArchivePages}>
                  Suivant →
                </button>
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>EEG Multi-Agent System · Technologies de Stockage Big Data</p>
      </footer>
    </div>
  );
}

export default App;