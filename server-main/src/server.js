import dotenv from "dotenv"
import fs from "fs";
import path from "path";

import app from "./app.js"
import { connectDb, dbGet } from "./db/index.js";
import { migrate } from "./db/migrate.js";
import { importTicketsFromCsv } from "./services/csvImport.service.js";

dotenv.config();

const PORT = Number(process.env.PORT || 3001);
const DB_FILE = process.env.DB_FILE || "./data/app.db";

// Lê CSV por ENV ou por argumento --csv
function getCsvPathFromArgsOrEnv()
{
  const args = process.argv.slice(2);
  const csvIndex = args.indexOf("--csv");
  if (csvIndex !== -1 && args[csvIndex + 1]) return args[csvIndex + 1];
  return process.env.CSV_PATH || null;
}

async function ImportCsv(csvPath) {
  if (!csvPath) return;

  const row = await dbGet("SELECT COUNT(*) AS count FROM tickets");
  const count = row?.count ?? 0;

  if (count !== 0) {
    console.log(`DB has ${count} tickets. Skipping CSV import ✅`);
    return;
  }

  console.log(`DB empty. Importing tickets from CSV: ${csvPath}`);
  await importTicketsFromCsv(csvPath);
  console.log("CSV import done ✅");
}

// async function main() {
//   await connectDb(DB_FILE);

//   const schemaPath = path.resolve("src/db/schema.sql");
//   await migrate(schemaPath);

//   const csvPath = getCsvPathFromArgsOrEnv();
//   await ImportCsv(csvPath);

//   const server = app.listen(PORT, () => {
//     console.log(`Main server listening on port ${PORT}`);
//   });

//   const shutdown = () => {
//     console.log("Shutting down...");
//     server.close(() => process.exit(0));
//   };

//   process.on("SIGINT", shutdown);
//   process.on("SIGTERM", shutdown);
// }

async function main() {
  const resolvedDbFile = path.resolve(DB_FILE);

  // garante que a pasta existe (evita SQLITE_CANTOPEN quando DB ainda não existe)
  fs.mkdirSync(path.dirname(resolvedDbFile), { recursive: true });

  const dbAlreadyExists = fs.existsSync(resolvedDbFile);

  // Se DB não existe, CSV é obrigatório
  const csvPath = getCsvPathFromArgsOrEnv();
  if (!dbAlreadyExists && !csvPath) {
    throw Object.assign(
      new Error(
        `DB file not found (${resolvedDbFile}). You must provide a CSV path to create the DB.\n` +
        `Use: CSV_PATH="/path/to/data.csv" npm run dev\n` +
        `or:  npm run dev -- --csv "/path/to/data.csv"`
      ),
      { statusCode: 400 }
    );
  }

  // Agora liga/cria DB
  await connectDb(DB_FILE);

  const schemaPath = path.resolve("src/db/schema.sql");
  await migrate(schemaPath);

  // Importar CSV:
  // - Se DB não existia -> criar conteúdo inicial via CSV
  // - Se DB existia -> podes decidir: importar só se vazia (o teu ImportCsv já faz isso)
  await ImportCsv(csvPath);

  const server = app.listen(PORT, () => {
    console.log(`Main server listening on port ${PORT}`);
  });

  const shutdown = () => {
    console.log("Shutting down...");
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});