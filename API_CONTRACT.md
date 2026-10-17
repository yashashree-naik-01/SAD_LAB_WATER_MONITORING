# API Contract for Simulator Integration

## POST /api/readings

Content-Type: application/json

Request:
```json
{
  "ph": 7.2,
  "turbidity": 20,
  "temperature": 25
}
```

Response:
```json
{
  "message": "Reading stored",
  "reading": {
    "id": 1750000000000,
    "timestamp": "2026-09-29T00:00:00.000Z",
    "ph": 7.2,
    "turbidity": 20,
    "temperature": 25,
    "status": "SAFE",
    "greenLed": true,
    "redLed": false,
    "buzzer": false
  }
}
```

Do not send:
- `status`
- `greenLed`
- `redLed`
- `buzzer`

The backend derives these fields from the threshold rules.
