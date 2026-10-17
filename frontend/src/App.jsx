import React, { useEffect, useMemo, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const THRESHOLDS = {
  ph: { min: 6.5, max: 8.5, unit: "", label: "pH" },
  turbidity: { min: 0, max: 50, unit: "NTU", label: "Turbidity" },
  temperature: { min: 5, max: 40, unit: "°C", label: "Temperature" },
};

function App() {
  const [page, setPage] = useState("dashboard");
  const [reading, setReading] = useState(null);
  const [history, setHistory] = useState([]);
  const [backendConnected, setBackendConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(true);

  // --------------------------------------------------
  // FETCH LATEST DATA
  // --------------------------------------------------

const fetchData = async () => {
  try {
    const [latestResponse, historyResponse] = await Promise.all([
      fetch(`${API_BASE}/readings/latest`),
      fetch(`${API_BASE}/readings?limit=20`),
    ]);

    if (!latestResponse.ok || !historyResponse.ok) {
      throw new Error("Backend request failed");
    }

    const latestData = await latestResponse.json();
    const historyData = await historyResponse.json();

    // IMPORTANT:
    // Backend returns { reading: {...} }
    // Backend returns { readings: [...] }

    setReading(latestData.reading || null);
    setHistory(historyData.readings || []);

    setBackendConnected(true);
    setLastUpdate(new Date());
  } catch (error) {
    console.error("Backend connection error:", error);
    setBackendConnected(false);
  } finally {
    setLoading(false);
  }
};

  // Auto-refresh every 2 seconds
  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, []);

  // --------------------------------------------------
  // DATA FRESHNESS
  // --------------------------------------------------

  const freshness = useMemo(() => {
    if (!backendConnected) {
      return {
        status: "offline",
        title: "DATA OFFLINE",
        subtitle: "Backend not reachable",
        dot: "red",
      };
    }

    if (!lastUpdate) {
      return {
        status: "waiting",
        title: "WAITING FOR DATA",
        subtitle: "Connecting to sensor data",
        dot: "orange",
      };
    }

    const secondsAgo = Math.floor(
      (Date.now() - lastUpdate.getTime()) / 1000
    );

    if (secondsAgo <= 5) {
      return {
        status: "live",
        title: "LIVE MONITORING",
        subtitle: "Data updating",
        dot: "green",
      };
    }

    if (secondsAgo <= 15) {
      return {
        status: "delayed",
        title: "DATA DELAYED",
        subtitle: "Waiting for latest reading",
        dot: "orange",
      };
    }

    return {
      status: "offline",
      title: "DATA OFFLINE",
      subtitle: "No recent sensor data",
      dot: "red",
    };
  }, [backendConnected, lastUpdate]);

  // --------------------------------------------------
  // CURRENT VALUES
  // --------------------------------------------------

  const values = {
    ph: Number(reading?.ph ?? 0),
    turbidity: Number(reading?.turbidity ?? 0),
    temperature: Number(reading?.temperature ?? 0),
  };

  const waterSafe =
    values.ph >= THRESHOLDS.ph.min &&
    values.ph <= THRESHOLDS.ph.max &&
    values.turbidity <= THRESHOLDS.turbidity.max &&
    values.temperature >= THRESHOLDS.temperature.min &&
    values.temperature <= THRESHOLDS.temperature.max;

  // --------------------------------------------------
  // PARAMETER STATUS
  // --------------------------------------------------

  const parameterStatus = {
    ph:
      values.ph >= THRESHOLDS.ph.min &&
      values.ph <= THRESHOLDS.ph.max,

    turbidity: values.turbidity <= THRESHOLDS.turbidity.max,

    temperature:
      values.temperature >= THRESHOLDS.temperature.min &&
      values.temperature <= THRESHOLDS.temperature.max,
  };

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  const formatTime = (date) => {
    if (!date) return "--:--:--";

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getReadingTime = () => {
    if (!reading) return "--:--:--";

    if (reading.timestamp) {
      return formatTime(new Date(reading.timestamp));
    }

    return formatTime(lastUpdate);
  };

  // --------------------------------------------------
  // NAVIGATION
  // --------------------------------------------------

  const navItems = [
    {
      id: "dashboard",
      icon: "⌂",
      label: "Dashboard",
    },
    {
      id: "live",
      icon: "◉",
      label: "Live Monitor",
    },
    {
      id: "logic",
      icon: "✓",
      label: "Decision Logic",
    },
  ];

  return (
    <div className="app">
      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">💧</div>

          <div>
            <h2>AquaGuard</h2>
            <p>Water Quality System</p>
          </div>
        </div>

        {/* DATA FRESHNESS CARD */}
        <div className={`monitor-card ${freshness.status}`}>
          <div className="monitor-top">
            <span className={`status-dot ${freshness.dot}`}></span>

            <span>{freshness.title}</span>
          </div>

          <p>{freshness.subtitle}</p>

          {lastUpdate && backendConnected && (
            <small>
              Last update: {formatTime(lastUpdate)}
            </small>
          )}
        </div>

        <div className="nav-section">
          <p className="nav-title">MONITORING</p>

          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${
                page === item.id ? "active" : ""
              }`}
              onClick={() => setPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* THRESHOLD SUMMARY */}
        <div className="sidebar-threshold">
          <p className="nav-title">SAFE RANGE</p>

          <div className="mini-range">
            <span>pH</span>
            <strong>6.5 – 8.5</strong>
          </div>

          <div className="mini-range">
            <span>Turbidity</span>
            <strong>≤ 50 NTU</strong>
          </div>

          <div className="mini-range">
            <span>Temperature</span>
            <strong>5 – 40°C</strong>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="arduino-badge">◉</div>
          <div>
            <strong>Arduino Uno R3</strong>
            <span>Monitoring controller</span>
          </div>
        </div>
      </aside>

      {/* ================= MAIN ================= */}

      <main className="main-content">
        {/* HEADER */}

        <header className="topbar">
          <div>
            <p className="breadcrumb">
              AquaGuard /{" "}
              {page === "dashboard"
                ? "Dashboard"
                : page === "live"
                ? "Live Monitor"
                : "Decision Logic"}
            </p>

            <h1>
              {page === "dashboard"
                ? "Water Quality Dashboard"
                : page === "live"
                ? "Live Water Monitoring"
                : "Water Quality Decision Logic"}
            </h1>
          </div>

          <div
            className={`overall-status ${
              waterSafe ? "safe" : "unsafe"
            }`}
          >
            <span className="status-dot"></span>

            <div>
              <small>WATER STATUS</small>
              <strong>{waterSafe ? "SAFE" : "UNSAFE"}</strong>
            </div>
          </div>
        </header>

        {/* LOADING */}

        {loading && (
          <div className="loading-box">
            <div className="loader"></div>
            Loading monitoring data...
          </div>
        )}

        {/* ================= DASHBOARD ================= */}

        {!loading && page === "dashboard" && (
          <Dashboard
            reading={reading}
            values={values}
            waterSafe={waterSafe}
            parameterStatus={parameterStatus}
            history={history}
            getReadingTime={getReadingTime}
            lastUpdate={lastUpdate}
            onLiveMonitor={() => setPage("live")}
          />
        )}

        {/* ================= LIVE MONITOR ================= */}

        {!loading && page === "live" && (
          <LiveMonitor
            reading={reading}
            values={values}
            waterSafe={waterSafe}
            parameterStatus={parameterStatus}
            history={history}
            getReadingTime={getReadingTime}
            freshness={freshness}
            lastUpdate={lastUpdate}
          />
        )}

        {/* ================= DECISION LOGIC ================= */}

        {!loading && page === "logic" && (
          <DecisionLogic
            values={values}
            parameterStatus={parameterStatus}
            waterSafe={waterSafe}
          />
        )}
      </main>
    </div>
  );
}

/* ==================================================
   DASHBOARD
================================================== */

function Dashboard({
  reading,
  values,
  waterSafe,
  parameterStatus,
  history,
  getReadingTime,
  lastUpdate,
  onLiveMonitor,
}) {
  return (
    <div className="page-content">
      {/* HERO */}

      <section className="hero-card">
        <div>
          <span className="section-label">CURRENT CONDITION</span>

          <h2>
            Water is{" "}
            <span className={waterSafe ? "safe-text" : "unsafe-text"}>
              {waterSafe ? "Safe" : "Unsafe"}
            </span>
          </h2>

          <p>
            Based on the latest pH, turbidity and temperature readings.
          </p>

          <button
            className="primary-btn"
            onClick={onLiveMonitor}
          >
            View Live Monitoring →
          </button>
        </div>

        <div
          className={`water-status-circle ${
            waterSafe ? "safe-circle" : "unsafe-circle"
          }`}
        >
          <span>{waterSafe ? "✓" : "!"}</span>
          <small>{waterSafe ? "SAFE" : "ALERT"}</small>
        </div>
      </section>

      {/* SENSOR CARDS */}

      <div className="section-heading">
        <div>
          <span className="section-label">LATEST READING</span>
          <h3>Water Parameters</h3>
        </div>

        <span className="last-reading">
          Last sensor update: {getReadingTime()}
        </span>
      </div>

      <div className="sensor-grid">
        <SensorCard
          icon="pH"
          title="pH Level"
          value={values.ph}
          unit=""
          range="Safe: 6.5 – 8.5"
          isSafe={parameterStatus.ph}
        />

        <SensorCard
          icon="≋"
          title="Turbidity"
          value={values.turbidity}
          unit="NTU"
          range="Safe: ≤ 50 NTU"
          isSafe={parameterStatus.turbidity}
        />

        <SensorCard
          icon="°"
          title="Temperature"
          value={values.temperature}
          unit="°C"
          range="Safe: 5 – 40°C"
          isSafe={parameterStatus.temperature}
        />
      </div>

      {/* SUMMARY */}

      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="section-label">SYSTEM RESPONSE</span>
              <h3>Alert Indicators</h3>
            </div>
          </div>

          <div className="indicator-list">
            <Indicator
              label="Green LED"
              state={waterSafe ? "ON" : "OFF"}
              active={waterSafe}
            />

            <Indicator
              label="Red LED"
              state={waterSafe ? "OFF" : "ON"}
              active={!waterSafe}
            />

            <Indicator
              label="Buzzer"
              state={waterSafe ? "OFF" : "ON"}
              active={!waterSafe}
            />
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="section-label">RECENT DATA</span>
              <h3>Monitoring Overview</h3>
            </div>
          </div>

          <div className="overview-list">
            <div>
              <span>Parameters monitored</span>
              <strong>3</strong>
            </div>

            <div>
              <span>Safe parameters</span>
              <strong>
                {Object.values(parameterStatus).filter(Boolean).length}/3
              </strong>
            </div>

            <div>
              <span>Auto refresh</span>
              <strong>2 sec</strong>
            </div>

            <div>
              <span>Sensor source</span>
              <strong>Arduino</strong>
            </div>
          </div>
        </section>
      </div>

      {/* TREND */}

      <section className="panel trend-panel">
        <div className="panel-header">
          <div>
            <span className="section-label">LIVE TREND</span>
            <h3>Recent Parameter Readings</h3>
          </div>

          <span className="live-badge">● LIVE</span>
        </div>

        <MiniTrend history={history} />
      </section>
    </div>
  );
}

/* ==================================================
   LIVE MONITOR
================================================== */

function LiveMonitor({
  values,
  waterSafe,
  parameterStatus,
  history,
  getReadingTime,
  freshness,
  lastUpdate,
}) {
  return (
    <div className="page-content">
      <section className="live-header-card">
        <div>
          <span className="section-label">REAL-TIME SENSOR DATA</span>

          <h2>
            Live Monitoring{" "}
            <span className="live-pulse">●</span>
          </h2>

          <p>
            Values below are continuously updated from the backend.
          </p>
        </div>

        <div className={`live-connection ${freshness.status}`}>
          <span className={`status-dot ${freshness.dot}`}></span>

          <div>
            <strong>{freshness.title}</strong>
            <small>{freshness.subtitle}</small>
          </div>
        </div>
      </section>

      {/* LARGE LIVE READINGS */}

      <div className="live-grid">
        <LargeGauge
          title="pH Level"
          value={values.ph}
          unit=""
          min={0}
          max={14}
          safe={parameterStatus.ph}
          safeText="6.5 – 8.5"
        />

        <LargeGauge
          title="Turbidity"
          value={values.turbidity}
          unit=" NTU"
          min={0}
          max={100}
          safe={parameterStatus.turbidity}
          safeText="≤ 50 NTU"
        />

        <LargeGauge
          title="Temperature"
          value={values.temperature}
          unit="°C"
          min={0}
          max={50}
          safe={parameterStatus.temperature}
          safeText="5 – 40°C"
        />
      </div>

      {/* LIVE STATUS */}

      <section
        className={`live-alert ${
          waterSafe ? "alert-safe" : "alert-unsafe"
        }`}
      >
        <div className="alert-icon">
          {waterSafe ? "✓" : "!"}
        </div>

        <div>
          <span>{waterSafe ? "ALL PARAMETERS NORMAL" : "ALERT DETECTED"}</span>

          <h3>
            Water is {waterSafe ? "SAFE" : "UNSAFE"}
          </h3>

          <p>
            {waterSafe
              ? "All monitored parameters are within the defined safe ranges."
              : "One or more monitored parameters are outside the defined safe ranges."}
          </p>
        </div>
      </section>

      {/* SENSOR UPDATE INFO */}

      <div className="live-info-grid">
        <InfoCard
          title="Last Sensor Update"
          value={getReadingTime()}
          subtitle="Most recent reading"
        />

        <InfoCard
          title="Refresh Interval"
          value="2 sec"
          subtitle="Automatic update"
        />

        <InfoCard
          title="Parameters"
          value="3"
          subtitle="pH • Turbidity • Temperature"
        />

        <InfoCard
          title="Data Source"
          value="Arduino"
          subtitle="Tinkercad / Serial bridge"
        />
      </div>

      {/* LIVE TABLE */}

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="section-label">SENSOR READINGS</span>
            <h3>Latest Values</h3>
          </div>

          <span className="last-reading">
            Updated {lastUpdate ? formatTime(lastUpdate) : "--"}
          </span>
        </div>

        <div className="reading-table">
          <div className="table-row table-heading">
            <span>Parameter</span>
            <span>Current Value</span>
            <span>Safe Range</span>
            <span>Status</span>
          </div>

          <TableRow
            name="pH Level"
            value={values.ph}
            range="6.5 – 8.5"
            safe={parameterStatus.ph}
          />

          <TableRow
            name="Turbidity"
            value={`${values.turbidity} NTU`}
            range="≤ 50 NTU"
            safe={parameterStatus.turbidity}
          />

          <TableRow
            name="Temperature"
            value={`${values.temperature}°C`}
            range="5 – 40°C"
            safe={parameterStatus.temperature}
          />
        </div>
      </section>

      {/* TREND */}

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="section-label">REAL-TIME TREND</span>
            <h3>Recent Sensor Activity</h3>
          </div>
        </div>

        <MiniTrend history={history} />
      </section>
    </div>
  );
}

/* ==================================================
   DECISION LOGIC
================================================== */

function DecisionLogic({
  values,
  parameterStatus,
  waterSafe,
}) {
  return (
    <div className="page-content">
      <section className="logic-intro">
        <span className="section-label">AUTOMATED CLASSIFICATION</span>

        <h2>How the system decides SAFE / UNSAFE</h2>

        <p>
          Each sensor reading is compared with its predefined threshold.
          The water is classified as SAFE only when all three parameters
          remain within their acceptable ranges.
        </p>
      </section>

      {/* FLOW */}

      <section className="logic-flow">
        <LogicStep
          number="01"
          title="Read Sensors"
          description="Arduino reads pH, turbidity and temperature."
        />

        <div className="logic-arrow">→</div>

        <LogicStep
          number="02"
          title="Convert Values"
          description="Raw sensor values are converted into readable units."
        />

        <div className="logic-arrow">→</div>

        <LogicStep
          number="03"
          title="Check Thresholds"
          description="Each value is compared against its safe range."
        />

        <div className="logic-arrow">→</div>

        <LogicStep
          number="04"
          title="Classify Water"
          description="All pass = SAFE. Any failure = UNSAFE."
        />
      </section>

      {/* CURRENT DECISION */}

      <section
        className={`decision-result ${
          waterSafe ? "decision-safe" : "decision-unsafe"
        }`}
      >
        <div className="decision-symbol">
          {waterSafe ? "✓" : "!"}
        </div>

        <div>
          <span>CURRENT SYSTEM DECISION</span>

          <h2>{waterSafe ? "WATER: SAFE" : "WATER: UNSAFE"}</h2>

          <p>
            {waterSafe
              ? "All three parameters are within their acceptable limits."
              : "At least one parameter has exceeded its acceptable limit."}
          </p>
        </div>
      </section>

      {/* THRESHOLD CARDS */}

      <div className="logic-grid">
        <LogicParameter
          title="pH"
          value={values.ph}
          range="6.5 – 8.5"
          passed={parameterStatus.ph}
          description="Measures acidity or alkalinity of water."
        />

        <LogicParameter
          title="Turbidity"
          value={`${values.turbidity} NTU`}
          range="≤ 50 NTU"
          passed={parameterStatus.turbidity}
          description="Measures water clarity or suspended particles."
        />

        <LogicParameter
          title="Temperature"
          value={`${values.temperature}°C`}
          range="5 – 40°C"
          passed={parameterStatus.temperature}
          description="Measures the current water temperature."
        />
      </div>

      {/* OUTPUT LOGIC */}

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="section-label">OUTPUT RESPONSE</span>
            <h3>Arduino Alert Logic</h3>
          </div>
        </div>

        <div className="output-grid">
          <OutputCard
            title="SAFE"
            active={waterSafe}
            icon="✓"
            items={[
              "LCD: WATER SAFE",
              "Green LED: ON",
              "Red LED: OFF",
              "Buzzer: OFF",
            ]}
          />

          <OutputCard
            title="UNSAFE"
            active={!waterSafe}
            icon="!"
            items={[
              "LCD: WATER UNSAFE",
              "Green LED: OFF",
              "Red LED: ON",
              "Buzzer: ON",
            ]}
          />
        </div>
      </section>

      {/* FORMULA */}

      <section className="formula-card">
        <span className="section-label">CLASSIFICATION RULE</span>

        <h3>
          SAFE = pH ✓ AND Turbidity ✓ AND Temperature ✓
        </h3>

        <p>
          If even one parameter falls outside its safe range, the system
          immediately classifies the water as UNSAFE and activates the
          warning indicators.
        </p>
      </section>
    </div>
  );
}

/* ==================================================
   COMPONENTS
================================================== */

function SensorCard({
  icon,
  title,
  value,
  unit,
  range,
  isSafe,
}) {
  return (
    <div className={`sensor-card ${isSafe ? "safe-card" : "unsafe-card"}`}>
      <div className="sensor-card-top">
        <div className="sensor-icon">{icon}</div>

        <span className={isSafe ? "pass-badge" : "fail-badge"}>
          {isSafe ? "NORMAL" : "ALERT"}
        </span>
      </div>

      <p>{title}</p>

      <h2>
        {value}
        <small>{unit}</small>
      </h2>

      <div className="range-text">{range}</div>
    </div>
  );
}

function Indicator({ label, state, active }) {
  return (
    <div className="indicator-row">
      <div className="indicator-name">
        <span className={`indicator-light ${active ? "on" : ""}`}></span>
        {label}
      </div>

      <strong className={active ? "indicator-active" : ""}>
        {state}
      </strong>
    </div>
  );
}

function LargeGauge({
  title,
  value,
  unit,
  min,
  max,
  safe,
  safeText,
}) {
  const percentage = Math.min(
    100,
    Math.max(0, ((value - min) / (max - min)) * 100)
  );

  return (
    <div className={`large-gauge ${safe ? "gauge-safe" : "gauge-unsafe"}`}>
      <div className="gauge-header">
        <span>{title}</span>

        <span className={safe ? "gauge-pass" : "gauge-fail"}>
          {safe ? "NORMAL" : "ALERT"}
        </span>
      </div>

      <div className="gauge-circle">
        <div
          className="gauge-progress"
          style={{
            "--progress": `${percentage * 3.6}deg`,
          }}
        >
          <div className="gauge-inner">
            <strong>
              {value}
              <small>{unit}</small>
            </strong>

            <span>{safeText}</span>
          </div>
        </div>
      </div>

      <p className="gauge-range">
        Acceptable range: <strong>{safeText}</strong>
      </p>
    </div>
  );
}

function InfoCard({ title, value, subtitle }) {
  return (
    <div className="info-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{subtitle}</small>
    </div>
  );
}

function TableRow({ name, value, range, safe }) {
  return (
    <div className="table-row">
      <span>{name}</span>
      <strong>{value}</strong>
      <span>{range}</span>

      <span className={safe ? "table-safe" : "table-unsafe"}>
        {safe ? "✓ Within Range" : "! Outside Range"}
      </span>
    </div>
  );
}

function LogicStep({ number, title, description }) {
  return (
    <div className="logic-step">
      <div className="logic-number">{number}</div>

      <h3>{title}</h3>

      <p>{description}</p>
    </div>
  );
}

function LogicParameter({
  title,
  value,
  range,
  passed,
  description,
}) {
  return (
    <div className={`logic-parameter ${passed ? "passed" : "failed"}`}>
      <div className="logic-param-header">
        <h3>{title}</h3>

        <span>{passed ? "✓ PASS" : "! FAIL"}</span>
      </div>

      <div className="logic-current">
        <span>Current value</span>
        <strong>{value}</strong>
      </div>

      <div className="logic-range">
        <span>Safe range</span>
        <strong>{range}</strong>
      </div>

      <p>{description}</p>
    </div>
  );
}

function OutputCard({ title, active, icon, items }) {
  return (
    <div className={`output-card ${active ? "output-active" : ""}`}>
      <div className="output-header">
        <div className="output-icon">{icon}</div>

        <div>
          <span>WHEN CONDITION IS</span>
          <h3>{title}</h3>
        </div>
      </div>

      <div className="output-items">
        {items.map((item, index) => (
          <div key={index}>
            <span>•</span>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniTrend({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="empty-trend">
        Waiting for sensor readings...
      </div>
    );
  }

  const recent = history.slice(-10);

  return (
    <div className="trend-container">
      <div className="trend-bars">
        {recent.map((item, index) => {
          const ph = Number(item.ph || 0);
          const height = Math.min(100, Math.max(10, (ph / 14) * 100));

          return (
            <div className="trend-column" key={index}>
              <div
                className="trend-bar"
                style={{ height: `${height}%` }}
              ></div>

              <small>{ph.toFixed(1)}</small>
            </div>
          );
        })}
      </div>

      <div className="trend-label">
        Recent pH readings
      </div>
    </div>
  );
}

function formatTime(date) {
  if (!date) return "--:--:--";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default App;