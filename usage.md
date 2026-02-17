# Nishan-e-Zindagi - Usage Guide

## Overview

Nishan-e-Zindagi (Sign of Life) is an emergency response system that uses Meshtastic LoRa mesh network devices to detect potential survivors in disaster areas. Sensor nodes measure CO2, temperature, and humidity levels. The data is transmitted over the mesh network to a gateway, which forwards it to a live web dashboard via WebSocket. Rescuers can also manually pin survivor locations on the map and create alerts directly from field reports.

## Architecture

```
[Sensor Nodes (PicoB)] --LoRa Mesh--> [Gateway Node (COM port)]
                                            |
                                    [Python Backend (FastAPI)]
                                            |
                                      [WebSocket /ws]
                                            |
                                  [Next.js Dashboard (Browser)]
                                            |
                                    [IndexedDB (Dexie)]
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

## Login & Roles

Use the demo credentials to log in:

| Role | Email | Access |
|------|-------|--------|
| **Admin** | admin@demo.com | Full access to all pages |
| **Rescuer** | rescuer@demo.com | Map & Alerts, Campaigns, Mark Survivor Location, Public, Reports |
| **Public** | public@demo.com | Public Alerts and Reports (read-only) |

Firebase Google OAuth is also supported for production use.

---

## Navigation

The left sidebar shows routes based on your role:

| Nav Item | Route | Roles |
|----------|-------|-------|
| Dashboard | `/admin` | Admin |
| User Management | `/admin/users` | Admin |
| Map & Alerts | `/rescuer` | Rescuer, Admin |
| Campaigns | `/rescuer/campaigns` | Rescuer, Admin |
| Mark Survivor Location | `/rescuer/mark-location` | Rescuer, Admin |
| Public Alerts | `/public` | All |
| Reports | `/reports` | All |

---

## Pages

### Admin Dashboard — `/admin`

Overview of the entire operation. Accessible to **Admin** only.

- **Stats**: Total users, online devices, active alerts (critical count), active campaigns
- **Device Grid**: All registered sensor devices with their current status
- **Actions**: Upload data to cloud, start a new rescue campaign

---

### User Management — `/admin/users`

Manage the team. Accessible to **Admin** only.

- **Stats**: Total users, count by role (Admin / Rescuer / Public)
- **Table**: All user accounts with name, email, role, and status
- **Actions**:
  - Add a new user
  - Search users by name or email
  - Filter by role
  - Edit user details or role
  - Delete users

---

### Map & Alerts (Rescuer Dashboard) — `/rescuer`

Primary operational view. Accessible to **Rescuer** and **Admin**.

**Stats Cards**
- Online Devices, Active Alerts, Active Campaigns, My Campaigns, Survivor Signals

**CO2 Threshold Settings**
Enter the ambient (outdoor/background) CO2 level for the area. The system uses this value to determine survivor probability for all sensor nodes. A typical outdoor value is 400–500 ppm; dusty disaster zones may read 600–800 ppm.

**Device Locations Map**
Interactive map showing all sensor nodes as color-coded markers. Click any marker to highlight the device in the data panel below.

**Live Sensor Data**
Real-time CO2, temperature, and humidity readings from all reporting nodes. Each row is color-coded by survivor probability.

**Recent Alerts Panel**
Active and acknowledged alerts with inline actions:
- **Acknowledge** — confirms the alert has been seen
- **Resolve** — marks the alert as handled; for manual_report alerts, a dialog asks for the number of people rescued
- **View on Map** — pans the map to the alert location

**Start Campaign** (Admin only)
Opens a dialog to create a new rescue campaign from one or more selected alerts or devices.

---

### Mark Survivor Location — `/rescuer/mark-location`

Manually pinpoint a potential survivor location based on a verbal or radio field report, without waiting for sensor data. Accessible to **Rescuer** and **Admin**.

**How to use:**
1. Click **Pin on Map** — the button pulses and the map cursor changes to a crosshair
2. Click anywhere on the map to drop a purple pulsing marker at that location
3. Coordinates are automatically filled in the form
4. Fill in:
   - **Reported by Rescuer** (pre-filled with your display name)
   - **Severity** (Critical / High / Medium / Low — default: High)
   - **Notes** (optional, e.g. "heard voices under rubble")
5. Click **Create Alert**

The alert is created with type `manual_report` and immediately appears as an active alert in Alert Management, the Public Alerts page, and the Rescuer Dashboard. It flows through the same acknowledge → resolve pipeline as sensor-triggered alerts. When resolved, you will be prompted for the number of people rescued, and that count feeds into the "Total Persons Rescued" stat everywhere.

To remove a pinned location before submitting, click **Clear** next to the coordinates badge.

---

### Alert Management — `/dashboard/alerts`

Full alert log with management actions. Accessible to **Rescuer** and **Admin**.

**Stats Cards** (counts, not person counts)
- **Critical Alerts** — active alerts with critical severity
- **Active Alerts** — all currently active alerts
- **Acknowledged Alerts** — alerts seen but not yet resolved
- **Resolved Alerts** — fully handled alerts

**Alert List**
All alerts, scrollable, sorted by most recent. Each card shows:
- Severity icon and color
- Status badge (pulsing dot = active)
- For sensor alerts: device name
- For manual_report alerts: coordinates, reporting rescuer name, and (when resolved) number of people rescued

**Resolving a Manual Report Alert**
When you click **Resolve** on a `manual_report` alert, a dialog appears:
> "How many people were rescued at this location?"

Enter the count and click **Confirm & Resolve**. This number is added to the "Total Persons Rescued" on the Public page and Reports.

---

### Public Alerts — `/public`

Read-only situational awareness page. Accessible to **all roles**.

- **Info Banner** — reminds public users this is a read-only view
- **Rescue Stats**: Total Persons Rescued (from campaigns + manual reports), Active Operations, Danger Level, Active Alerts
- **Resolved Rescue Operations** — list of completed campaigns
- **Latest News & Updates** — recent alerts with severity badges
- **Filters**: Search by text, filter by status, filter by severity

Public users cannot acknowledge or resolve alerts.

---

### Campaigns — `/rescuer/campaigns`

Track and manage rescue campaigns. Accessible to **Rescuer** and **Admin**.

**Stats**: Deployed Nodes, Deployed Rescuers, Active Campaigns, Total Survivors Found

**Tabs**
- **All** — every campaign
- **Active** — ongoing campaigns
- **My Campaigns** — campaigns assigned to you (rescuer view)
- **Unassigned** — campaigns with no rescuer assigned (admin view)
- **Resolved** — completed campaigns

**Campaign Status Flow**
```
Initiated → Assigned → Accepted → En Route → On Scene → In Progress → Resolved
                                                                    ↘ Cancelled
```

**Actions**
- **Assign** (admin) — assign one or more rescuers to the campaign
- **Update Status** — advance the campaign through the workflow
- **Mark Node Rescued** — record survivors found at a specific node
- **Add Note** — attach a timestamped field note
- **Resolve Campaign** — closes the campaign and resolves all linked alerts
- **Create Campaign** (admin) — start a campaign from selected alerts or devices

---

### Reports & Analytics — `/reports`

Accessible to **all roles** (public view is simplified).

**Controls**
- **Campaign Selector** — view aggregate stats or drill into a specific campaign
- **Date Range** — 7d, 14d, 30d, or 90d

**Admin / Rescuer View**
- Summary stats: Devices, Alerts, Survivors Found, Average Battery
- Charts: Survivors by Campaign (bar), Alert Trends (area), Campaign Status (pie), Device Status (pie), Alert Severity breakdown, Battery Level distribution
- Export PDF — full operational report

**Public View**
- Summary stats: Persons Rescued, Active Operations, Active Alerts, Resolved Campaigns
- Charts: Alert Trends, Campaign Status
- Resolved Campaigns list
- Export PDF — public-facing summary

---

## Color Coding

Map markers and device cards are color-coded based on CO2 readings relative to your set threshold:

| Color | Condition | Meaning |
|-------|-----------|---------|
| **Red** | CO2 > 1.5× threshold | HIGH survivor probability — immediate action needed |
| **Orange** | CO2 > 1.2× threshold | MODERATE probability — investigate |
| **Yellow** | CO2 > threshold | LOW probability — monitor |
| **Green** | CO2 ≤ threshold | No likely survivor — area clear |
| **Purple** | Manual report marker | Survivor location pinned by rescuer field report |

**Example** — threshold set to 800 ppm:
- Red: > 1200 ppm
- Orange: > 960 ppm
- Yellow: > 800 ppm
- Green: ≤ 800 ppm

---

## Real-time Updates

The dashboard connects to the Python backend via WebSocket (`ws://localhost:8000/ws`):
- A green **Live** indicator in the header confirms an active connection
- Sensor data, device locations, and battery levels update instantly
- The dashboard auto-reconnects every 5 seconds if the connection drops

All data is also persisted locally in the browser via **IndexedDB (Dexie)**, so the dashboard retains history between sessions and page refreshes.

---

## Survivor Count Tracking

"Total Persons Rescued" is the sum of:
1. `totalSurvivorsFound` across all campaigns (populated when nodes are marked rescued)
2. `survivorsFound` across all resolved `manual_report` alerts (entered in the resolve dialog)

This total is shown on:
- `/public` — Rescue Stats card
- `/reports` — Summary stats
- `/rescuer/campaigns` — Campaign stats header

---

## Troubleshooting

### Backend won't connect to Meshtastic
- Ensure only one application is using the COM port
- Try different COM port numbers in `test_script.py`
- Check that Meshtastic firmware is up to date

### Dashboard shows "Offline"
- Ensure the Python backend is running on port 8000
- Check browser console for WebSocket connection errors
- The dashboard auto-reconnects every 5 seconds

### No sensor data appearing
- Verify sensor nodes are powered on and in range
- Check the Python backend terminal for incoming messages
- Ensure sensor nodes are sending JSON in the correct format via text messages

### Resolved alert count looks wrong
- The database schema has been migrated to version 3; demo alerts that were pre-seeded as resolved have been reset to active
- If counts still seem off, clear IndexedDB in browser DevTools → Application → Storage and reload
