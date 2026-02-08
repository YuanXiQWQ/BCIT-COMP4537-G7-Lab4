import http from "http";
import { Messages } from "./messages.js";

export class ApiServer {
  constructor({ config, patientRepository }) {
    this.config = config;
    this.patientRepo = patientRepository;

    this.server = http.createServer((req, res) => {
      this.#handle(req, res).catch((err) => {
        this.#sendJson(res, 500, {
          ok: false,
          error: Messages.serverError(),
          details: String(err?.message || err),
        });
      });
    });
  }

  listen() {
    if (!this.config.corsOrigin) {
      console.warn(Messages.corsOriginMissing());
    }

    this.server.listen(this.config.port, () => {
      console.log(Messages.serverRunning(this.config.port));
    });
  }

  async #handle(req, res) {
    this.#setCors(res);

    // Preflight
    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    // POST /api/v1/insert
    if (req.method === "POST" && path === "/api/v1/insert") {
      await this.#readBody(req).catch(() => "");
      const inserted = await this.patientRepo.insertFixedRows();
      this.#sendJson(res, 200, {
        ok: true,
        message: Messages.inserted(inserted),
        inserted,
      });
      return;
    }

    // GET /api/v1/sql/<encodedSQL>
    const sqlPrefix = "/api/v1/sql/";
    if (req.method === "GET" && path.startsWith(sqlPrefix)) {
      const encoded = path.slice(sqlPrefix.length);
      if (!encoded) {
        this.#sendJson(res, 400, { ok: false, error: Messages.badRequest() });
        return;
      }

      const sql = decodeURIComponent(encoded);

      try {
        const rows = await this.patientRepo.runSelectQuery(sql);
        this.#sendJson(res, 200, { ok: true, sql, rows });
      } catch (err) {
        if (err?.code === "ONLY_SELECT_ALLOWED" || err?.message === "ONLY_SELECT_ALLOWED") {
          this.#sendJson(res, 403, { ok: false, error: Messages.onlySelectAllowed() });
          return;
        }
        this.#sendJson(res, 400, {
          ok: false,
          error: Messages.dbError(),
          details: String(err?.message || err),
        });
      }
      return;
    }

    // Default 404
    this.#sendJson(res, 404, { ok: false, error: Messages.notFound() });
  }

  #setCors(res) {
    if (this.config.corsOrigin) {
      res.setHeader("Access-Control-Allow-Origin", this.config.corsOrigin);
      res.setHeader("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  #sendJson(res, status, obj) {
    this.#setCors(res);
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(obj));
  }

  #readBody(req) {
    return new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => {
        data += chunk;
        if (data.length > 1_000_000) {
          reject(new Error("BODY_TOO_LARGE"));
          req.destroy();
        }
      });
      req.on("end", () => resolve(data));
      req.on("error", reject);
    });
  }
}
