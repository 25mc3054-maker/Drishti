import { randomUUID } from 'crypto';
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || 'eu-north-1';
const tableName = process.env.AWS_DYNAMODB_TABLE_SHOPS || 'drishti-shops';
const legacyShopId = process.env.DRISHTI_SHOP_ID || 'default';
const tenantId = process.env.DEFAULT_TENANT_ID || randomUUID();
const entityTypes = (process.env.SAAS_BACKFILL_ENTITY_TYPES || 'item,customer,supplier,invoice,task,expense')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

async function getKeySchema() {
  const result = await client.send(new DescribeTableCommand({ TableName: tableName }));
  const schema = result.Table?.KeySchema || [];
  const partitionKey = schema.find((entry) => entry.KeyType === 'HASH')?.AttributeName;
  const sortKey = schema.find((entry) => entry.KeyType === 'RANGE')?.AttributeName;
  if (!partitionKey) throw new Error(`Could not determine partition key for table ${tableName}`);
  return { partitionKey, sortKey };
}

async function scanAll(params) {
  const rows = [];
  let lastEvaluatedKey;
  do {
    const result = await docClient.send(new ScanCommand({ ...params, ExclusiveStartKey: lastEvaluatedKey }));
    rows.push(...(result.Items || []));
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);
  return rows;
}

function tenantKeys({ partitionKey, sortKey }, entityType, id) {
  if (!sortKey) {
    return { [partitionKey]: `TENANT#${tenantId}#${entityType}#${id}` };
  }

  return {
    [partitionKey]: `TENANT#${tenantId}`,
    [sortKey]: `${entityType}#${id}`,
  };
}

async function main() {
  const schema = await getKeySchema();
  let count = 0;

  for (const entityType of entityTypes) {
    const rows = await scanAll({
      TableName: tableName,
      FilterExpression: '#entityType = :entityType AND #shopId = :shopId',
      ExpressionAttributeNames: {
        '#entityType': 'entityType',
        '#shopId': 'shopId',
      },
      ExpressionAttributeValues: {
        ':entityType': entityType,
        ':shopId': legacyShopId,
      },
    });

    for (const row of rows) {
      const id = row.id;
      if (!id) continue;
      const item = {
        ...row,
        ...tenantKeys(schema, entityType, id),
        id,
        entityType,
        tenant_id: tenantId,
        shopId: tenantId,
        migratedFromShopId: row.shopId || legacyShopId,
        updatedAt: new Date().toISOString(),
      };
      await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
      count += 1;
    }
  }

  console.log(JSON.stringify({ success: true, tenantId, migrated: count }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
