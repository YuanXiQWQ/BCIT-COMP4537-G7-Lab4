import mysql from "mysql2/promise";

const getRequiredEnv = (key) => {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return val;
};

const dbHost = getRequiredEnv("MYSQLHOST");
const dbPort = Number(getRequiredEnv("MYSQLPORT"));
const dbName = getRequiredEnv("MYSQLDATABASE");

// Admin (root) - only for table creation checks
const adminPool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: getRequiredEnv("MYSQLUSER"),       // patient_admin (Railway)
  password: getRequiredEnv("MYSQLPASSWORD"),
  database: dbName,
  waitForConnections: true,
  connectionLimit: 5,
});

// Writer (INSERT only)
const writerPool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: getRequiredEnv("DB_WRITER_USER"),
  password: getRequiredEnv("DB_WRITER_PASS"),
  database: dbName,
  waitForConnections: true,
  connectionLimit: 5,
});

// Reader (SELECT only)
const readerPool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: getRequiredEnv("DB_READER_USER"),
  password: getRequiredEnv("DB_READER_PASS"),
  database: dbName,
  waitForConnections: true,
  connectionLimit: 5,
});

export const ensurePatientTable = async () => {
  // Create table if it doesn't exist, Engine=InnoDB
  const createSql = `
    CREATE TABLE IF NOT EXISTS patient (
      patientid INT(11) NOT NULL AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      dateOfBirth DATETIME NOT NULL,
      PRIMARY KEY (patientid)
    ) ENGINE=InnoDB;
  `;
  await adminPool.execute(createSql);
};

export const insertFixedRows = async () => {
  await ensurePatientTable();

  // Insert these rows every press (table grows)
  const rows = [
    ["Sara Brown", "1901-01-01 00:00:00"],
    ["John Smith", "1941-01-01 00:00:00"],
    ["Jack Ma", "1961-01-30 00:00:00"],
    ["Elon Musk", "1999-01-01 00:00:00"],
  ];

  const insertSql = `
    INSERT INTO patient (name, dateOfBirth)
    VALUES (?, ?)
  `;

  // Insert row-by-row 
  let inserted = 0;
  for (const r of rows) {
    await writerPool.execute(insertSql, r);
    inserted += 1;
  }

  return inserted;
};

const isSelectOnly = (sql) => {
  const trimmed = String(sql ?? "").trim();
  if (!trimmed) return false;

  // Must start with SELECT (case-insensitive)
  const lower = trimmed.toLowerCase();

  // Allow "select", "select\n", "select\t" etc.
  if (!lower.startsWith("select")) return false;

  // Extra safety: block common multi-statement attempts
  // (Security is still enforced by DB reader privileges)
  if (lower.includes(";")) return false;

  return true;
};

export const runSelectQuery = async (sql) => {
  if (!isSelectOnly(sql)) {
    const err = new Error("ONLY_SELECT_ALLOWED");
    err.code = "ONLY_SELECT_ALLOWED";
    throw err;
  }

  // Reader has SELECT only
  const [rows] = await readerPool.query(sql);
  return rows;
};
