type CsvParseResult = {
  headers: string[];
  rows: string[][];
};

export function parseCsv(text: string): CsvParseResult {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  const pushValue = () => {
    currentRow.push(currentValue);
    currentValue = "";
  };

  const pushRow = () => {
    rows.push(currentRow);
    currentRow = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (char === "," || char === "\n" || char === "\r")) {
      if (char === ",") {
        pushValue();
        continue;
      }

      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }

      pushValue();
      pushRow();
      continue;
    }

    currentValue += char;
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    pushValue();
    pushRow();
  }

  const [headerRow, ...dataRows] = rows;
  const headers = (headerRow ?? []).map((header) => header.trim());

  return {
    headers,
    rows: dataRows.filter((row) => row.some((value) => value.trim() !== "")),
  };
}
