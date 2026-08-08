const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "sharma-print.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  wallet_balance REAL NOT NULL DEFAULT 0,
  verification_status TEXT NOT NULL DEFAULT 'Unverified',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  txn_ref TEXT UNIQUE NOT NULL,
  service TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS service_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  charge REAL NOT NULL DEFAULT 0
);
`);

const bcrypt = require("crypto");
function sha256(v){ return bcrypt.createHash("sha256").update(v).digest("hex"); }

const existing = db.prepare("SELECT id FROM users WHERE username=?").get("demo");
if (!existing) {
  db.prepare("INSERT INTO users(username,password_hash,name,wallet_balance,verification_status) VALUES(?,?,?,?,?)")
    .run("demo", sha256("demo123"), "Demo Customer", 1250, "Verified");
}
const defaults = [
  ["aadhaar","Aadhaar Services",1,0],["samagra","Samagra Services",1,0],
  ["details","All In Details Find",1,0],["nsdl","NSDL Payment Bank",1,0],
  ["pan","PAN Card Services",1,30],["vehicle","Vehicle Services",1,0],
  ["ration","Ration Services",1,0],["voter","Voter Services",1,30],
  ["farmer","Farmer Services",1,0],["electricity","ElectricBill Services",1,0],
  ["rtps","RTPS Services",1,0],["janaadhaar","JanAadhaar Services",1,0],
  ["familyid","FamilyID Services",1,0],["learning","Learning Exam",1,0],
  ["other","Other Services",1,0]
];
for (const s of defaults) db.prepare(
  "INSERT OR IGNORE INTO service_configs(service_key,name,enabled,charge) VALUES(?,?,?,?)"
).run(...s);

module.exports={db,sha256};
