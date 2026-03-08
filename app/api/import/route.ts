import { NextRequest, NextResponse } from 'next/server';
import { putShopEntity } from '@/lib/dynamodb-shop';

export const dynamic = 'force-dynamic';

async function importEntity(entityType: string, payload: any[]) {
  await Promise.all(
    payload
      .filter((entry) => entry && entry.id)
      .map((entry) => putShopEntity(entityType, entry.id, entry))
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const source = body?.data ? body.data : body;

    const items = Array.isArray(source?.items) ? source.items : [];
    const customers = Array.isArray(source?.customers) ? source.customers : [];
    const invoices = Array.isArray(source?.invoices) ? source.invoices : [];
    const expenses = Array.isArray(source?.expenses) ? source.expenses : [];
    const suppliers = Array.isArray(source?.suppliers) ? source.suppliers : [];
    const tasks = Array.isArray(source?.tasks) ? source.tasks : [];

    await Promise.all([
      importEntity('item', items),
      importEntity('customer', customers),
      importEntity('invoice', invoices),
      importEntity('expense', expenses),
      importEntity('supplier', suppliers),
      importEntity('task', tasks),
    ]);

    return NextResponse.json({ success: true, message: 'Backup restored successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Restore failed' }, { status: 500 });
  }
}
