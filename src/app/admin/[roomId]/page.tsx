'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Room, Response } from '@/types';

export default function AdminRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'good_points' | 'improvements' | 'questions'>('good_points');

  useEffect(() => {
    checkAuth();
    fetchData();

    // Realtime: 새 응답 수신
    const channel = supabase
      .channel(`admin-room-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'responses',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setResponses(prev => [payload.new as Response, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/admin');
  }

  async function fetchData() {
    const [{ data: roomData }, { data: respData }] = await Promise.all([
      supabase.from('rooms').select('*, presentations(*)').eq('id', roomId).single(),
      supabase.from('responses').select('*').eq('room_id', roomId).order('created_at', { ascending: false }),
    ]);
    setRoom(roomData);
    setResponses(respData ?? []);
    setLoading(false);
  }

  async function toggleRoom() {
    if (!room) return;
    await supabase.from('rooms').update({ is_open: !room.is_open }).eq('id', roomId);
    setRoom(r => r ? { ...r, is_open: !r.is_open } : r);
  }

  async function publishResults() {
    await supabase.from('rooms').update({ is_published: true, is_open: false }).eq('id', roomId);
    setRoom(r => r ? { ...r, is_published: true, is_open: false } : r);
  }

  async function copyShareLink() {
    const url = `${window.location.origin}/results/${roomId}`;
    await navigator.clipboard.writeText(url);
    alert('링크가 복사되었습니다! 청중들에게 공유해주세요.');
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text3)' }}>불러오는 중...</p>
    </div>
  );

  const p = room?.presentations;
  const TABS = [
    { key: 'good_points' as const, label: '👍 좋았던 점', color: '#2ecc71' },
    { key: 'improvements' as const, label: '✏️ 보완할 점', color: 'var(--gold)' },
    { key: 'questions' as const, label: '🙋 궁금한 점', color: '#4fc3f7' },
  ];
  const activeColor = TABS.find(t => t.key === activeTab)?.color ?? 'var(--red)';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 32px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin/dashboard" style={{ color: 'var(--text3)', fontSize: 13, textDecoration: 'none' }}>
            ← 대시보드
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ fontSize: 14, color: 'var(--text2)' }}>설문 결과</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {room?.is_published ? (
            <button className="btn btn-ghost" onClick={copyShareLink} style={{ fontSize: 13, padding: '8px 14px' }}>
              🔗 공유 링크 복사
            </button>
          ) : (
            <>
              <button
                className="btn btn-ghost"
                onClick={toggleRoom}
                style={{ fontSize: 13, padding: '8px 14px' }}
              >
                {room?.is_open ? '설문 종료' : '설문 열기'}
              </button>
              {!room?.is_open && responses.length > 0 && (
                <button
                  className="btn btn-primary"
                  onClick={publishResults}
                  style={{ fontSize: 13, padding: '8px 16px' }}
                >
                  결과 공개하기 →
                </button>
              )}
            </>
          )}
        </div>
      </header>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 32px 80px' }}>
        {/* Presentation info */}
        <div className="fade-up" style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            {room?.is_open ? (
              <span className="badge badge-red">
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)', marginRight: 6 }} />
                실시간 수집 중
              </span>
            ) : room?.is_published ? (
              <span className="badge badge-gold">결과 공개됨</span>
            ) : (
              <span className="badge badge-dim">설문 종료</span>
            )}
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>총 {responses.length}개 응답</span>
          </div>
          <h1 style={{ fontSize: 'clamp(20px, 3vw, 28px)', marginBottom: 6 }}>{p?.title}</h1>
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>{p?.presenter_name}</p>
        </div>

        {responses.length === 0 ? (
          <div className="card fade-up" style={{ textAlign: 'center', padding: '60px', color: 'var(--text3)' }}>
            <p style={{ fontSize: 15 }}>아직 응답이 없습니다.</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>
              청중들이 설문에 참여하면 실시간으로 표시됩니다.
            </p>
            {room?.is_open && (
              <p style={{ fontSize: 12, marginTop: 16, color: 'var(--red)' }}>
                설문 링크: /survey/{roomId}
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{
              display: 'flex', gap: 4, marginBottom: 24,
              background: 'var(--bg2)', padding: 4,
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
            }}>
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    flex: 1, padding: '10px 12px',
                    background: activeTab === tab.key ? 'var(--bg3)' : 'transparent',
                    border: activeTab === tab.key ? `1px solid ${tab.color}33` : '1px solid transparent',
                    borderRadius: 'var(--radius)',
                    color: activeTab === tab.key ? 'var(--text)' : 'var(--text3)',
                    fontSize: 13, cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'var(--font-sans), sans-serif',
                  }}
                >
                  {tab.label}
                  <span style={{
                    marginLeft: 6, fontSize: 11,
                    background: activeTab === tab.key ? `${tab.color}22` : 'transparent',
                    color: activeTab === tab.key ? tab.color : 'var(--text3)',
                    padding: '2px 6px', borderRadius: 10,
                  }}>
                    {responses.length}
                  </span>
                </button>
              ))}
            </div>

            {/* Responses */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {responses.map((resp, i) => (
                <div
                  key={resp.id}
                  className="card fade-up"
                  style={{
                    animationDelay: `${i * 0.04}s`,
                    opacity: 0, animationFillMode: 'forwards',
                    padding: '18px 20px',
                    borderLeft: `3px solid ${activeColor}44`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <p style={{ fontSize: 15, lineHeight: 1.65, flex: 1, color: 'var(--text)' }}>
                      {resp[activeTab]}
                    </p>
                    <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0, paddingTop: 3 }}>
                      {new Date(resp.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
