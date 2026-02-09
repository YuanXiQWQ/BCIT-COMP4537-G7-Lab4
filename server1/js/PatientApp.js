/**
 * PatientApp class
 * AI acknowledgement: ChatGPT assisted with:
 * 1. Rewriting the event listeners because my code didn't work somehow
 * 2. Extracting strings into ./lang/en/strings.js
 * 3. Generating this statement
 */
class PatientApp {
  constructor() {
    this.insertBtn = document.getElementById("insertBtn");
    this.insertResult = document.getElementById("insertResult");
    this.sqlInput = document.getElementById("sqlInput");
    this.queryBtn = document.getElementById("queryBtn");
    this.queryResult = document.getElementById("queryResult");

    this.insertBtn.addEventListener("click", () => this.insertPatients());
    this.queryBtn.addEventListener("click", () => this.runQuery());
  }

  /**
   * Insert patients into the database
   */
  insertPatients() {
    fetch(`${STRINGS.serverUrl}/api/v1/insert`, {
      method: "POST"
    })
        .then((response) => response.json())
        .then((data) => {
          this.insertResult.innerHTML = JSON.stringify(data);
        })
        .catch((err) => {
          this.insertResult.innerHTML = STRINGS.insertError + err.message;
        });
  }

  /**
   * Run a SQL query on the database
   */
  runQuery() {
    const sql = this.sqlInput.value.trim();
    if (!sql) {
      this.queryResult.innerHTML = STRINGS.noQuery;
      return;
    }
    fetch(`${STRINGS.serverUrl}/api/v1/sql/${encodeURIComponent(sql)}`, {
      method: "GET"
    })
        .then((response) => response.json())
        .then((data) => {
          this.queryResult.innerHTML = JSON.stringify(data);
        })
        .catch((err) => {
          this.queryResult.innerHTML = STRINGS.queryError + err.message;
        });
  }
}

new PatientApp();
