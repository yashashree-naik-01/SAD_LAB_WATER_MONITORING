# Water Quality Monitoring System — Full Stack Prototype

This project contains:

- React + Vite frontend
- Express.js backend
- JSON persistence for prototype readings
- SAFE / UNSAFE decision logic
- pH, turbidity and temperature monitoring
- Green LED / Red LED / buzzer state
- Tinkercad integration-ready REST API
- Optional Python simulator/serial bridge

## 1. Project logic

The project thresholds from the PPT are:

| Parameter | Safe range |
|---|---|
| pH | 6.5 – 8.5 |
| Turbidity | ≤ 50 NTU |
| Temperature | 5 – 40 °C |

The backend applies the same rule:

- ALL values inside range → SAFE
- ANY value outside range → UNSAFE

SAFE:
- Green LED ON
- Red LED OFF
- Buzzer OFF

UNSAFE:
- Green LED OFF
- Red LED ON
- Buzzer ON

## 2. Folder structure

```text
water-quality-monitoring/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── public/
│   ├── package.json
│   ├── index.html
│   └── .env.example
│
├── backend/
│   ├── server.js
│   ├── data.json
│   └── package.json
│
├── bridge/
│   ├── simulator_sender.py
│   ├── serial_bridge.py
│   └── README.md
│
└── README.md
```

## 3. Requirements

Install:

- Node.js 18+
- npm
- Python 3.10+ only if using the bridge

## 4. Start backend

Open terminal:

```bash
cd backend
npm install
npm start
```

Backend:
`http://localhost:5000`

Test:
`http://localhost:5000/api/health`

## 5. Start frontend

Open a SECOND terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually:

`http://localhost:5173`

## 6. Test the backend manually

SAFE example:

```bash
curl -X POST http://localhost:5000/api/readings ^
  -H "Content-Type: application/json" ^
  -d "{\"ph\":7.2,\"turbidity\":20,\"temperature\":25}"
```

UNSAFE example:

```bash
curl -X POST http://localhost:5000/api/readings ^
  -H "Content-Type: application/json" ^
  -d "{\"ph\":9.0,\"turbidity\":80,\"temperature\":45}"
```

## 7. Most important API for your friend

POST:

`/api/readings`

Body:

```json
{
  "ph": 7.2,
  "turbidity": 20,
  "temperature": 25
}
```

The backend automatically returns:

```json
{
  "status": "SAFE",
  "greenLed": true,
  "redLed": false,
  "buzzer": false
}
```

So your friend does NOT need to send SAFE/UNSAFE or LED/buzzer state. The backend calculates them from the three sensor values.

## 8. Other APIs

### Health

`GET /api/health`

### Latest reading

`GET /api/readings/latest`

### Reading history

`GET /api/readings?limit=20`

### Thresholds

`GET /api/config/thresholds`

### Clear prototype history

`DELETE /api/readings`

## 9. How your final system will work

```text
Tinkercad / Arduino Simulator
        ↓
pH + Turbidity + Temperature
        ↓
Friend's connector / bridge
        ↓
POST /api/readings
        ↓
Express Backend
        ↓
Threshold + SAFE/UNSAFE logic
        ↓
JSON storage
        ↓
React Frontend
        ↓
Dashboard / Graphs / Status / Alerts
```

## 10. When giving this ZIP to your friend

Tell your friend:

1. Do not change the frontend UI unless needed.
2. Send the simulator values to `POST /api/readings`.
3. Send only `ph`, `turbidity`, and `temperature`.
4. Keep the JSON field names exactly the same.
5. If the backend is running on another computer/server, change the frontend `VITE_API_URL`.
6. If deploying online, replace localhost with the deployed backend URL.

## 11. Important Tinkercad note

Tinkercad is a browser-based simulator. Your Arduino code can calculate/display values in the simulation, but the browser simulation is not the same as a physical Arduino directly connected to your Express server.

Therefore, the clean architecture is:

Tinkercad → serial/output/bridge → Express API → React dashboard.

If your friend's integration method produces the values in another format, only the bridge needs to change. The React frontend and backend API can remain the same.
