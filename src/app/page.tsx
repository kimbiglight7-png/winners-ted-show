import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Room } from '@/types';

async function getRoomsWithPresentations(): Promise<Room[]> {
  const { data } = await supabase
    .from('rooms')
    .select('*, presentations(*)')
    .or('is_open.eq.true,is_published.eq.true')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export default async function HomePage() {
  const rooms = await getRoomsWithPresentations();
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{ borderBottom: '1px solid var(--border)', padding: '0 40px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ background: 'var(--red)', color: '#fff', fontFamily: 'var(--font-serif), serif', fontWeight: 700, fontSize: 13, padding: '3px 8px', borderRadius: 4 }}>TED</span>
          <span style={{ fontFamily: 'var(--font-serif), serif', fontSize: 18, fontWeight: 700 }}>위너스 TED쇼</span>
        </div>
        <Link href="/admin" className="btn btn-ghost" style={{ fontSize: 13, padding: '8px 16px' }}>관리자 로그인</Link>
      </header>
      <section style={{ padding: '80px 40px 60px', maxWidth: 800, margin: '0 auto' }}>
        <p style={{ fontSize: 13, color: 'var(--red)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 500 }}>Ideas Worth Spreading</p>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 60px)', color: 'var(--text)', marginBottom: 20 }}>오늘의 발표를<br />함께 만들어가요</h1>
        <p style={{ fontSize: 17, color: 'var(--text2)', maxWidth: 480, lineHeight: 1.7 }}>각 발표가 끝난 후 설문에 참여해 발표자에게 소중한 피드백을 전달해 주세요.</p>
      </section>
      <section style={{ padding: '0 40px 80px', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--text2)', marginBottom: 24 }}>발표 목록 ({rooms.length})</h2>
        {rooms.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text3)' }}><p>등록된 발표가 없습니다.</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rooms.map((room, i) => <RoomCard key={room.id} room={room} index={i} />)}
          </div>
        )}
      </section>
    </main>
  );
}

function RoomCard({ room, index }: { room: Room; index: number }) {
  const p = room.presentations;
  if (!p) return null;
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, padding: '20px 24px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 6 }}>
          {room.is_open ? <span className="badge badge-red">설문 진행중</span> : <span className="badge badge-gold">결과 공개됨</span>}
        </div>
        <h3 style={{ fontSize: 18, marginBottom: 4, color: 'var(--text)', fontFamily: 'var(--font-serif), serif' }}>{p.title}</h3>
        <p style={{ fontSize: 13, color: 'var(--text3)' }}>{p.presenter_name}</p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {room.is_open && <Link href={`/survey/${room.id}`} className="btn btn-primary" style={{ fontSize: 13, padding: '9px 18px' }}>설문 참여 →</Link>}
        {room.is_published && <Link href={`/results/${room.id}`} className="btn btn-ghost" style={{ fontSize: 13, padding: '9px 18px' }}>결과 보기</Link>}
      </div>
    </div>
  );
}