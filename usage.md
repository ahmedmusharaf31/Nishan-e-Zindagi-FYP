# Nishan-e-Zindagi - Usage Guide

## Overview

Nishan-e-Zindagi (Sign of Life) is an emergency response system that uses Meshtastic LoRa mesh network devices to detect potential survivors in disaster areas. Sensor nodes measure CO2, temperature, and humidity levels. The data is transmitted over the mesh network to a gateway, which forwards it to a live web dashboard via WebSocket.

## Architecture

```
[Sensor Nodes (PicoB)] --LoRa Mesh--> [Gateway Node (COM port)]
                                            |
                                    [Python Backend (FastAPI)]
                                            |
                                      [WebSocket /ws]
                                            |
                                  [Next.js Dashboard (Browser)]
```

## Prerequisites

- **Python 3.9+** with pip
- **Node.js 18+** with npm
- **Meshtastic device** connected via USB (e.g., Heltec LoRa 32, LILYGO T-Beam)
- Sensor nodes running firmware that sends JSON payloads over Meshtastic TEXT_MESSAGE_APP

## Setup

### 1. Backend (Python)

```bash
# Install Python dependencies
pip install -r requirements.txt

# Verify your Meshtastic device is connected
# Check your COM port (Windows: Device Manager, Linux: ls /dev/ttyUSB*)
```

Edit `test_script.py` if your COM port differs from `COM17`:
```python
interface = meshtastic.serial_interface.SerialInterface(devPath="COM17")
```

Start the backend:
```bash
python -m uvicorn test_script:app --host 0.0.0.0 --port 8000
```

The backend will:
- Connect to your Meshtastic node
- Listen for incoming mesh messages
- Serve a WebSocket endpoint at `ws://localhost:8000/ws`
- Parse sensor JSON data and forward it to connected dashboard clients

### 2. Frontend (Next.js)

```bash
# Install Node.js dependencies
npm install

# Start development server
npm run dev
```

Open your browser to `http://localhost:3000`

## Sensor Data Format

Sensor nodes send JSON payloads via Meshtastic text messages:

```json
{
  "id": "PicoB-001",
  "lat": 34.069256,
  "lon": 72.640308,
  "ts": 1770349503,
  "fix": 0,
  "co2": 1822,
  "t": 22.5,
  "h": 50.3
}
```

| Field | Description |
|-------|-------------|
| `id`  | Unique sensor device ID |
| `lat` | GPS latitude (decimal degrees) |
| `lon` | GPS longitude (decimal degrees) |
| `ts`  | Unix timestamp |
| `fix` | GPS fix status (0 = no fix, 1 = fix) |
| `co2` | CO2 concentration in ppm |
| `t`   | Temperature in Celsius |
| `h`   | Relative humidity in % |

Battery telemetry is sent separately via Meshtastic TELEMETRY_APP.

## Using the Dashboard

### Login

Use the demo credentials to log in:
- **Admin**: admin@demo.com
- **Rescuer**: rescuer@demo.com
- **Public**: public@demo.com

### Rescuer Dashboard

The rescuer dashboard is the primary operational view:

1. **Stats Cards**: Quick overview of online devices, active alerts, campaigns, and survivor signals
2. **CO2 Threshold Settings**: Enter the ambient CO2 level of the surrounding area
3. **Live Map**: Color-coded markers showing device locations and survivor probability
4. **Live Sensor Data**: Real-time readings from all reporting sensor nodes
5. **Alerts Panel**: Active alerts with acknowledge/resolve actions

### Setting CO2 Thresholds

The CO2 threshold determines survivor detection sensitivity:

1. Navigate to the **Rescuer Dashboard**
2. In the **CO2 Threshold Settings** card, enter the ambient (outdoor) CO2 level in ppm
3. A typical outdoor ambient level is **400-500 ppm**
4. In a disaster zone with dust/debris, ambient may be higher (**600-800 ppm**)

### Color Coding

Map markers and device cards are color-coded based on CO2 readings relative to your threshold:

| Color | Condition | Meaning |
|-------|-----------|---------|
| **Red** | CO2 > 1.5x threshold | HIGH survivor probability - immediate action needed |
| **Orange** | CO2 > 1.2x threshold | MODERATE probability - investigate |
| **Yellow** | CO2 > threshold | LOW probability - monitor |
| **Green** | CO2 <= threshold | No likely survivor - area clear |

**Example**: If threshold = 800 ppm:
- Red: > 1200 ppm
- Orange: > 960 ppm
- Yellow: > 800 ppm
- Green: <= 800 ppm

### Real-time Updates

The dashboard connects to the Python backend via WebSocket:
- A green "Live" indicator in the header confirms active connection
- Sensor data updates appear instantly as mesh nodes report
- Device locations update on the map in real-time
- Battery levels update from telemetry messages

## Troubleshooting

### Backend won't connect to Meshtastic
- Ensure only one application is using the COM port
- Try different COM port numbers
- Check that Meshtastic firmware is up to date

### Dashboard shows "Offline"
- Ensure the Python backend is running on port 8000
- Check browser console for WebSocket connection errors
- The dashboard auto-reconnects every 5 seconds

### No sensor data appearing
- Verify sensor nodes are powered on and in range
- Check the Python backend terminal for incoming messages
- Ensure sensor nodes are sending JSON format in text messages
