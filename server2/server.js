/*
ChatGPT (https://chat.openai.com/) was used as a learning and debugging assistant.
*/
import "dotenv/config";
import { Config } from "./Config.js";
import { DatabaseService } from "./DatabaseService.js";
import { PatientRepository } from "./PatientRepository.js";
import { ApiServer } from "./ApiServer.js";

const config = new Config();
const dbService = new DatabaseService(config);
const patientRepo = new PatientRepository(dbService);

const api = new ApiServer({ config, patientRepository: patientRepo });
api.listen();
