import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'tasks.json');

async function readTasks() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(raw || '[]');
  } catch {
    return [];
  }
}

async function writeTasks(tasks: any[]) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(tasks, null, 2), 'utf8');
}

export async function GET() {
  const tasks = await readTasks();
  return NextResponse.json({ success: true, tasks });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ success: false, error: 'title is required' }, { status: 400 });
    }

    const tasks = await readTasks();
    const task = {
      id: Date.now().toString(),
      title: String(body.title).trim(),
      dueDate: body.dueDate || '',
      priority: body.priority || 'medium',
      done: false,
      createdAt: new Date().toISOString(),
    };
    tasks.unshift(task);
    await writeTasks(tasks);
    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    const tasks = await readTasks();
    const index = tasks.findIndex((t: any) => t.id === body.id);
    if (index === -1) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    tasks[index] = { ...tasks[index], ...body };
    await writeTasks(tasks);
    return NextResponse.json({ success: true, task: tasks[index] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    const tasks = await readTasks();
    await writeTasks(tasks.filter((t: any) => t.id !== id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
