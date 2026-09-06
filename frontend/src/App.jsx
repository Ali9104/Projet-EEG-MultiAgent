import { useEffect, useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [dashboardRes, patientsRes, alertsRes] = await Promise.all([
        fetch(`${API}/api/eeg/dashboard`),
        fetch(`${API}/api/eeg/patients`),
        fetch(`${API}/api/eeg/alerts`),
      ]);

      const dashboardData = await dashboardRes.json();
      const patientsData = await patientsRes.json();
      const alertsData = await alertsRes.json();

      setDashboard(dashboardData);
      setPatients(patientsData.patients || []);
      setAlerts(alertsData.alerts || []);
    } catch (error) {
      console.error("Erreur API :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Chargement du système EEG...</p>
      </div>
    );
  }

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <div>
          <h1>EEG Neonatal Monitoring</h1>
          <p>Système Multi-Agent pour la gestion des EEG néonataux</p>
        </div>

        <div className="system-status">
          <span className="status-dot"></span>
          Système opérationnel
        </div>
      </header>

      {/* STATISTICS */}
      <section className="stats-grid">

        <div className="stat-card">
          <div className="stat-icon">👶</div>
          <div>
            <span className="stat-label">Patients</span>
            <strong>{dashboard?.patients ?? 0}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div>
            <span className="stat-label">Total EEG</span>
            <strong>{dashboard?.total_eeg ?? 0}</strong>
          </div>
        </div>

        <div className="stat-card critical">
          <div className="stat-icon">🚨</div>
          <div>
            <span className="stat-label">Alertes critiques</span>
            <strong>{dashboard?.alerts ?? 0}</strong>
          </div>
        </div>

        <div className="stat-card archive">
          <div className="stat-icon">🗄️</div>
          <div>
            <span className="stat-label">EEG archivés</span>
            <strong>{dashboard?.archived ?? 0}</strong>
          </div>
        </div>

      </section>

      {/* MAIN CONTENT */}
      <div className="content-grid">

        {/* PATIENTS */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Patients</h2>
              <span>Patients surveillés</span>
            </div>
            <span className="badge">{patients.length}</span>
          </div>

          <div className="patients-list">
            {patients.map((patient) => (
              <div className="patient-card" key={patient}>
                <div className="patient-avatar">
                  👶
                </div>

                <div className="patient-info">
                  <strong>{patient}</strong>
                  <span>Monitoring EEG actif</span>
                </div>

                <span className="online-dot"></span>
              </div>
            ))}
          </div>
        </section>

        {/* AGENTS */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Agents Multi-Agent</h2>
              <span>État des agents</span>
            </div>
          </div>

          <div className="agents">

            <div className="agent">
              <div className="agent-icon">📥</div>
              <div>
                <strong>Acquisition</strong>
                <span>Réception EEG</span>
              </div>
              <span className="agent-status">ACTIF</span>
            </div>

            <div className="agent">
              <div className="agent-icon">🧠</div>
              <div>
                <strong>Analyse</strong>
                <span>Détection anomalies</span>
              </div>
              <span className="agent-status">ACTIF</span>
            </div>

            <div className="agent">
              <div className="agent-icon">⚙️</div>
              <div>
                <strong>Décision</strong>
                <span>Politique stockage</span>
              </div>
              <span className="agent-status">ACTIF</span>
            </div>

            <div className="agent">
              <div className="agent-icon">🗄️</div>
              <div>
                <strong>Archivage</strong>
                <span>Gestion données anciennes</span>
              </div>
              <span className="agent-status">ACTIF</span>
            </div>

          </div>
        </section>

      </div>

      {/* STORAGE */}
      <section className="panel storage-panel">

        <div className="panel-header">
          <div>
            <h2>Architecture de stockage</h2>
            <span>Répartition selon la priorité EEG</span>
          </div>
        </div>

        <div className="storage-grid">

          <div className="storage-card">
            <div className="storage-icon">⚡</div>
            <div>
              <strong>Redis</strong>
              <span>Données critiques</span>
            </div>
            <small>Cache temps réel</small>
          </div>

          <div className="storage-card">
            <div className="storage-icon">🍃</div>
            <div>
              <strong>MongoDB</strong>
              <span>Métadonnées EEG</span>
            </div>
            <small>Base documentaire</small>
          </div>

          <div className="storage-card">
            <div className="storage-icon">☁️</div>
            <div>
              <strong>MinIO</strong>
              <span>Fichiers EEG</span>
            </div>
            <small>Stockage objet</small>
          </div>

        </div>

      </section>

      {/* ALERTS */}
      <section className="panel alerts-panel">

        <div className="panel-header">
          <div>
            <h2>Alertes critiques</h2>
            <span>Dernières anomalies détectées</span>
          </div>

          <span className="critical-badge">
            {dashboard?.alerts ?? 0} alertes
          </span>
        </div>

        <div className="alerts-list">

          {alerts.slice(0, 10).map((alert) => (
            <div className="alert-row" key={alert._id}>

              <div className="alert-indicator"></div>

              <div className="alert-main">
                <strong>{alert.patient_id}</strong>
                <span>
                  Step {alert.step} — amplitude {alert.max_amplitude}
                </span>
              </div>

              <div className="alert-priority">
                CRITIQUE
              </div>

            </div>
          ))}

        </div>

      </section>

      {/* FOOTER */}
      <footer>
        <span>EEG Multi-Agent System</span>
        <span>Kafka • Redis • MongoDB • MinIO • FastAPI</span>
      </footer>

    </div>
  );
}

export default App;