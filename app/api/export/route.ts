import { NextRequest, NextResponse } from 'next/server';
import { listShopEntities } from '@/lib/dynamodb-shop';

export const dynamic = 'force-dynamic';

function toCsv(rows: any[]) {
  if (!rows.length) return '';
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const escape = (value: any) => {
    const text = String(value ?? '');
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };
  const headerLine = headers.join(',');
  const lines = rows.map((row) => headers.map((header) => escape(row[header])).join(','));
  return [headerLine, ...lines].join('\n');
}

export async function GET(req: NextRequest) {
  try {
    const format = new URL(req.url).searchParams.get('format') || 'json';

    const [items, customers, invoices, expenses, suppliers, tasks] = await Promise.all([
      listShopEntities('item'),
      listShopEntities('customer'),
      listShopEntities('invoice'),
      listShopEntities('expense'),
      listShopEntities('supplier'),
      listShopEntities('task'),
    ]);

    if (format === 'csv') {
      const csvSections = [
        '### ITEMS',
        toCsv(items),
        '',
        '### CUSTOMERS',
        toCsv(customers),
        '',
        '### INVOICES',
        toCsv(invoices),
        '',
        '### EXPENSES',
        toCsv(expenses),
        '',
        '### SUPPLIERS',
        toCsv(suppliers),
        '',
        '### TASKS',
        toCsv(tasks),
      ].join('\n');

      return new NextResponse(csvSections, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="shopkeeper-backup-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      exportedAt: new Date().toISOString(),
      data: {
        items,
        customers,
        invoices,
        expenses,
        suppliers,
        tasks,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Export failed' }, { status: 500 });
  }
}
