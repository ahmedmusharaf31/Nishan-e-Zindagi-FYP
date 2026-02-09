import asyncio
import json
import meshtastic
import meshtastic.serial_interface
from pubsub import pub
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

connected_clients: set[WebSocket] = set()
message_queue: asyncio.Queue | None = None
main_loop: asyncio.AbstractEventLoop | None = None

@app.on_event("startup")
async def startup():
    global message_queue, main_loop
    main_loop = asyncio.get_running_loop()
    message_queue = asyncio.Queue()
    asyncio.create_task(broadcast_messages())
    print("FastAPI started, event loop captured")

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    connected_clients.add(ws)
    print("WebSocket connected")
    try:
        while True:
            await ws.send_json({"type": "ping"})
            await asyncio.sleep(10)
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    finally:
        connected_clients.discard(ws)

async def broadcast_messages():
    while True:
        data = await message_queue.get()
        dead = set()
        for ws in connected_clients:
            try:
                await ws.send_json(data)
            except:
                dead.add(ws)
        for ws in dead:
            connected_clients.discard(ws)

def on_receive(packet, interface):
    if "decoded" not in packet:
        return

    node_id = packet.get("from")
    node_info = interface.nodes.get(node_id, {})
    name = node_info.get("user", {}).get("longName", f"Node-{node_id}")
    portnum = packet["decoded"].get("portnum")

    data_to_send = None

    if portnum == "TELEMETRY_APP":
        telemetry = packet["decoded"].get("telemetry", {})

        data_to_send = {
            "type": "telemetry",
            "from": name,
            "node_num": node_id
        }

        if "deviceMetrics" in telemetry:
            metrics = telemetry["deviceMetrics"]
            
            batt = metrics.get("batteryLevel", "N/A")
            volt = metrics.get("voltage", "N/A")
            uptime = metrics.get("uptimeSeconds", "N/A")

            if(batt>100):
                batt = 100

            data_to_send.update({
                "subtype": "device",
                "battery": batt,
                "voltage": volt,
                "uptime": uptime
            })
            
            print(f"Power from {name}: Batt: {batt}%, Volt: {volt}V")

        elif "environmentMetrics" in telemetry:
            env = telemetry["environmentMetrics"]
            
            temp = env.get("temperature", "N/A")
            hum = env.get("relativeHumidity", "N/A")
            pres = env.get("barometricPressure", "N/A")

            data_to_send.update({
                "subtype": "environment",
                "temperature": temp,
                "humidity": hum,
                "pressure": pres
            })

            print(f"Env from {name}: Temp: {temp}C, Hum: {hum}%")
        
        else:
            return

    elif portnum == "TEXT_MESSAGE_APP":
        payload = packet["decoded"].get("payload")
        if isinstance(payload, bytes):
            payload = payload.decode("utf-8", errors="ignore")

        print(f"Message from {name}: {payload}")
        
        # Try to parse as JSON sensor data
        try:
            parsed = json.loads(payload)
            sensor_fields = {"co2", "t", "h", "lat", "lon", "id"}
            if sensor_fields.issubset(parsed.keys()):
                data_to_send = {
                    "type": "sensor_data",
                    "from": name,
                    "node_num": node_id,
                    "device_id": parsed["id"],
                    "co2": parsed["co2"],
                    "temperature": parsed["t"],
                    "humidity": parsed["h"],
                    "latitude": parsed["lat"],
                    "longitude": parsed["lon"],
                    "gps_fix": parsed.get("fix", 0),
                    "timestamp": parsed.get("ts", 0)
                }
            else:
                data_to_send = {
                    "type": "text_message",
                    "from": name,
                    "node_num": node_id,
                    "message": payload
                }
        except (json.JSONDecodeError, TypeError):
            data_to_send = {
                "type": "text_message",
                "from": name,
                "node_num": node_id,
                "message": payload
            }

    if data_to_send and main_loop and message_queue:
        main_loop.call_soon_threadsafe(
            message_queue.put_nowait,
            data_to_send
        )

pub.subscribe(on_receive, "meshtastic.receive")

try:
    interface = meshtastic.serial_interface.SerialInterface(devPath="COM17")
    print("Connected to Meshtastic Node on COM17")
except Exception as e:
    print(f"Failed to connect to Meshtastic: {e}")

@app.get("/")
def health():
    return {"status": "running", "clients": len(connected_clients)}
