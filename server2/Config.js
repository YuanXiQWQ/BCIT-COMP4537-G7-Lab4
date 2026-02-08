export class Config {
  constructor(env = process.env) {
    this.env = env;

    // Required (Railway)
    this.mysqlHost = this.#required("MYSQLHOST");
    this.mysqlPort = Number(this.#required("MYSQLPORT"));
    this.mysqlDatabase = this.#required("MYSQLDATABASE");

    // Admin connection used only for CREATE TABLE IF NOT EXISTS
    this.mysqlAdminUser = this.#required("MYSQLUSER");
    this.mysqlAdminPass = this.#required("MYSQLPASSWORD");

    // Least privilege users
    this.writerUser = this.#required("DB_WRITER_USER");
    this.writerPass = this.#required("DB_WRITER_PASS");

    this.readerUser = this.#required("DB_READER_USER");
    this.readerPass = this.#required("DB_READER_PASS");

    // Server / CORS
    this.port = Number(env.PORT || 3000);
    this.corsOrigin = env.CORS_ORIGIN || ""; // may be empty, server still starts
  }

  #required(key) {
    const v = this.env[key];
    if (!v) {
      throw new Error(`Missing required env var: ${key}`);
    }
    return v;
  }
}
