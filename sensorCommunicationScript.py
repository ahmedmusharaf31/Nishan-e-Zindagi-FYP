from machine import I2C, Pin, UART, RTC
import time
import json

# ================= CONFIGURATION =================
DEVICE_ID = "PicoB-001"
HOME_LAT = 34.070258
HOME_LON = 72.6426586
DUMMY_BATT = 98

# ================= INITIALIZATION =================
print("System starting...")
start_time = time.time()
rtc = RTC()

# Status LED Setup
# Pin 25 is the standard Pico LED. For Pico W, use Pin('LED', Pin.OUT)
led = Pin(25, Pin.OUT)

# UART 1 -> Meshtastic (SX1262)
mesh_uart = UART(1, baudrate=115200, tx=Pin(8), rx=Pin(9))
# UART 0 -> GPS (NEO-6M)
gps = UART(0, baudrate=9600, tx=Pin(0), rx=Pin(1))
# I2C -> SCD41
i2c = I2C(1, sda=Pin(6), scl=Pin(7), freq=10000)

SCD41_ADDR = 0x62

# ================= HELPERS =================

def seed_gps_ubx(uart, lat, lon):
    """Injects starting coordinates into NEO-6M to speed up indoor lock"""
    try:
        lat_int = int(lat * 10000000)
        lon_int = int(lon * 10000000)
        # UBX-AID-INI Header + Payload setup
        header = bytearray([0xB5, 0x62, 0x0B, 0x01, 0x30, 0x00])
        payload = bytearray([0] * 48)
        payload[12:14] = bytearray([0x01, 0x00]) # Position valid flag
        payload[16:20] = lon_int.to_bytes(4, 'little')
        payload[20:24] = lat_int.to_bytes(4, 'little')
        payload[24:28] = bytearray([0x10, 0x27, 0x00, 0x00]) # 10km accuracy
        
        full_msg = header + payload
        a, b = 0, 0
        for byte in full_msg[2:]:
            a = (a + byte) & 0xFF
            b = (b + a) & 0xFF
        uart.write(full_msg + bytearray([a, b]))
        print(f"GPS Seeded to: {lat}, {lon}")
    except Exception as e:
        print("Seeding failed:", e)

def nmea_to_decimal(raw, direction):
    if not raw or not direction: return None
    try:
        val = float(raw)
        deg = int(val // 100)
        minutes = val - deg * 100
        dec = deg + (minutes / 60)
        if direction in ("S", "W"): dec = -dec
        return round(dec, 6)
    except: return None

def sync_rtc(utc_time, utc_date):
    try:
        day, month, year = int(utc_date[0:2]), int(utc_date[2:4]), int("20"+utc_date[4:6])
        h, m, s = int(utc_time[0:2]), int(utc_time[2:4]), int(utc_time[4:6])
        rtc.datetime((year, month, day, 0, h, m, s, 0))
    except: pass

def get_dt_str():
    t = rtc.datetime()
    return "{:04d}-{:02d}-{:02d} {:02d}:{:02d}:{:02d}".format(t[0],t[1],t[2],t[4],t[5],t[6])

# ================= SENSOR SETUP =================
time.sleep(1)    
    
seed_gps_ubx(gps, HOME_LAT, HOME_LON)

try:
    i2c.writeto(SCD41_ADDR, b'\x3F\x86')
    time.sleep(0.5)
    i2c.writeto(SCD41_ADDR, b'\x21\xB1') # Start periodic measurement
    print("SCD41 Ready")
except:
    print("SCD41 Init Error")

# ================= STATE =================
lat, lon, alt, sats = None, None, None, None
last_scd_read = 0

# ================= MAIN LOOP =================
while True:
    for _ in range(2):
        led.value(1)
        time.sleep(0.1)
        led.value(0)
        time.sleep(0.1)
    # 1. Parse GPS
    if gps.any():
        line = gps.readline()
        if line:
            try:
                decoded = line.decode("utf-8")
                parts = decoded.split(",")
                
                # Date/Time Sync from RMC
                if decoded.startswith("$GPRMC") and len(parts) > 9:
                    if parts[2] == "A":
                        sync_rtc(parts[1], parts[9])
                
                # Position from GGA
                if decoded.startswith("$GPGGA") and len(parts) > 9:
                    if parts[6] != '0': # Fix quality check
                        lat = nmea_to_decimal(parts[2], parts[3])
                        lon = nmea_to_decimal(parts[4], parts[5])
                        alt = float(parts[9]) if parts[9] else None
                        sats = int(parts[7]) if parts[7] else None
            except: pass

    # 2. Sensor Read & JSON Send (Every 60 Sec)
    now = time.time()
    if now - last_scd_read >= 50:
        last_scd_read = now
        try:
            i2c.writeto(SCD41_ADDR, b'\xEC\x05')
            time.sleep(0.1)
            raw = i2c.readfrom(SCD41_ADDR, 9)
            co2 = (raw[0] << 8) | raw[1]
            temp = round(-45 + 175 * ((raw[3] << 8 | raw[4]) / 65535), 1)
            hum = round(100 * ((raw[6] << 8 | raw[7]) / 65535), 1)

            # Fallback logic for coordinates
            current_lat = lat if lat is not None else HOME_LAT
            current_lon = lon if lon is not None else HOME_LON
            fix_status = "LIVE" if lat is not None else "SEEDED"

            packet = {
                "id": DEVICE_ID,
                "ts": int(time.time()), # Using integer timestamp is shorter than string
                "lat": lat if lat is not None and fix_status == "LIVE" else HOME_LAT,
                "lon": lon if lon is not None and fix_status == "LIVE" else HOME_LON,
                "fix": 1 if lat is not None else 0, # 1 for Live, 0 for Seeded
                "co2": co2,
                "t": temp,
                "h": hum
            }

            payload = json.dumps(packet)
            print("TX:", payload)
            mesh_uart.write(payload + "\n")

        except OSError:
            print("SCD41 Sensor Busy")

    time.sleep(10)