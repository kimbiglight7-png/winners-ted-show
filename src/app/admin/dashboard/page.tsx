'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Room } from '@/types';

export default function AdminDashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newPresentation, setNewPresentation] = useState({ title: '', presenter_name: '', description: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('admin_auth');
      if (auth !== 'true') window.location.href = '/admin';
    }
    fetchRooms();
  }, []);

  async function fetchRooms() {
    const { data } = await supabase.from('rooms').select('*, presentations(*)').order('created_at', { ascending: false });
    setRooms(data ?? []);
    setLoading(false);
  }

  async function createRoom() {
    if (!newPresentation.title.trim() || !newPresentation.presenter_name.trim()) return;
    setCreating(true);
    const { data: pData, error: pError } = await supabase.from('presentations').insert(newPresentation).select().single();
    if (pError || !pData) { setCreating(false); return; }
    const { error: rError } = await supabase.from('rooms').insert({ presentation_id: pData.id });
    if (!rError) { setNewPresentation({ title: '', presenter_name: '', description: '' }); setShowNewForm(false); fetchRooms(); }
    setCreating(false);
  }

  async function toggleRoom(roomId: string, currentState: boolean) {
    await supabase.from('rooms').update({ is_open: !currentState }).eq('id', roomId);
    fetchRooms();
  }

  async function publishResults(roomId: string) {
    await supabase.from('rooms').update({ is_published: true, is_open: false }).eq('id', roomId);
    fetchRooms();
  }

  async function deleteRoom(roomId: string, presentationId: string) {
    if (!confirm('정말 삭제하시겠습니까?\n설문 응답 데이터도 모두 삭제됩니다.')) return;
    await supabase.from('responses').delete().eq('room_id', roomId);
    await supabase.from('rooms').delete().eq('id', roomId);
    await supabase.from('presentations').delete().eq('id', presentationId);
    fetchRooms();
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_auth');
    window.location.href = '/admin';
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{ borderBottom: '1px solid var(--border)', padding: '0 32px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--text)' }}>
            <span style={{ background: 'var(--red)', color: '#fff', fontWeight: 700, fontSize: 12, padding: '2px 7px', borderRadius: 3 }}>TED</span>
          </Link>
          <span style={{ color: 'var(--border)', fontSize: 20 }}>|</span>
          <span style={{ fontSize: 14, color: 'var(--text2)' }}>관리자 대시보드</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => setShowNewForm(true)} style={{ fontSize: 13, padding: '8px 16px' }}>+ 발표 추가</button>
          <button className="btn btn-ghost" onClick={handleLogout} style={{ fontSize: 13, padding: '8px 14px' }}>로그아웃</button>
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 32px' }}>
        {showNewForm && (
          <div className="card fade-up" style={{ marginBottom: 32, padding: 28, borderColor: 'rgba(232,52,28,0.25)' }}>
            <h2 style={{ fontSize: 17, marginBottom: 20, fontWeight: 500 }}>새 발표 + 설문 방 생성</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <InputField label="발표 제목 *" value={newPresentation.title} onChange={(v) => setNewPresentation(p => ({ ...p, title: v }))} placeholder="AI가 바꾸는 미래 직업" />
                <InputField label="발표자 이름 *" value={newPresentation.presenter_name} onChange={(v) => setNewPresentation(p => ({ ...p, presenter_name: v }))} placeholder="김민준" />
              </div>
              <InputField label="발표 설명 (선택)" value={newPresentation.description} onChange={(v) => setNewPresentation(p => ({ ...p, description: v }))} placeholder="발표 내용을 간략하게 설명해주세요." />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-primary" onClick={createRoom} disabled={creating || !newPresentation.title || !newPresentation.presenter_name} style={{ fontSize: 14 }}>{creating ? '생성 중...' : '생성하기'}</button>
              <button className="btn btn-ghost" onClick={() => setShowNewForm(false)} style={{ fontSize: 14 }}>취소</button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
          {[{ label: '전체 발표', value: rooms.length }, { label: '진행중', value: rooms.filter(r => r.is_open).length }, { label: '결과 공개', value: rooms.filter(r => r.is_published).length }].map((stat) => (
            <div key={stat.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
              <p style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{stat.label}</p>
              <p style={{ fontSize: 28, fontWeight: 500 }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>불러오는 중...</p>
        ) : rooms.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text3)' }}><p>발표가 없습니다. 위 버튼으로 발표를 추가해주세요.</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rooms.map((room) => (
              <AdminRoomCard key={room.id} room={room}
                onToggle={() => toggleRoom(room.id, room.is_open)}
                onPublish={() => publishResults(room.id)}
                onDelete={() => deleteRoom(room.id, room.presentation_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminRoomCard({ room, onToggle, onPublish, onDelete }: { room: Room; onToggle: () => void; onPublish: () => void; onDelete: () => void; }) {
  const p = room.presentations;
  const [responseCount, setResponseCount] = useState<number | null>(null);

  useEffect(() => {
    supabase.from('responses').select('id', { count: 'exact' }).eq('room_id', room.id).then(({ count }) => setResponseCount(count ?? 0));
  }, [room.id]);

  if (!p) return null;

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '18px 24px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          {room.is_open ? <span className="badge badge-red">진행중</span> : room.is_published ? <span className="badge badge-gold">공개됨</span> : <span className="badge badge-dim">종료</span>}
          {responseCount !== null && <span style={{ fontSize: 12, color: 'var(--text3)' }}>응답 {responseCount}개</span>}
        </div>
        <h3 style={{ fontSize: 16, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</h3>
        <p style={{ fontSize: 13, color: 'var(--text3)' }}>{p.presenter_name}</p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
        <Link href={`/admin/${room.id}`} className="btn btn-ghost" style={{ fontSize: 12, padding: '7px 14px' }}>결과 보기</Link>
        {!room.is_published && (
          <>
            <button className="btn btn-ghost" onClick={onToggle} style={{ fontSize: 12, padding: '7px 14px' }}>{room.is_open ? '설문 종료' : '설문 열기'}</button>
            {!room.is_open && (responseCount ?? 0) > 0 && (
              <button className="btn btn-outline-red" onClick={onPublish} style={{ fontSize: 12, padding: '7px 14px' }}>결과 공개</button>
            )}
          </>
        )}
        <button onClick={onDelete}
          style={{ background: 'transparent', border: '1px solid rgba(232,52,28,0.2)', borderRadius: 'var(--radius)', color: 'var(--text3)', fontSize: 12, padding: '7px 12px', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'sans-serif' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--red-dim)'; e.currentTarget.style.color = 'var(--red)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text3)'; }}>
          삭제
        </button>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14, padding: '10px 12px', outline: 'none', fontFamily: 'sans-serif' }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--red)'; }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }} />
    </div>
  );
}
