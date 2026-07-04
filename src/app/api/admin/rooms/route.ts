import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/adminAuth';

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { title, presenter_name, description } = await request.json();
  if (!title?.trim() || !presenter_name?.trim()) {
    return NextResponse.json({ error: 'title and presenter_name are required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: presentation, error: pError } = await admin
    .from('presentations')
    .insert({ title, presenter_name, description })
    .select()
    .single();
  if (pError || !presentation) return NextResponse.json({ error: pError?.message ?? 'failed to create presentation' }, { status: 500 });

  const { error: rError } = await admin.from('rooms').insert({ presentation_id: presentation.id });
  if (rError) return NextResponse.json({ error: rError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
