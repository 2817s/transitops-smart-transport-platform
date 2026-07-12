const Database = require("better-sqlite3");
const path = require("path");
const bcrypt = require("bcryptjs");

const dbPath = path.join(__dirname, "transitops.db");
const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (
      role IN (
        'Fleet Manager',
        'Dispatcher',
        'Safety Officer',
        'Financial Analyst'
      )
    ),
    failed_login_attempts INTEGER DEFAULT 0,
    is_locked INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_number TEXT UNIQUE NOT NULL,
    vehicle_name TEXT NOT NULL,
    vehicle_model TEXT,
    vehicle_type TEXT NOT NULL,
    maximum_load_capacity REAL NOT NULL,
    odometer REAL DEFAULT 0,
    acquisition_cost REAL DEFAULT 0,
    region TEXT,
    status TEXT NOT NULL DEFAULT 'Available'
      CHECK (
        status IN ('Available', 'On Trip', 'In Shop', 'Retired')
      ),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    license_number TEXT UNIQUE NOT NULL,
    license_category TEXT NOT NULL,
    license_expiry_date TEXT NOT NULL,
    contact_number TEXT,
    safety_score REAL DEFAULT 100,
    region TEXT,
    status TEXT NOT NULL DEFAULT 'Available'
      CHECK (
        status IN ('Available', 'On Trip', 'Off Duty', 'Suspended')
      ),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_number TEXT UNIQUE NOT NULL,
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    vehicle_id INTEGER,
    driver_id INTEGER,
    cargo_weight REAL NOT NULL,
    planned_distance REAL NOT NULL,
    actual_distance REAL DEFAULT 0,
    start_odometer REAL DEFAULT 0,
    final_odometer REAL DEFAULT 0,
    fuel_consumed REAL DEFAULT 0,
    revenue REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft'
      CHECK (
        status IN ('Draft', 'Dispatched', 'Completed', 'Cancelled')
      ),
    dispatch_date TEXT,
    completion_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (driver_id) REFERENCES drivers(id)
  );

  CREATE TABLE IF NOT EXISTS maintenance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    service_type TEXT NOT NULL,
    description TEXT,
    cost REAL DEFAULT 0,
    service_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active'
      CHECK (
        status IN ('Active', 'Completed')
      ),
    completed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS fuel_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    trip_id INTEGER,
    liters REAL NOT NULL,
    fuel_cost REAL NOT NULL,
    fuel_date TEXT NOT NULL,
    odometer REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (trip_id) REFERENCES trips(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    trip_id INTEGER,
    expense_type TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    expense_date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (trip_id) REFERENCES trips(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    depot_name TEXT DEFAULT 'Gandhinagar Depot GJ',
    currency TEXT DEFAULT 'INR (Rs)',
    distance_unit TEXT DEFAULT 'Kilometers',
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

db.prepare(`
  INSERT OR IGNORE INTO settings (
    id,
    depot_name,
    currency,
    distance_unit
  )
  VALUES (1, 'Gandhinagar Depot GJ', 'INR (Rs)', 'Kilometers')
`).run();

const seedUsers = [
  {
    name: "Raven Fleet",
    email: "fleet@transitops.in",
    password: "Fleet@123",
    role: "Fleet Manager"
  },
  {
    name: "Raven Dispatcher",
    email: "dispatcher@transitops.in",
    password: "Dispatch@123",
    role: "Dispatcher"
  },
  {
    name: "Raven Safety",
    email: "safety@transitops.in",
    password: "Safety@123",
    role: "Safety Officer"
  },
  {
    name: "Raven Finance",
    email: "finance@transitops.in",
    password: "Finance@123",
    role: "Financial Analyst"
  }
];

const findUser = db.prepare(
  "SELECT id FROM users WHERE email = ?"
);

const insertUser = db.prepare(`
  INSERT INTO users (
    name,
    email,
    password_hash,
    role
  )
  VALUES (?, ?, ?, ?)
`);

for (const user of seedUsers) {
  const existingUser = findUser.get(user.email);

  if (!existingUser) {
    const passwordHash = bcrypt.hashSync(user.password, 10);

    insertUser.run(
      user.name,
      user.email,
      passwordHash,
      user.role
    );
  }
}

console.log("TransitOps SQLite database initialized.");
console.log("Four RBAC demo users are ready.");

module.exports = db;