import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/adminAuth';

export async function PATCH(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { roomId } = await params;
  const { is_open, is_published } = await request.json();
  const update: { is_open?: boolean; is_published?: boolean } = {};
  if (typeof is_open === 'boolean') update.is_open = is_open;
  if (typeof is_published === 'boolean') update.is_published = is_published;

  const admin = createAdminClient();
  const { error } = await admin.from('rooms').update(update).eq('id', roomId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { roomId } = await params;
  const { presentationId } = await request.json();

  const admin = createAdminClient();
  await admin.from('responses').delete().eq('room_id', roomId);
  await admin.from('rooms').delete().eq('id', roomId);
  if (presentationId) await admin.from('presentations').delete().eq('id', presentationId);

  return NextResponse.json({ ok: true });
}
