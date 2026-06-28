import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import type { TenantContext, TenantEntityType } from './types';

const region = process.env.AWS_REGION || 'eu-north-1';
const tableName = process.env.AWS_DYNAMODB_TABLE_SHOPS || 'drishti-shops';

const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

let keySchemaCache: Promise<{ partitionKey: string; sortKey?: string }> | null = null;

async function getTableKeySchema() {
  if (!keySchemaCache) {
    keySchemaCache = (async () => {
      const result = await client.send(new DescribeTableCommand({ TableName: tableName }));
      const schema = result.Table?.KeySchema || [];
      const partitionKey = schema.find((entry) => entry.KeyType === 'HASH')?.AttributeName;
      const sortKey = schema.find((entry) => entry.KeyType === 'RANGE')?.AttributeName;
      if (!partitionKey) throw new Error(`Could not determine partition key for table ${tableName}`);
      return { partitionKey, sortKey };
    })();
  }
  return keySchemaCache;
}

function tenantKeyValues(partitionKey: string, sortKey: string | undefined, tenantId: string, entityType: string, id: string) {
  if (!sortKey) {
    return { [partitionKey]: `TENANT#${tenantId}#${entityType}#${id}` };
  }

  return {
    [partitionKey]: `TENANT#${tenantId}`,
    [sortKey]: `${entityType}#${id}`,
  };
}

async function scanAll(params: Omit<ConstructorParameters<typeof ScanCommand>[0], 'ExclusiveStartKey'>) {
  const rows: any[] = [];
  let lastEvaluatedKey: Record<string, any> | undefined;

  do {
    const result = await docClient.send(new ScanCommand({ ...params, ExclusiveStartKey: lastEvaluatedKey }));
    rows.push(...(result.Items || []));
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return rows;
}

export function newTenantEntityId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listTenantEntities<T = any>(ctx: TenantContext, entityType: TenantEntityType): Promise<T[]> {
  const rows = await scanAll({
    TableName: tableName,
    FilterExpression: '#tenantId = :tenantId AND #entityType = :entityType',
    ExpressionAttributeNames: {
      '#tenantId': 'tenant_id',
      '#entityType': 'entityType',
    },
    ExpressionAttributeValues: {
      ':tenantId': ctx.tenantId,
      ':entityType': entityType,
    },
  });

  return rows.sort((a, b) => {
    const aTs = Date.parse(a.updatedAt || a.createdAt || '1970-01-01');
    const bTs = Date.parse(b.updatedAt || b.createdAt || '1970-01-01');
    return bTs - aTs;
  }) as T[];
}

export async function getTenantEntity<T = any>(ctx: TenantContext, entityType: TenantEntityType, id: string): Promise<T | null> {
  const rows = await scanAll({
    TableName: tableName,
    FilterExpression: '#tenantId = :tenantId AND #entityType = :entityType AND #id = :id',
    ExpressionAttributeNames: {
      '#tenantId': 'tenant_id',
      '#entityType': 'entityType',
      '#id': 'id',
    },
    ExpressionAttributeValues: {
      ':tenantId': ctx.tenantId,
      ':entityType': entityType,
      ':id': id,
    },
  });

  return (rows[0] as T | undefined) || null;
}

export async function putTenantEntity<T = any>(
  ctx: TenantContext,
  entityType: TenantEntityType,
  id: string,
  payload: Record<string, any>
): Promise<T> {
  if (payload.tenant_id && payload.tenant_id !== ctx.tenantId) {
    throw new Error('Cross-tenant write blocked.');
  }

  const now = new Date().toISOString();
  const existing = await getTenantEntity<any>(ctx, entityType, id);
  const { partitionKey, sortKey } = await getTableKeySchema();
  const keyValues = tenantKeyValues(partitionKey, sortKey, ctx.tenantId, entityType, id);
  const item = {
    ...keyValues,
    ...(existing || {}),
    ...payload,
    id,
    entityType,
    tenant_id: ctx.tenantId,
    shopId: ctx.tenantId,
    createdAt: existing?.createdAt || payload.createdAt || now,
    updatedAt: now,
  };

  await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
  return item as T;
}

export async function deleteTenantEntity(ctx: TenantContext, entityType: TenantEntityType, id: string) {
  const existing = await getTenantEntity<any>(ctx, entityType, id);
  if (!existing) return false;

  const { partitionKey, sortKey } = await getTableKeySchema();
  const key: Record<string, any> = { [partitionKey]: existing[partitionKey] };
  if (sortKey) key[sortKey] = existing[sortKey];
  await docClient.send(new DeleteCommand({ TableName: tableName, Key: key }));
  return true;
}
