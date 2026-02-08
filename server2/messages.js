export class Messages {
  static serverRunning(port) {
    return `Server2 running on port ${port}`;
  }

  static corsOriginMissing() {
    return "CORS_ORIGIN is not set. Set it to your Server1 origin (e.g., https://xxxx.netlify.app).";
  }

  static notFound() {
    return "Not found";
  }

  static badRequest() {
    return "Bad request";
  }

  static onlySelectAllowed() {
    return "Only SELECT statements are allowed on this endpoint.";
  }

  static inserted(rows) {
    return `Inserted ${rows} row(s) into patient.`;
  }

  static dbError() {
    return "Database error";
  }

  static serverError() {
    return "Server error";
  }
}
