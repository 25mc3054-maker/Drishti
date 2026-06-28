type ImportBuckets = {
  items?: any[];
  customers?: any[];
  suppliers?: any[];
  invoices?: any[];
};

const bucketAliases: Record<keyof ImportBuckets, string> = {
  items: 'item',
  customers: 'customer',
  suppliers: 'supplier',
  invoices: 'invoice',
};

export function parseCsvRows(csv: string) {
  const lines = String(csv || '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((value) => value.trim());
    return headers.reduce<Record<string, any>>((row, header, index) => {
      const raw = values[index] || '';
      const numeric = Number(raw);
      row[header] = raw !== '' && Number.isFinite(numeric) ? numeric : raw;
      return row;
    }, {});
  });
}

export function normalizeImportPayload(body: any): Required<ImportBuckets> {
  const result: Required<ImportBuckets> = {
    items: [],
    customers: [],
    suppliers: [],
    invoices: [],
  };

  for (const bucket of Object.keys(bucketAliases) as Array<keyof ImportBuckets>) {
    if (Array.isArray(body?.[bucket])) {
      result[bucket] = body[bucket];
    }

    const csv = body?.csv?.[bucket];
    if (typeof csv === 'string') {
      result[bucket] = [...result[bucket], ...parseCsvRows(csv)];
    }
  }

  return result;
}

export function importEntityType(bucket: keyof ImportBuckets) {
  return bucketAliases[bucket];
}
