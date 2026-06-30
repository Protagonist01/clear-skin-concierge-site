import 'server-only'

import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

let dbInstance: Database.Database | null = null

function getDatabasePath() {
  if (process.env.CLEAR_SKIN_DB_PATH) {
    return path.resolve(process.env.CLEAR_SKIN_DB_PATH)
  }

  return path.join(process.cwd(), 'data', 'clear-skin.sqlite')
}

function initializeSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT,
      phone TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS account_sessions (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS account_login_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      consumed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      reference TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL,
      schedule_status TEXT NOT NULL,
      treatment_slug TEXT NOT NULL,
      treatment_name TEXT NOT NULL,
      location_id TEXT NOT NULL,
      location_name TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      guest_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      concern TEXT,
      notes TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS schedule_slots (
      id TEXT PRIMARY KEY,
      location_id TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      status TEXT NOT NULL,
      booking_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(location_id, appointment_date, appointment_time),
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      order_number TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      payment_reference TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      email TEXT NOT NULL,
      city TEXT NOT NULL,
      address_line_1 TEXT,
      address_line_2 TEXT,
      phone TEXT,
      notes TEXT,
      item_count INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      items_json TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      item_name TEXT NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      rating INTEGER NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS concierge_cost_events (
      id TEXT PRIMARY KEY,
      user_key TEXT NOT NULL,
      event_type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      prompt_tokens INTEGER NOT NULL DEFAULT 0,
      completion_tokens INTEGER NOT NULL DEFAULT 0,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      estimated_usd REAL NOT NULL DEFAULT 0,
      metadata_json TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON account_sessions(token);
    CREATE INDEX IF NOT EXISTS idx_login_codes_email ON account_login_codes(email);
    CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_reviews_item_name ON reviews(item_name, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_schedule_slots_lookup ON schedule_slots(location_id, appointment_date);
    CREATE INDEX IF NOT EXISTS idx_concierge_cost_events_user_created ON concierge_cost_events(user_key, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_concierge_cost_events_type_created ON concierge_cost_events(event_type, created_at DESC);
  `)
}

export function getDb() {
  if (!dbInstance) {
    const databasePath = getDatabasePath()
    fs.mkdirSync(path.dirname(databasePath), { recursive: true })

    dbInstance = new Database(databasePath)
    dbInstance.pragma('journal_mode = WAL')
    dbInstance.pragma('busy_timeout = 5000')
    dbInstance.pragma('foreign_keys = ON')

    initializeSchema(dbInstance)
  }

  return dbInstance
}
