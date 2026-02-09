import mysql from "mysql2/promise";

export class DatabaseService {
  constructor(config) {
    this.config = config;

    this.adminPool = this.#createPool({
      user: config.mysqlAdminUser,
      password: config.mysqlAdminPass,
    });

    this.writerPool = this.#createPool({
      user: config.writerUser,
      password: config.writerPass,
    });

    this.readerPool = this.#createPool({
      user: config.readerUser,
      password: config.readerPass,
    });
  }

  #createPool({ user, password }) {
    return mysql.createPool({
      host: this.config.mysqlHost,
      port: this.config.mysqlPort,
      user,
      password,
      database: this.config.mysqlDatabase,
      waitForConnections: true,
      connectionLimit: 5,
    });
  }

  async adminExecute(sql, params = []) {
    return this.adminPool.execute(sql, params);
  }

  async writerExecute(sql, params = []) {
    return this.writerPool.execute(sql, params);
  }

  async readerQuery(sql, params = []) {
    return this.readerPool.query(sql, params);
  }
}
