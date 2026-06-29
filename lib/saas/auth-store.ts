import { pbkdf2Sync, randomBytes, randomUUID } from 'crypto';
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { TenantRole } from './types';

const region = process.env.AWS_REGION || 'eu-north-1';
const tableName = process.env.AWS_DYNAMODB_TABLE_SHOPS || 'drishti-shops';

const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

type AuthUser = {
  id: string;
  tenant_id: string;
  shopId: string;
  entityType: 'tenant_user';
  name: string;
  shopName: string;
  mobile: string;
  email: string;
  passwordHash: string;
  role: TenantRole;
  createdAt: string;
  updatedAt: string;
  securityQuestion?: string;
  securityAnswerHash?: string;
};

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

function normalizeMobile(mobile: string) {
  return String(mobile || '').replace(/\D/g, '').slice(-10);
}

function tenantKeyValues(partitionKey: string, sortKey: string | undefined, tenantId: string, entityType: string, id: string) {
  if (!sortKey) return { [partitionKey]: `TENANT#${tenantId}#${entityType}#${id}` };
  return { [partitionKey]: `TENANT#${tenantId}`, [sortKey]: `${entityType}#${id}` };
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

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const nextHash = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
  return nextHash === hash;
}

export async function findTenantUserByMobile(mobile: string): Promise<AuthUser | null> {
  const normalized = normalizeMobile(mobile);
  if (!normalized) return null;

  const rows = await scanAll({
    TableName: tableName,
    FilterExpression: 'attribute_exists(#mobile) AND #entityType = :entityType AND #mobile = :mobile',
    ExpressionAttributeNames: {
      '#entityType': 'entityType',
      '#mobile': 'mobile',
    },
    ExpressionAttributeValues: {
      ':entityType': 'tenant_user',
      ':mobile': normalized,
    },
  });

  return (rows[0] as AuthUser | undefined) || null;
}

export async function findTenantUserById(tenantId: string, userId: string): Promise<AuthUser | null> {
  if (!tenantId || !userId) return null;

  const rows = await scanAll({
    TableName: tableName,
    FilterExpression: '#entityType = :entityType AND #tenantId = :tenantId AND #id = :id',
    ExpressionAttributeNames: {
      '#entityType': 'entityType',
      '#tenantId': 'tenant_id',
      '#id': 'id',
    },
    ExpressionAttributeValues: {
      ':entityType': 'tenant_user',
      ':tenantId': tenantId,
      ':id': userId,
    },
  });

  return (rows[0] as AuthUser | undefined) || null;
}

export async function createTenantUser(input: { name: string; shopName: string; mobile: string; email: string; password: string; securityQuestion: string; securityAnswer: string; }) {
  const mobile = normalizeMobile(input.mobile);
  const email = String(input.email || '').trim().toLowerCase();
  if (!mobile || mobile.length !== 10) throw new Error('Enter a valid 10 digit mobile number.');
  if (!email || !email.includes('@')) throw new Error('Enter a valid email address.');
  if (!input.password || input.password.length < 6) throw new Error('Password must be at least 6 characters.');
  if (!input.securityQuestion || input.securityQuestion.length < 5) throw new Error('Security question must be at least 5 characters.');
  if (!input.securityAnswer || input.securityAnswer.length < 3) throw new Error('Security answer must be at least 3 characters.');

  const existing = await findTenantUserByMobile(mobile);
  if (existing) throw new Error('A shopkeeper account already exists for this mobile number.');

  const tenantId = randomUUID();
  const id = randomUUID();
  const now = new Date().toISOString();
  const { partitionKey, sortKey } = await getTableKeySchema();
  const user: AuthUser = {
    ...tenantKeyValues(partitionKey, sortKey, tenantId, 'tenant_user', id),
    id,
    tenant_id: tenantId,
    shopId: tenantId,
    entityType: 'tenant_user',
    name: String(input.name || 'Shopkeeper').trim(),
    shopName: String(input.shopName || 'My Shop').trim(),
    mobile,
    email,
    passwordHash: hashPassword(input.password),
    securityQuestion: input.securityQuestion,
    securityAnswerHash: hashPassword(input.securityAnswer),
    role: 'admin',
    createdAt: now,
    updatedAt: now,
  } as AuthUser;

  await docClient.send(new PutCommand({ TableName: tableName, Item: user }));
  return user;
}

export async function updateTenantUserProfile(input: {
  tenantId: string;
  userId: string;
  name?: string;
  shopName?: string;
  mobile?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  const user = await findTenantUserById(input.tenantId, input.userId);
  if (!user) throw new Error('Profile owner was not found.');

  const nextName = String(input.name ?? user.name).trim() || user.name;
  const nextShopName = String(input.shopName ?? user.shopName).trim() || user.shopName;
  const nextEmail = String(input.email ?? user.email).trim().toLowerCase();
  const nextMobile = input.mobile === undefined ? user.mobile : normalizeMobile(input.mobile);

  if (!nextMobile || nextMobile.length !== 10) throw new Error('Enter a valid 10 digit mobile number.');
  if (!nextEmail || !nextEmail.includes('@')) throw new Error('Enter a valid email address.');

  if (nextMobile !== user.mobile) {
    const existing = await findTenantUserByMobile(nextMobile);
    if (existing && existing.id !== user.id) {
      throw new Error('A shopkeeper account already exists for this mobile number.');
    }
  }

  let passwordHash = user.passwordHash;
  if (input.newPassword) {
    if (!input.currentPassword || !verifyPassword(input.currentPassword, user.passwordHash)) {
      throw new Error('Current password is incorrect.');
    }
    if (input.newPassword.length < 6) throw new Error('New password must be at least 6 characters.');
    passwordHash = hashPassword(input.newPassword);
  }

  const { partitionKey, sortKey } = await getTableKeySchema();
  const updated: AuthUser = {
    ...user,
    ...tenantKeyValues(partitionKey, sortKey, user.tenant_id, 'tenant_user', user.id),
    name: nextName,
    shopName: nextShopName,
    mobile: nextMobile,
    email: nextEmail,
    passwordHash,
    updatedAt: new Date().toISOString(),
  } as AuthUser;

  await docClient.send(new PutCommand({ TableName: tableName, Item: updated }));
  return updated;
}


export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return null;

  const rows = await scanAll({
    TableName: tableName,
    FilterExpression: 'attribute_exists(#email) AND #entityType = :entityType AND #email = :email',
    ExpressionAttributeNames: {
      '#entityType': 'entityType',
      '#email': 'email',
    },
    ExpressionAttributeValues: {
      ':entityType': 'tenant_user',
      ':email': normalized,
    },
  });

  return (rows[0] as AuthUser | undefined) || null;
}

export async function updateUserPassword(email: string, newPassword: string): Promise<AuthUser> {
  const user = await findUserByEmail(email);
  if (!user) throw new Error('User not found.');

  if (newPassword.length < 6) throw new Error('New password must be at least 6 characters.');
  const passwordHash = hashPassword(newPassword);

  const { partitionKey, sortKey } = await getTableKeySchema();
  const updated: AuthUser = {
    ...user,
    ...tenantKeyValues(partitionKey, sortKey, user.tenant_id, 'tenant_user', user.id),
    passwordHash,
    updatedAt: new Date().toISOString(),
  } as AuthUser;

  await docClient.send(new PutCommand({ TableName: tableName, Item: updated }));
  return updated;
}


export function publicUser(user: AuthUser) {
  return {
    id: user.id,
    tenantId: user.tenant_id,
    name: user.name,
    shopName: user.shopName,
    mobile: user.mobile,
    email: user.email,
    role: user.role,
  };
}
