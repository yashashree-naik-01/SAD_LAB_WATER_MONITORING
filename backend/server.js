import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "data.json");

const THRESHOLDS = {
  ph: { min: 6.5, max: 8.5 },
  turbidity: { max: 50 },
  temperature: { min: 5, max: 40 }
};

app.use(cors());
app.use(express.json());

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ readings: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function classify({ ph, turbidity, temperature }) {
  const valid =
    Number.isFinite(ph) &&
    Number.isFinite(turbidity) &&
    Number.isFinite(temperature);

  if (!valid) return { status: "UNSAFE", greenLed: false, redLed: true, buzzer: true };

  const safe =
    ph >= THRESHOLDS.ph.min &&
    ph <= THRESHOLDS.ph.max &&
    turbidity <= THRESHOLDS.turbidity.max &&
    temperature >= THRESHOLDS.temperature.min &&
    temperature <= THRESHOLDS.temperature.max;

  return safe
    ? { status: "SAFE", greenLed: true, redLed: false, buzzer: false }
    : { status: "UNSAFE", greenLed: false, redLed: true, buzzer: true };
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "water-quality-monitoring-backend", time: new Date().toISOString() });
});

app.get("/api/config/thresholds", (req, res) => {
  res.json({ thresholds: THRESHOLDS });
});

app.get("/api/readings/latest", (req, res) => {
  const data = loadData();
  const reading = data.readings[data.readings.length - 1] || null;
  res.json({ reading });
});

app.get("/api/readings", (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 200);
  const data = loadData();
  res.json({ readings: data.readings.slice(-limit) });
});

/*
  MAIN INTEGRATION ENDPOINT
  Friend's simulator connector should POST here.

  Example:
  {
    "ph": 7.2,
    "turbidity": 20,
    "temperature": 25
  }
*/
app.post("/api/readings", (req, res) => {
  const ph = Number(req.body.ph);
  const turbidity = Number(req.body.turbidity);
  const temperature = Number(req.body.temperature);

  if (![ph, turbidity, temperature].every(Number.isFinite)) {
    return res.status(400).json({
      error: "ph, turbidity and temperature must be numeric values."
    });
  }

  const decision = classify({ ph, turbidity, temperature });

  const reading = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    ph,
    turbidity,
    temperature,
    ...decision
  };

  const data = loadData();
  data.readings.push(reading);

  // Keep the JSON store small for the prototype.
  if (data.readings.length > 500) {
    data.readings = data.readings.slice(-500);
  }

  saveData(data);
  res.status(201).json({ message: "Reading stored", reading });
});

app.delete("/api/readings", (req, res) => {
  saveData({ readings: [] });
  res.json({ message: "Reading history cleared" });
});

app.listen(PORT, () => {
  console.log(`Water Quality backend running at http://localhost:${PORT}`);
});