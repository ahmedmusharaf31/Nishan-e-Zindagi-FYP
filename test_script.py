import asyncio
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

connected_clients = set()
message_queue = None
main_loop = None
packet_buffer = {}

@app.on_event("startup")
async def startup():
    global message_queue, main_loop
    main_loop = asyncio.get_running_loop()
    message_queue = asyncio.Queue()
    print("FastAPI started")

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

async def flush_buffer(node_id):
    await asyncio.sleep(2.0)
    
    if node_id in packet_buffer:
        data = packet_buffer[node_id]['data']
        
        name = data.get('from', 'Unknown')
        batt = data.get('battery')
        volt = data.get('voltage')
        msg = data.get('message')
        
        if batt is not None:
            print(f"Power from {name}: Batt: {batt}%, Volt: {volt}V")
        if msg is not None:
            print(f"Message from {name}: {msg}")

        dead = set()
        for ws in connected_clients:
            try:
                await ws.send_json(data)
            except:
                dead.add(ws)
        for ws in dead:
            connected_clients.discard(ws)
        
        del packet_buffer[node_id]

def process_buffer(new_data):
    node_id = new_data.get('node_num')
    if not node_id:
        return

    if node_id not in packet_buffer:
        packet_buffer[node_id] = {'data': {}, 'task': None}

    packet_buffer[node_id]['data'].update(new_data)

    if packet_buffer[node_id]['task']:
        packet_buffer[node_id]['task'].cancel()

    packet_buffer[node_id]['task'] = asyncio.create_task(flush_buffer(node_id))

def on_receive(packet, interface):
    if "decoded" not in packet:
        return

    node_id = packet.get("from")
    node_info = interface.nodes.get(node_id, {})
    name = node_info.get("user", {}).get("longName", f"Node-{node_id}")
    portnum = packet["decoded"].get("portnum")

    device_metrics = node_info.get("deviceMetrics", {})
    batt = device_metrics.get("batteryLevel", None)
    volt = device_metrics.get("voltage", None)
    uptime = device_metrics.get("uptimeSeconds", None)

    if isinstance(batt, (int, float)) and batt > 100:
        batt = 100

    data_chunk = {
        "from": name,
        "node_num": node_id,
        "type": "merged_event"
    }

    if portnum == "TELEMETRY_APP":
        telemetry = packet["decoded"].get("telemetry", {})
        
        if "deviceMetrics" in telemetry:
            metrics = telemetry["deviceMetrics"]
            cur_batt = metrics.get("batteryLevel", batt)
            if isinstance(cur_batt, (int, float)) and cur_batt > 100:
                cur_batt = 100
                
            data_chunk.update({
                "battery": cur_batt,
                "voltage": metrics.get("voltage", volt),
                "uptime": metrics.get("uptimeSeconds", uptime)
            })

        elif "environmentMetrics" in telemetry:
            env = telemetry["environmentMetrics"]
            data_chunk.update({
                "temperature": env.get("temperature"),
                "humidity": env.get("relativeHumidity"),
                "pressure": env.get("barometricPressure")
            })

    elif portnum == "TEXT_MESSAGE_APP":
        payload = packet["decoded"].get("payload")
        if isinstance(payload, bytes):
            payload = payload.decode("utf-8", errors="ignore")
        
        data_chunk.update({
            "message": payload,
            "battery": batt,
            "voltage": volt,
            "uptime": uptime
        })

    if main_loop:
        main_loop.call_soon_threadsafe(process_buffer, data_chunk)

pub.subscribe(on_receive, "meshtastic.receive")

try:
    interface = meshtastic.serial_interface.SerialInterface(devPath="COM17")
    print("Connected to Meshtastic Node on COM17")
except Exception as e:
    print(f"Failed to connect to Meshtastic: {e}")

@app.get("/")
def health():
    return {"status": "running", "clients": len(connected_clients)}
