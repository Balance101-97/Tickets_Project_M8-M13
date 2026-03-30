import fs from "fs/promises";
import { dbExec } from "./index.js";

export async function migrate(schemaPath) {
  const sql = await fs.readFile(schemaPath, "utf-8");
  await dbExec(sql);
}

