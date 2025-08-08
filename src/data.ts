import { tableFromIPC } from "apache-arrow";
import type { NssRow } from "./types";

const FEATHER_URL =
  "https://raw.githubusercontent.com/internQuant/FinScraps/auto-scraping/data/scraped/anbima/irts_params.feather";

export async function loadAnbimaNss(): Promise<NssRow[]> {
  const res = await fetch(FEATHER_URL, { mode: "cors" });
  if (!res.ok) throw new Error(`Failed to fetch feather: ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  const table = tableFromIPC(buf);

  const colNames = table.schema.fields.map((f) => f.name);

  // Expect something like: type, date, b1,b2,b3,b4,l1,l2
  const required = ["type", "date", "b1", "b2", "b3", "b4", "l1", "l2"];
  for (const k of required) {
    if (!colNames.includes(k)) {
      console.warn("Found columns:", colNames);
      throw new Error(`Missing expected column '${k}' in feather file`);
    }
  }

  const rows: NssRow[] = [];
  const cType = table.getChild("type")!;
  const cDate = table.getChild("date")!;
  const cB1 = table.getChild("b1")!;
  const cB2 = table.getChild("b2")!;
  const cB3 = table.getChild("b3")!;
  const cB4 = table.getChild("b4")!;
  const cL1 = table.getChild("l1")!;
  const cL2 = table.getChild("l2")!;

  for (let i = 0; i < table.numRows; i++) {
    const type = String(cType.get(i));
    const dateVal = cDate.get(i);
    // date might be a string or a Timestamp—normalize to YYYY-MM-DD
    const date =
      typeof dateVal === "string"
        ? dateVal.slice(0, 10)
        : new Date(Number(dateVal)).toISOString().slice(0, 10);

    rows.push({
      type,
      date,
      b1: Number(cB1.get(i)),
      b2: Number(cB2.get(i)),
      b3: Number(cB3.get(i)),
      b4: Number(cB4.get(i)),
      l1: Number(cL1.get(i)),
      l2: Number(cL2.get(i)),
    });
  }

  return rows;
}
