import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || 'eu-north-1';
const tableName = process.env.AWS_DYNAMODB_TABLE_SHOPS || 'drishti-shops';
const shopId = process.env.DRISHTI_SHOP_ID || 'default';

const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

let keySchemaCache: Promise<{ partitionKey: string; sortKey?: string }> | null = null;

async function getTableKeySchema() {
  if (!keySchemaCache) {
    keySchemaCache = (async () => {
      const result = await client.send(
        new DescribeTableCommand({
          TableName: tableName,
        })
      );

      const schema = result.Table?.KeySchema || [];
      const partitionKey = schema.find((entry) => entry.KeyType === 'HASH')?.AttributeName;
      const sortKey = schema.find((entry) => entry.KeyType === 'RANGE')?.AttributeName;

      if (!partitionKey) {
        throw new Error(`Could not determine partition key for table ${tableName}`);
      }

      return {
        partitionKey,
        sortKey,
      };
    })();
  }

  return keySchemaCache;
}

function buildPrimaryKeyValues(partitionKey: string, sortKey: string | undefined, entityType: string, id: string) {
  if (!sortKey) {
    return {
      [partitionKey]: `${entityType}#${id}`,
    };
  }

  return {
    [partitionKey]: `SHOP#${shopId}`,
    [sortKey]: `${entityType}#${id}`,
  };
}

async function scanAll(params: Omit<ConstructorParameters<typeof ScanCommand>[0], 'ExclusiveStartKey'>) {
  const rows: any[] = [];
  let lastEvaluatedKey: Record<string, any> | undefined;

  do {
    const result = await docClient.send(
      new ScanCommand({
        ...params,
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );
    rows.push(...(result.Items || []));
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return rows;
}

export async function listShopEntities<T = any>(entityType: string): Promise<T[]> {
  const items = await scanAll({
    TableName: tableName,
    FilterExpression: '#entityType = :entityType AND #shopId = :shopId',
    ExpressionAttributeNames: {
      '#entityType': 'entityType',
      '#shopId': 'shopId',
    },
    ExpressionAttributeValues: {
      ':entityType': entityType,
      ':shopId': shopId,
    },
  });

  return items.sort((a, b) => {
    const aTs = Date.parse(a.updatedAt || a.createdAt || '1970-01-01');
    const bTs = Date.parse(b.updatedAt || b.createdAt || '1970-01-01');
    return bTs - aTs;
  }) as T[];
}

export async function getShopEntityById<T = any>(id: string): Promise<T | null> {
  const items = await scanAll({
    TableName: tableName,
    FilterExpression: '#id = :id AND #shopId = :shopId',
    ExpressionAttributeNames: {
      '#id': 'id',
      '#shopId': 'shopId',
    },
    ExpressionAttributeValues: {
      ':id': id,
      ':shopId': shopId,
    },
  });

  return (items[0] as T | undefined) || null;
}

export async function putShopEntity(entityType: string, id: string, payload: Record<string, any>) {
  const now = new Date().toISOString();
  const existing = await getShopEntityById(id);
  const { partitionKey, sortKey } = await getTableKeySchema();
  const keyValues = buildPrimaryKeyValues(partitionKey, sortKey, entityType, id);

  const item = {
    ...keyValues,
    ...(existing || {}),
    ...payload,
    id,
    entityType,
    shopId,
    createdAt: (existing as any)?.createdAt || payload.createdAt || now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    })
  );

  return item;
}

export async function deleteShopEntity(id: string) {
  const existing = await getShopEntityById<any>(id);
  if (!existing) return;

  const { partitionKey, sortKey } = await getTableKeySchema();
  const key: Record<string, any> = {
    [partitionKey]: existing[partitionKey],
  };
  if (sortKey) {
    key[sortKey] = existing[sortKey];
  }

  await docClient.send(
    new DeleteCommand({
      TableName: tableName,
      Key: key,
    })
  );
}

export async function getSingletonEntity<T = any>(entityType: string): Promise<T | null> {
  const id = `singleton#${shopId}#${entityType}`;
  return getShopEntityById<T>(id);
}

export async function putSingletonEntity(entityType: string, payload: Record<string, any>) {
  const id = `singleton#${shopId}#${entityType}`;
  return putShopEntity(entityType, id, payload);
}

export function newEntityId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
