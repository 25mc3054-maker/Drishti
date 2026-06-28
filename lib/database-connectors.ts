export type DatabaseProviderKind =
  | 'mysql'
  | 'postgresql'
  | 'sql-server'
  | 'mariadb'
  | 'sqlite'
  | 'oracle'
  | 'mongodb'
  | 'firestore'
  | 'supabase'
  | 'planetscale'
  | 'neon'
  | 'cockroachdb'
  | 'amazon-rds'
  | 'google-cloud-sql'
  | 'azure-sql'
  | 'dynamodb'
  | 'cassandra'
  | 'redis'
  | 'opensearch'
  | 'airtable'
  | 'rest-api'
  | 'graphql-api';

export type ConnectionValidationResult = {
  ok: boolean;
  latencyMs?: number;
  version?: string;
  error?: string;
  warnings?: string[];
};

export type DiscoveredField = {
  name: string;
  type: string;
  nullable?: boolean;
  sample?: string | number | boolean | null;
};

export type DiscoveredTable = {
  name: string;
  kind: 'table' | 'collection' | 'view' | 'endpoint' | 'index';
  rowEstimate?: number;
  fields: DiscoveredField[];
  relationships?: Array<{ field: string; references: string }>;
};

export type FieldMapping = {
  sourceField: string;
  targetField: 'name' | 'price' | 'qty' | 'barcode' | 'sku' | 'category' | 'brand' | 'custom';
  confidence: number;
  customFieldName?: string;
};

export type SyncMode = 'one-time' | 'manual' | 'scheduled' | 'real-time' | 'automatic';

export type SyncOptions = {
  mode: SyncMode;
  intervalMinutes?: 5 | 15 | 60 | 1440 | 10080;
  importOnly: boolean;
  updateExisting: boolean;
  deleteRemovedProducts: boolean;
  syncPriceUpdates: boolean;
  syncStockUpdates: boolean;
  syncMetadataUpdates: boolean;
  syncImages: boolean;
  syncCustomFields: boolean;
};

export type ProductImportBatch = {
  products: Array<Record<string, unknown>>;
  cursor?: string;
  hasMore: boolean;
};

export interface DatabaseConnector<TCredentials extends Record<string, unknown> = Record<string, unknown>> {
  kind: DatabaseProviderKind;
  connect(credentials: TCredentials): Promise<void>;
  validate(credentials: TCredentials): Promise<ConnectionValidationResult>;
  discoverSchema(): Promise<DiscoveredTable[]>;
  fetchProducts(options: { tableName: string; cursor?: string; limit: number }): Promise<ProductImportBatch>;
  fetchMetadata(): Promise<Record<string, unknown>>;
  syncProducts(options: { mapping: FieldMapping[]; sync: SyncOptions }): Promise<void>;
  disconnect(): Promise<void>;
}

export const PRODUCT_TABLE_CANDIDATES = [
  'products',
  'inventory',
  'items',
  'stock',
  'product_master',
  'catalog',
];

export function scoreProductTableName(tableName: string) {
  const normalized = tableName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const directMatch = PRODUCT_TABLE_CANDIDATES.indexOf(normalized);

  if (directMatch >= 0) return 100 - directMatch * 8;
  if (normalized.includes('product')) return 78;
  if (normalized.includes('inventory')) return 72;
  if (normalized.includes('catalog')) return 68;
  if (normalized.includes('stock')) return 64;

  return 0;
}

export function inferProductFieldMapping(fields: DiscoveredField[]): FieldMapping[] {
  const aliases: Record<FieldMapping['targetField'], string[]> = {
    name: ['name', 'item_name', 'product_name', 'title', 'description'],
    price: ['price', 'selling_price', 'sale_price', 'mrp', 'rate'],
    qty: ['qty', 'quantity', 'stock', 'available_qty', 'inventory_count'],
    barcode: ['barcode', 'ean', 'upc', 'gtin'],
    sku: ['sku', 'item_code', 'product_code'],
    category: ['category', 'category_name', 'department'],
    brand: ['brand', 'manufacturer', 'make'],
    custom: [],
  };

  return fields.map((field) => {
    const normalized = field.name.toLowerCase();
    const match = (Object.keys(aliases) as Array<FieldMapping['targetField']>).find((target) => aliases[target].includes(normalized));

    if (match) {
      return { sourceField: field.name, targetField: match, confidence: normalized === match ? 0.96 : 0.86 };
    }

    return {
      sourceField: field.name,
      targetField: 'custom',
      customFieldName: field.name.replace(/_/g, ' '),
      confidence: 0.62,
    };
  });
}
