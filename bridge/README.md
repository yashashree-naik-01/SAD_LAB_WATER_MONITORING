# Tinkercad → Backend Bridge

Your friend can connect the simulator to the backend in one of two ways.

## Option A — easiest for testing

Use the included Python script to generate simulated readings and POST them to the backend:

```bash
pip install requests
python simulator_sender.py
```

It sends changing pH, turbidity and temperature values to:

`http://localhost:5000/api/readings`

## Option B — actual Arduino Serial output

If the Arduino/Tinkercad setup outputs one JSON object per line over Serial, for example:

```json
{"ph":7.2,"turbidity":20,"temperature":25}
```

then use the serial bridge script and change `SERIAL_PORT` to the serial port exposed by the local Arduino environment.

Important: Tinkercad Circuits itself is a browser simulator, so it normally cannot directly make an HTTP POST to your local Express server. A bridge layer is therefore useful when the real simulator/device output is only available through serial or another external connector.
