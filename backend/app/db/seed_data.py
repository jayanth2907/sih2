import sys
import os
import random
from datetime import datetime, timezone, timedelta

# Ensure backend root is on sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.core.security import hash_password
from app.models import (
    Role, Permission, UserRole, User, UserMineAssignment,
    Mine, MineLevel, MineZone,
    SensorType, Sensor, SensorReading,
    Camera, Equipment,
    Incident, IncidentEvent,
    Violation, CorrectiveAction,
    RiskScore, RiskFactor, AnomalyEvent,
    Alert, AuditEvent,
    Shift, Worker, AttendanceRecord,
    Contractor, Contract, ContractRequirement,
    ProductionReport, EnvironmentalRule, EnvironmentalObservation,
    Grievance, RegulatoryReport, ReportVersion,
    GovernanceTask, ApprovalRequest, ApprovalAction
)
from app.services.audit_service import AuditService

def seed():
    print("Initializing Database schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(Role).first():
            print("Resetting database schema for clean Phase 2 seed...")
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)

        print("Seeding Roles and Permissions...")
        roles = {
            "SYSTEM_ADMIN": Role(name="SYSTEM_ADMIN", description="Platform Administrator with cross-mine governance"),
            "MINE_MANAGER": Role(name="MINE_MANAGER", description="Operational Mine Manager scoped to assigned mine"),
            "MINE_SAFETY_OFFICER": Role(name="MINE_SAFETY_OFFICER", description="Safety Compliance Officer for mine safety protocols"),
            "FIELD_INSPECTOR": Role(name="FIELD_INSPECTOR", description="Field Inspector logging observations and violations"),
            "CONTRACTOR_MANAGER": Role(name="CONTRACTOR_MANAGER", description="Contractor workforce compliance officer"),
            "REGULATOR": Role(name="REGULATOR", description="DGMS / Statutory Regulatory auditor with oversight")
        }
        for r in roles.values():
            db.add(r)
        db.commit()

        print("Seeding Sensor Types...")
        st = {
            "CH4": SensorType(code="METHANE", name="Methane Gas (CH4)", unit="%", default_normal_min=0.0, default_normal_max=0.5, default_warning_threshold=0.75, default_critical_threshold=1.25, description="Underground seam methane concentration"),
            "CO": SensorType(code="CARBON_MONOXIDE", name="Carbon Monoxide (CO)", unit="ppm", default_normal_min=0.0, default_normal_max=15.0, default_warning_threshold=25.0, default_critical_threshold=50.0, description="Early spontaneous combustion indicator"),
            "TEMP": SensorType(code="TEMPERATURE", name="Ambient Temperature", unit="°C", default_normal_min=18.0, default_normal_max=32.0, default_warning_threshold=36.0, default_critical_threshold=42.0, description="Working face temperature"),
            "VEL": SensorType(code="AIR_VELOCITY", name="Airway Ventilation Velocity", unit="m/s", default_normal_min=1.5, default_normal_max=6.0, default_warning_threshold=1.0, default_critical_threshold=0.5, description="Main return airway airflow rate"),
            "DUST": SensorType(code="DUST_PM", name="Respirable Coal Dust PM10", unit="mg/m3", default_normal_min=0.0, default_normal_max=2.0, default_warning_threshold=3.0, default_critical_threshold=5.0, description="Particulate matter exposure"),
            "VIB": SensorType(code="VIBRATION", name="Strata Seismic Vibration", unit="mm/s", default_normal_min=0.0, default_normal_max=3.0, default_warning_threshold=6.0, default_critical_threshold=10.0, description="Roof strata stability vibration"),
            "HUM": SensorType(code="HUMIDITY", name="Relative Humidity", unit="%RH", default_normal_min=40.0, default_normal_max=80.0, default_warning_threshold=88.0, default_critical_threshold=95.0, description="Gallery relative humidity"),
            "PRES": SensorType(code="PRESSURE", name="Barometric Pressure", unit="kPa", default_normal_min=98.0, default_normal_max=103.0, default_warning_threshold=95.0, default_critical_threshold=92.0, description="Atmospheric barometric pressure")
        }
        for s in st.values():
            db.add(s)
        db.commit()

        print("Seeding 3 Realistic Demo Coal Mines...")
        m1 = Mine(code="MINE-BDS-04", name="Bharat Deep Shaft 4", description="Deep underground mechanized longwall coal mine in Jharia coalfields.", mine_type="UNDERGROUND", state="Jharkhand", district="Dhanbad", latitude=23.7957, longitude=86.4304, elevation=-320.0, status="OPERATIONAL")
        m2 = Mine(code="MINE-SOB-02", name="Singrauli OpenCast Basin", description="Large-scale mechanized opencast coal deposit with dragline benches.", mine_type="OPENCAST", state="Madhya Pradesh", district="Singrauli", latitude=24.1997, longitude=82.6645, elevation=280.0, status="OPERATIONAL")
        m3 = Mine(code="MINE-RS-07", name="Raniganj Seam 7 Incline", description="Intermediate depth underground incline mine with continuous miner galleries.", mine_type="UNDERGROUND", state="West Bengal", district="Paschim Bardhaman", latitude=23.6186, longitude=87.1264, elevation=-180.0, status="OPERATIONAL")
        db.add_all([m1, m2, m3])
        db.commit()

        print("Seeding Levels and Zones...")
        # Mine 1 Levels & Zones
        m1_l0 = MineLevel(mine_id=m1.id, code="LVL-SURF", name="Surface Yard & Fan Complex", depth_meters=0.0, elevation=210.0, sequence_order=0)
        m1_l1 = MineLevel(mine_id=m1.id, code="LVL-SEAM-01", name="Seam 1 Haulage (220m Depth)", depth_meters=220.0, elevation=-10.0, sequence_order=1)
        m1_l2 = MineLevel(mine_id=m1.id, code="LVL-SEAM-02", name="Seam 2 Longwall Workings (320m Depth)", depth_meters=320.0, elevation=-110.0, sequence_order=2)
        db.add_all([m1_l0, m1_l1, m1_l2])
        db.commit()

        m1_z_east = MineZone(mine_id=m1.id, level_id=m1_l2.id, code="ZN-EAST-LW-102", name="East Longwall Face 102", zone_type="PRODUCTION", risk_category="HIGH", origin_x=120.0, origin_y=450.0, origin_z=-320.0, width=200.0, length=400.0, height=4.5)
        m1_z_west = MineZone(mine_id=m1.id, level_id=m1_l2.id, code="ZN-WEST-DEV-201", name="West Heading Development", zone_type="PRODUCTION", risk_category="MEDIUM", origin_x=-150.0, origin_y=350.0, origin_z=-320.0, width=150.0, length=300.0, height=4.0)
        m1_z_haul = MineZone(mine_id=m1.id, level_id=m1_l1.id, code="ZN-MAIN-HAUL-A", name="Main Haulage Drift A", zone_type="HAULAGE", risk_category="MEDIUM", origin_x=0.0, origin_y=100.0, origin_z=-220.0, width=50.0, length=800.0, height=5.0)
        m1_z_vent = MineZone(mine_id=m1.id, level_id=m1_l0.id, code="ZN-VENT-FAN-SURF", name="Main Exhauster Fan House", zone_type="VENTILATION", risk_category="LOW", origin_x=-50.0, origin_y=-30.0, origin_z=210.0, width=40.0, length=40.0, height=8.0)
        db.add_all([m1_z_east, m1_z_west, m1_z_haul, m1_z_vent])

        # Mine 2 Levels & Zones
        m2_l1 = MineLevel(mine_id=m2.id, code="LVL-PIT-01", name="Pit Bench Level 3", depth_meters=45.0, elevation=235.0, sequence_order=1)
        m2_l2 = MineLevel(mine_id=m2.id, code="LVL-PIT-02", name="Deep Bench Level 6", depth_meters=90.0, elevation=190.0, sequence_order=2)
        db.add_all([m2_l1, m2_l2])
        db.commit()

        m2_z_b3 = MineZone(mine_id=m2.id, level_id=m2_l1.id, code="ZN-PIT-BENCH-3A", name="Bench 3A Shovel Zone", zone_type="PRODUCTION", risk_category="MEDIUM", origin_x=300.0, origin_y=200.0, origin_z=235.0, width=300.0, length=500.0, height=15.0)
        m2_z_haul = MineZone(mine_id=m2.id, level_id=m2_l1.id, code="ZN-HAUL-ROAD-EAST", name="East Main Haul Road", zone_type="HAULAGE", risk_category="LOW", origin_x=100.0, origin_y=50.0, origin_z=250.0, width=80.0, length=1200.0, height=10.0)
        db.add_all([m2_z_b3, m2_z_haul])

        # Mine 3 Levels & Zones
        m3_l1 = MineLevel(mine_id=m3.id, code="LVL-RS-07", name="Seam 7 Incline Workings", depth_meters=180.0, elevation=-30.0, sequence_order=1)
        db.add(m3_l1)
        db.commit()
        m3_z_hd = MineZone(mine_id=m3.id, level_id=m3_l1.id, code="ZN-HEADING-NORTH", name="North Development Heading", zone_type="PRODUCTION", risk_category="MEDIUM", origin_x=80.0, origin_y=300.0, origin_z=-180.0, width=60.0, length=250.0, height=3.8)
        db.add(m3_z_hd)
        db.commit()

        print("Seeding Users...")
        pwd = hash_password("Trinetra@2026")
        u_admin = User(email="admin@trinetra.gov.in", full_name="Dr. Arvind Sharma", hashed_password=pwd, designation="Chief Compliance Officer", department="Directorate of Mine Governance", is_superuser=True)
        u_mgr1 = User(email="manager.mine1@trinetra.gov.in", full_name="Rajesh Verma", hashed_password=pwd, designation="General Mine Manager", department="Operations BDS-04")
        u_safety1 = User(email="safety.mine1@trinetra.gov.in", full_name="Sanjay K. Roy", hashed_password=pwd, designation="Senior Safety Officer", department="Safety Engineering BDS-04")
        u_mgr2 = User(email="manager.mine2@trinetra.gov.in", full_name="Pooja Deshmukh", hashed_password=pwd, designation="Project Officer", department="Operations SOB-02")
        u_insp = User(email="inspector.dgms@trinetra.gov.in", full_name="Vikramaditya Rathore", hashed_password=pwd, designation="Deputy Director DGMS", department="Field Inspection")
        u_reg = User(email="regulator@dgms.gov.in", full_name="Ananya Sengupta", hashed_password=pwd, designation="Statutory Commissioner", department="Ministry of Coal")
        db.add_all([u_admin, u_mgr1, u_safety1, u_mgr2, u_insp, u_reg])
        db.commit()

        db.add(UserRole(user_id=u_admin.id, role_id=roles["SYSTEM_ADMIN"].id))
        db.add(UserRole(user_id=u_mgr1.id, role_id=roles["MINE_MANAGER"].id))
        db.add(UserRole(user_id=u_safety1.id, role_id=roles["MINE_SAFETY_OFFICER"].id))
        db.add(UserRole(user_id=u_mgr2.id, role_id=roles["MINE_MANAGER"].id))
        db.add(UserRole(user_id=u_insp.id, role_id=roles["FIELD_INSPECTOR"].id))
        db.add(UserRole(user_id=u_reg.id, role_id=roles["REGULATOR"].id))

        db.add(UserMineAssignment(user_id=u_mgr1.id, mine_id=m1.id, is_primary=True))
        db.add(UserMineAssignment(user_id=u_safety1.id, mine_id=m1.id, is_primary=True))
        db.add(UserMineAssignment(user_id=u_mgr2.id, mine_id=m2.id, is_primary=True))
        db.add(UserMineAssignment(user_id=u_insp.id, mine_id=m1.id, is_primary=True))
        db.add(UserMineAssignment(user_id=u_insp.id, mine_id=m2.id, is_primary=False))
        db.commit()

        print("Seeding Sensors (18 Sensors for Mine 1, 12 for Mine 2, 8 for Mine 3)...")
        now = datetime.now(timezone.utc)
        sensors_list = []

        # Mine 1 Sensors (BDS-04)
        m1_sensor_configs = [
            ("SN-BDS04-CH4-101", "CH4", "East Longwall Return Methane Monitor", 0.05, 0.45, 0.75, 1.25, 145.0, 470.0, -318.0, m1_l2.id, m1_z_east.id, 0.35),
            ("SN-BDS04-CH4-102", "CH4", "East Face Cutting Drum CH4 Probe", 0.05, 0.45, 0.75, 1.25, 138.0, 462.0, -319.0, m1_l2.id, m1_z_east.id, 0.42),
            ("SN-BDS04-CO-101", "CO", "Seam 2 Goaf Carbon Monoxide Sensor", 1.0, 12.0, 25.0, 50.0, 160.0, 485.0, -319.0, m1_l2.id, m1_z_east.id, 9.2),
            ("SN-BDS04-CO-102", "CO", "East Tailgate Early Spontaneous CO Probe", 1.0, 12.0, 25.0, 50.0, 150.0, 475.0, -318.0, m1_l2.id, m1_z_east.id, 8.5),
            ("SN-BDS04-VEL-101", "VEL", "Main Intake Air Velocity Anemometer", 2.0, 4.5, 1.2, 0.6, 20.0, 200.0, -218.0, m1_l1.id, m1_z_haul.id, 3.2),
            ("SN-BDS04-VEL-102", "VEL", "East Return Airway Velocity Meter", 1.8, 4.0, 1.0, 0.5, 140.0, 480.0, -318.0, m1_l2.id, m1_z_east.id, 2.8),
            ("SN-BDS04-TEMP-101", "TEMP", "East Longwall Face Ambient Temp", 22.0, 30.0, 34.0, 39.0, 135.0, 460.0, -319.0, m1_l2.id, m1_z_east.id, 27.5),
            ("SN-BDS04-TEMP-102", "TEMP", "Main Surface Fan Bearing Temp", 35.0, 55.0, 68.0, 85.0, -48.0, -28.0, 211.0, m1_l0.id, m1_z_vent.id, 48.0),
            ("SN-BDS04-DUST-101", "DUST", "Haulage Transfer Point Dust Monitor", 0.2, 1.8, 2.8, 4.5, 15.0, 180.0, -218.0, m1_l1.id, m1_z_haul.id, 1.4),
            ("SN-BDS04-DUST-102", "DUST", "East Tailgate Coal Dust Sensor", 0.5, 2.0, 3.0, 5.0, 155.0, 480.0, -318.0, m1_l2.id, m1_z_east.id, 1.8),
            ("SN-BDS04-VIB-101", "VIB", "Seam 2 Longwall Roof Strata Geophone", 0.1, 2.5, 5.5, 9.0, 130.0, 455.0, -317.0, m1_l2.id, m1_z_east.id, 1.1),
            ("SN-BDS04-VIB-102", "VIB", "West Development Strata Vibration Sensor", 0.1, 2.5, 5.5, 9.0, -140.0, 360.0, -318.0, m1_l2.id, m1_z_west.id, 0.8),
            ("SN-BDS04-HUM-101", "HUM", "East Gallery Relative Humidity Sensor", 45.0, 75.0, 85.0, 92.0, 142.0, 465.0, -318.0, m1_l2.id, m1_z_east.id, 68.0),
            ("SN-BDS04-PRES-101", "PRES", "Shaft Bottom Barometric Sensor", 99.0, 102.5, 96.0, 93.0, 10.0, 120.0, -220.0, m1_l1.id, m1_z_haul.id, 101.3),
            ("SN-BDS04-CH4-201", "CH4", "West Heading Continuous Miner Gas Probe", 0.05, 0.45, 0.75, 1.25, -145.0, 370.0, -319.0, m1_l2.id, m1_z_west.id, 0.28),
            ("SN-BDS04-CO-201", "CO", "West Heading Carbon Monoxide Node", 1.0, 12.0, 25.0, 50.0, -148.0, 375.0, -319.0, m1_l2.id, m1_z_west.id, 6.4),
            ("SN-BDS04-VEL-201", "VEL", "West Heading Auxiliary Air Anemometer", 1.5, 3.5, 0.8, 0.4, -135.0, 345.0, -318.0, m1_l2.id, m1_z_west.id, 2.1),
            ("SN-BDS04-PRES-001", "PRES", "Surface Fan Differential Pressure Gauge", 2.0, 4.2, 5.5, 7.0, -52.0, -32.0, 210.0, m1_l0.id, m1_z_vent.id, 3.1)
        ]

        for code, type_key, name, n_min, n_max, w_th, c_th, x, y, z, lvl_id, zn_id, last_v in m1_sensor_configs:
            s = Sensor(
                sensor_code=code, mine_id=m1.id, level_id=lvl_id, zone_id=zn_id, sensor_type_id=st[type_key].id,
                name=name, unit=st[type_key].unit, normal_min=n_min, normal_max=n_max, warning_threshold=w_th,
                critical_threshold=c_th, x=x, y=y, z=z, status="ACTIVE", last_value=last_v, last_reading_at=now
            )
            db.add(s)
            sensors_list.append(s)

        # Mine 2 Sensors (SOB-02)
        m2_sensor_configs = [
            ("SN-SOB02-DUST-201", "DUST", "Pit Bench 3A Respirable Dust Monitor", 0.4, 1.8, 2.8, 4.5, 320.0, 240.0, 235.0, m2_l1.id, m2_z_b3.id, 1.65),
            ("SN-SOB02-DUST-202", "DUST", "East Haul Road Dust Dispersion Sensor", 0.5, 2.2, 3.5, 5.5, 120.0, 80.0, 250.0, m2_l1.id, m2_z_haul.id, 2.1),
            ("SN-SOB02-TEMP-201", "TEMP", "Bench 3A Shovel Engine Bay Thermistor", 40.0, 75.0, 90.0, 105.0, 315.0, 235.0, 236.0, m2_l1.id, m2_z_b3.id, 62.0),
            ("SN-SOB02-VIB-201", "VIB", "Highwall Bench Stability Seismograph", 0.1, 3.0, 6.0, 10.0, 290.0, 190.0, 238.0, m2_l1.id, m2_z_b3.id, 1.4),
            ("SN-SOB02-PRES-201", "PRES", "Opencast Weather Station Barometer", 97.0, 102.0, 94.0, 91.0, 150.0, 100.0, 260.0, m2_l1.id, m2_z_haul.id, 100.8),
            ("SN-SOB02-HUM-201", "HUM", "Bench Ambient Humidity Probe", 30.0, 70.0, 85.0, 95.0, 310.0, 220.0, 235.0, m2_l1.id, m2_z_b3.id, 55.0)
        ]
        for code, type_key, name, n_min, n_max, w_th, c_th, x, y, z, lvl_id, zn_id, last_v in m2_sensor_configs:
            s = Sensor(
                sensor_code=code, mine_id=m2.id, level_id=lvl_id, zone_id=zn_id, sensor_type_id=st[type_key].id,
                name=name, unit=st[type_key].unit, normal_min=n_min, normal_max=n_max, warning_threshold=w_th,
                critical_threshold=c_th, x=x, y=y, z=z, status="ACTIVE", last_value=last_v, last_reading_at=now
            )
            db.add(s)
            sensors_list.append(s)

        # Mine 3 Sensors (RS-07)
        m3_sensor_configs = [
            ("SN-RS07-CH4-301", "CH4", "North Heading Telemetric Gas Sensor", 0.02, 0.35, 0.70, 1.20, 95.0, 320.0, -178.0, m3_l1.id, m3_z_hd.id, 0.28),
            ("SN-RS07-CO-301", "CO", "Incline Workings Carbon Monoxide Sensor", 1.0, 10.0, 20.0, 45.0, 90.0, 310.0, -178.0, m3_l1.id, m3_z_hd.id, 4.8),
            ("SN-RS07-VEL-301", "VEL", "North Incline Airflow Anemometer", 1.5, 3.8, 1.0, 0.5, 85.0, 290.0, -179.0, m3_l1.id, m3_z_hd.id, 2.4),
            ("SN-RS07-DUST-301", "DUST", "Heading Face Dust Transmissometer", 0.3, 1.5, 2.5, 4.0, 100.0, 330.0, -177.0, m3_l1.id, m3_z_hd.id, 1.2)
        ]
        for code, type_key, name, n_min, n_max, w_th, c_th, x, y, z, lvl_id, zn_id, last_v in m3_sensor_configs:
            s = Sensor(
                sensor_code=code, mine_id=m3.id, level_id=lvl_id, zone_id=zn_id, sensor_type_id=st[type_key].id,
                name=name, unit=st[type_key].unit, normal_min=n_min, normal_max=n_max, warning_threshold=w_th,
                critical_threshold=c_th, x=x, y=y, z=z, status="ACTIVE", last_value=last_v, last_reading_at=now
            )
            db.add(s)
            sensors_list.append(s)

        db.commit()

        print("Seeding Cameras and Machinery...")
        c1 = Camera(camera_code="CAM-BDS04-SHAFT-01", mine_id=m1.id, level_id=m1_l0.id, zone_id=m1_z_vent.id, name="Shaft Top Winding Engine Camera", camera_type="FLAME_PROOF_EX", stream_url="rtsp://demo.mine.lan/bds04/cam01", status="ACTIVE", x=-45.0, y=-25.0, z=212.0, yaw=135.0, pitch=-15.0, fov=85.0, is_simulated="SIMULATED")
        c2 = Camera(camera_code="CAM-BDS04-LW-02", mine_id=m1.id, level_id=m1_l2.id, zone_id=m1_z_east.id, name="East Longwall Tailgate Camera", camera_type="FIXED_OPTICAL", stream_url="rtsp://demo.mine.lan/bds04/cam02", status="ACTIVE", x=130.0, y=460.0, z=-317.0, yaw=45.0, pitch=-10.0, fov=90.0, is_simulated="SIMULATED")
        c3 = Camera(camera_code="CAM-BDS04-LW-03", mine_id=m1.id, level_id=m1_l2.id, zone_id=m1_z_east.id, name="East Face Shearer Pan Camera", camera_type="FLAME_PROOF_EX", stream_url="rtsp://demo.mine.lan/bds04/cam03", status="ACTIVE", x=142.0, y=468.0, z=-318.0, yaw=90.0, pitch=-5.0, fov=110.0, is_simulated="SIMULATED")
        db.add_all([c1, c2, c3])

        eq1 = Equipment(equipment_code="EQP-BDS04-SHR-01", mine_id=m1.id, level_id=m1_l2.id, zone_id=m1_z_east.id, name="Joy Heavy Longwall Double-Drum Shearer", category="SHEARER", status="OPERATIONAL", manufacturer="Komatsu Mining", x=140.0, y=465.0, z=-320.0, last_serviced_at=now - timedelta(days=12), next_service_due=now + timedelta(days=18))
        eq2 = Equipment(equipment_code="EQP-BDS04-FAN-01", mine_id=m1.id, level_id=m1_l0.id, zone_id=m1_z_vent.id, name="Main Surface Centrifugal Exhauster Fan", category="VENTILATION_FAN", status="OPERATIONAL", manufacturer="Voltas", x=-50.0, y=-30.0, z=210.0, last_serviced_at=now - timedelta(days=5), next_service_due=now + timedelta(days=25))
        eq3 = Equipment(equipment_code="EQP-BDS04-CONV-01", mine_id=m1.id, level_id=m1_l1.id, zone_id=m1_z_haul.id, name="Armoured Face Main Trunk Conveyor", category="CONVEYOR", status="OPERATIONAL", manufacturer="Elecon", x=10.0, y=150.0, z=-220.0, last_serviced_at=now - timedelta(days=8), next_service_due=now + timedelta(days=22))
        db.add_all([eq1, eq2, eq3])
        db.commit()

        print("Seeding Initial Sensor Readings, Anomaly Events, and Alerts...")
        # Create initial readings
        for s in sensors_list:
            r = SensorReading(sensor_id=s.id, timestamp=now - timedelta(minutes=random.randint(1, 10)), value=s.last_value, unit=s.unit, quality="GOOD", source="SIMULATED", ingestion_timestamp=now)
            db.add(r)
        db.commit()

        # Seed 1 initial active anomaly and alert for Mine 1
        s_methane = next(s for s in sensors_list if s.sensor_code == "SN-BDS04-CH4-101")
        anom1 = AnomalyEvent(
            mine_id=m1.id,
            sensor_id=s_methane.id,
            level_id=m1_l2.id,
            zone_id=m1_z_east.id,
            anomaly_type="THRESHOLD_EXCEEDED",
            severity="WARNING",
            observed_value=0.82,
            expected_range="0.05 - 0.45 %",
            threshold_limit=0.75,
            unit="%",
            description="East Longwall Return Methane Monitor exceeded warning threshold: 0.82% >= 0.75%.",
            x=s_methane.x,
            y=s_methane.y,
            z=s_methane.z,
            source="SIMULATED",
            status="ACTIVE",
            detected_at=now - timedelta(minutes=15)
        )
        db.add(anom1)
        db.flush()

        alert1 = Alert(
            mine_id=m1.id,
            sensor_id=s_methane.id,
            anomaly_id=anom1.id,
            title=f"Telemetry Alert: {s_methane.name} ({s_methane.sensor_code})",
            message=anom1.description,
            severity="WARNING",
            risk_score=38.5,
            status="UNREAD",
            source="SIMULATED",
            location_context="East Longwall Face 102 (145.0, 470.0, -318.0)",
            deduplication_key=f"MINE_{m1.id}_SENSOR_{s_methane.id}_THRESHOLD_EXCEEDED",
            created_at=now - timedelta(minutes=15)
        )
        db.add(alert1)

        # Baseline Risk Scores
        r1 = RiskScore(mine_id=m1.id, score=38.5, severity="MEDIUM", rule_score=18.0, ml_score=8.5, silence_risk_score=12.0, explanation="Moderate risk driven by 1 active gas anomaly and statutory dust barrier compliance notices.", model_version="TRINETRA-RISK-v1.0", rule_version="DGMS-RULESET-2026.1", generated_at=now)
        db.add(r1)
        db.flush()
        db.add(RiskFactor(risk_score_id=r1.id, factor_name="Active Methane Warning Surge", weight=0.35, contribution_points=8.5, details="SN-BDS04-CH4-101 reading above warning threshold."))
        db.commit()

        print("Seeding Phase 4 Governance Data (Production, Workforce, Contractors, Environmental, Grievances, Approvals, Reports)...")
        # 1. Shifts
        sh_a1 = Shift(mine_id=m1.id, shift_code="A", name="Morning Production Shift A", start_time="06:00", end_time="14:00", is_night_shift=False)
        sh_b1 = Shift(mine_id=m1.id, shift_code="B", name="Afternoon Production Shift B", start_time="14:00", end_time="22:00", is_night_shift=False)
        sh_c1 = Shift(mine_id=m1.id, shift_code="C", name="Night Maintenance Shift C", start_time="22:00", end_time="06:00", is_night_shift=True)
        db.add_all([sh_a1, sh_b1, sh_c1])
        db.commit()

        # 2. Contractors
        c_komatsu = Contractor(contractor_code="CNT-KOMATSU-01", company_name="Komatsu Heavy Mining Engineering Ltd", registration_number="REG-IND-88219", contact_person="Rameshwar Jha", email="jha@komatsu.mining.in", phone="+91 98301 22910", safety_rating=4.8, status="ACTIVE")
        c_elecon = Contractor(contractor_code="CNT-ELECON-02", company_name="Elecon Trunk Conveyor Maintenance", registration_number="REG-IND-77102", contact_person="Dinesh Choudhury", email="dinesh@elecon.in", phone="+91 94311 55210", safety_rating=4.4, status="ACTIVE")
        c_haulage = Contractor(contractor_code="CNT-EAST-03", company_name="Eastern Surface Coal Haulers LLP", registration_number="REG-IND-55420", contact_person="Gurmeet Singh", email="gurmeet@easthaul.com", phone="+91 98711 00921", safety_rating=3.8, status="ACTIVE")
        db.add_all([c_komatsu, c_elecon, c_haulage])
        db.commit()

        # 3. Contracts
        today_date = now.date()
        ct1 = Contract(contract_code="CON-BDS04-SHR-2026", contractor_id=c_komatsu.id, mine_id=m1.id, work_scope="Longwall Shearer OEM Maintenance & Strata Tooling", start_date=today_date - timedelta(days=90), end_date=today_date + timedelta(days=275), total_value=12500000.0, status="ACTIVE", compliance_status="COMPLIANT", responsible_officer_id=u_mgr1.id)
        ct2 = Contract(contract_code="CON-BDS04-CNV-2026", contractor_id=c_elecon.id, mine_id=m1.id, work_scope="Trunk Conveyor Belt Splice & Roller Overhaul", start_date=today_date - timedelta(days=340), end_date=today_date + timedelta(days=25), total_value=4800000.0, status="EXPIRING", compliance_status="REVIEW_REQUIRED", responsible_officer_id=u_safety1.id)
        db.add_all([ct1, ct2])
        db.commit()

        # 4. Workers & Attendance
        workers = [
            Worker(worker_code="WRK-BDS-001", full_name="Budhan Manjhi", designation="Senior Overman", trade_category="OVERMAN", mine_id=m1.id, is_contractual=False, blood_group="O+"),
            Worker(worker_code="WRK-BDS-002", full_name="Sunil Soren", designation="Longwall Shearer Operator", trade_category="OPERATOR", mine_id=m1.id, is_contractual=True, contractor_id=c_komatsu.id, blood_group="B+"),
            Worker(worker_code="WRK-BDS-003", full_name="Manohar Karmakar", designation="Underground Chief Electrician", trade_category="ELECTRICIAN", mine_id=m1.id, is_contractual=False, blood_group="A+"),
            Worker(worker_code="WRK-BDS-004", full_name="Raju Murmu", designation="Face Driller", trade_category="DRILLER", mine_id=m1.id, is_contractual=True, contractor_id=c_komatsu.id, blood_group="AB+"),
            Worker(worker_code="WRK-BDS-005", full_name="Arjun Nayak", designation="Conveyor Fitter", trade_category="FITTER", mine_id=m1.id, is_contractual=True, contractor_id=c_elecon.id, blood_group="O+")
        ]
        db.add_all(workers)
        db.commit()

        for w in workers:
            att = AttendanceRecord(worker_id=w.id, mine_id=m1.id, shift_id=sh_a1.id, attendance_date=today_date, check_in_time=now - timedelta(hours=3), status="PRESENT", verification_mode="SIMULATED", marked_by_id=u_safety1.id)
            db.add(att)
        db.commit()

        # 5. Production Reports
        prod1 = ProductionReport(
            report_code=f"PROD-1-{today_date.strftime('%Y%m%d')}-A",
            mine_id=m1.id,
            report_date=today_date,
            shift="A",
            material_type="COAL_RAW",
            planned_quantity=4500.0,
            actual_quantity=4120.0,
            unit="TONNES",
            variance_quantity=-380.0,
            variance_percentage=-8.44,
            status="APPROVED",
            deviation_flag="NORMAL",
            reporting_officer_id=u_mgr1.id,
            notes="Seam 2 East Longwall face regular shearing output."
        )
        db.add(prod1)

        # 6. Environmental Rules & Observation
        env_r1 = EnvironmentalRule(rule_code="ENV-RULE-PM10", parameter_name="Respirable Dust PM10", threshold_limit=3.0, unit="mg/m3", severity="HIGH", statute_reference="CMR 2017 Reg 143", description="Maximum 8-hour continuous respirable coal dust exposure at transfer points.")
        env_r2 = EnvironmentalRule(rule_code="ENV-RULE-NOISE", parameter_name="Ambient Machinery Noise", threshold_limit=85.0, unit="dBA", severity="MEDIUM", statute_reference="DGMS Tech Circular 04/2010", description="Permissible worker noise exposure level.")
        db.add_all([env_r1, env_r2])
        db.commit()

        env_obs1 = EnvironmentalObservation(
            mine_id=m1.id,
            rule_id=env_r1.id,
            parameter_name="Respirable Dust PM10",
            observed_value=2.8,
            threshold_limit=3.0,
            unit="mg/m3",
            severity="MEDIUM",
            status="OPEN",
            location_context="Seam 1 Main Haulage Transfer Drift",
            x=15.0,
            y=180.0,
            z=-218.0,
            action_taken="Water sprays activated at transfer chute.",
            detected_at=now - timedelta(hours=2)
        )
        db.add(env_obs1)

        # 7. Grievance
        grv1 = Grievance(
            grievance_code=f"GRV-1-{int(now.timestamp())}",
            mine_id=m1.id,
            category="SAFETY",
            title="Dust suppression mist spray nozzle clogged at Haulage Drift",
            description="Water pressure low at transfer point spray head causing increased airborne dust during peak hauling.",
            priority="HIGH",
            status="ASSIGNED",
            anonymous=False,
            submitted_by_id=u_safety1.id,
            assigned_to_id=u_mgr1.id,
            sla_hours=48,
            due_at=now + timedelta(hours=48)
        )
        db.add(grv1)

        # 8. Regulatory Report
        rep1 = RegulatoryReport(
            report_code="REP-MINE-BDS-04-STAT-202609",
            mine_id=m1.id,
            report_type="COMPLIANCE_SUMMARY",
            title="DGMS Statutory Monthly Mine Compliance & Safety Summary",
            reporting_period_start=today_date - timedelta(days=30),
            reporting_period_end=today_date,
            generated_by_id=u_admin.id,
            status="APPROVED",
            current_version=1,
            summary_data={
                "title": "DGMS Statutory Monthly Mine Compliance & Safety Summary",
                "report_code": "REP-MINE-BDS-04-STAT-202609",
                "mine_name": m1.name,
                "mine_code": m1.code,
                "mine_type": m1.mine_type,
                "period_start": (today_date - timedelta(days=30)).isoformat(),
                "period_end": today_date.isoformat(),
                "risk_score": 38.5,
                "risk_severity": "MEDIUM",
                "total_sensors": 18,
                "active_incidents": 1,
                "violations_count": 0,
                "actual_production": 4120.0,
                "planned_production": 4500.0,
                "variance_pct": -8.44,
                "attendance_count": 42,
                "attendance_pct": 94.2,
                "status": "APPROVED",
                "version": 1
            }
        )
        db.add(rep1)
        db.commit()

        # Seed Genesis Audit Log
        AuditService.log_event(
            db=db,
            actor_id=u_admin.id,
            action="SYSTEM_PHASE4_GOVERNANCE_SEED",
            resource_type="SYSTEM",
            resource_id="0",
            metadata={"environment": "development", "version": "1.0.0-phase4", "total_sensors": len(sensors_list), "total_workers": len(workers)}
        )

        print("\nPhase 4 Seed data generated successfully!")
        print(f"Total Sensors: {len(sensors_list)} | Total Workers: {len(workers)} | Total Contracts: 2")

    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()

