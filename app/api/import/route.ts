import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data');

async function writeJsonFile(fileName: string, payload: any[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, fileName), JSON.stringify(payload, null, 2), 'utf8');
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
      writeJsonFile('items.json', items),
      writeJsonFile('customers.json', customers),
      writeJsonFile('invoices.json', invoices),
      writeJsonFile('expenses.json', expenses),
      writeJsonFile('suppliers.json', suppliers),
      writeJsonFile('tasks.json', tasks),
    ]);

    return NextResponse.json({ success: true, message: 'Backup restored successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Restore failed' }, { status: 500 });
  }
}
