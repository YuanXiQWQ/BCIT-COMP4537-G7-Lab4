export class PatientRepository {
  constructor(databaseService) {
    this.db = databaseService;
  }

  async ensurePatientTable() {
    // Ensure table exists and is InnoDB
    const createSql = `
      CREATE TABLE IF NOT EXISTS patient (
        patientid INT(11) NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        dateOfBirth DATETIME NOT NULL,
        PRIMARY KEY (patientid)
      ) ENGINE=InnoDB;
    `;
    await this.db.adminExecute(createSql);
  }

  async insertFixedRows() {
    await this.ensurePatientTable();

    const rows = [
      ["Sara Brown", "1901-01-01 00:00:00"],
      ["John Smith", "1941-01-01 00:00:00"],
      ["Jack Ma", "1961-01-30 00:00:00"],
      ["Elon Musk", "1999-01-01 00:00:00"],
    ];

    const insertSql = `INSERT INTO patient (name, dateOfBirth) VALUES (?, ?)`;

    let inserted = 0;
    for (const r of rows) {
      await this.db.writerExecute(insertSql, r);
      inserted += 1;
    }
    return inserted;
  }

  async runSelectQuery(sql) {
    if (!this.#isSelectOnly(sql)) {
      const err = new Error("ONLY_SELECT_ALLOWED");
      err.code = "ONLY_SELECT_ALLOWED";
      throw err;
    }

    const [rows] = await this.db.readerQuery(sql);
    return rows;
  }

  #isSelectOnly(sql) {
    const trimmed = String(sql ?? "").trim();
    if (!trimmed) return false;

    const lower = trimmed.toLowerCase();

    // Must start with SELECT
    if (!lower.startsWith("select")) return false;

    // Block multi-statement attempts (extra safety)
    if (lower.includes(";")) return false;

    return true;
  }
}
