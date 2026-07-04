'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ADMIN_PASSWORD } from '@/lib/adminAuth';
import { Room, Response } from '@/types';

export default function AdminRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'good_points' | 'improvements' | 'questions'>('good_points');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel(`admin-room-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'responses', filter: `room_id=eq.${roomId}` },
        (payload) => { setResponses(prev => [payload.new as Response, ...prev]); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

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
    const res = await fetch(`/api/admin/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PASSWORD },
      body: JSON.stringify({ is_open: !room.is_open }),
    });
    if (!res.ok) { alert('상태 변경에 실패했습니다.'); return; }
    setRoom(r => r ? { ...r, is_open: !r.is_open } : r);
  }

  async function publishResults() {
    const res = await fetch(`/api/admin/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PASSWORD },
      body: JSON.stringify({ is_published: true, is_open: false }),
    });
    if (!res.ok) { alert('결과 공개에 실패했습니다.'); return; }
    setRoom(r => r ? { ...r, is_published: true, is_open: false } : r);
  }

  async function copyShareLink() {
    const url = `${window.location.origin}/results/${roomId}`;
    await navigator.clipboard.writeText(url);
    alert('링크가 복사되었습니다!');
  }

  async function exportPDF() {
    const p = room?.presentations;
    const SECTIONS = [
      { key: 'good_points' as keyof Response, label: '👍 좋았던 점', color: '#2ecc71' },
      { key: 'improvements' as keyof Response, label: '✏️ 보완할 점', color: '#c9a84c' },
      { key: 'questions' as keyof Response, label: '🙋 궁금한 점', color: '#4fc3f7' },
    ];
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>${p?.title} - 설문 결과</title>
    <style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif; color:#1a1916; padding:40px; }
    .header { border-bottom:2px solid #e8341c; padding-bottom:20px; margin-bottom:32px; }
    .ted { display:inline-block; background:#e8341c; color:#fff; font-weight:700; font-size:12px; padding:2px 8px; border-radius:3px; margin-bottom:12px; }
    .title { font-size:24px; font-weight:700; margin-bottom:6px; } .sub { font-size:14px; color:#6b6860; margin-bottom:4px; } .meta { font-size:12px; color:#aba89f; }
    .section { margin-bottom:32px; } .sec-title { font-size:15px; font-weight:700; padding:8px 14px; border-radius:6px; margin-bottom:12px; }
    .item { border:1px solid #e8e6e0; border-radius:6px; padding:12px 16px; margin-bottom:6px; font-size:14px; line-height:1.65; display:flex; justify-content:space-between; gap:16px; }
    .time { font-size:11px; color:#aba89f; flex-shrink:0; } .footer { margin-top:32px; padding-top:12px; border-top:1px solid #e8e6e0; font-size:12px; color:#aba89f; text-align:center; }
    @media print { body { padding:20px; } }</style></head><body>
    <div class="header"><div class="ted">TED</div><div class="title">${p?.title ?? ''}</div>
    <div class="sub">발표자: ${p?.presenter_name ?? ''}</div>
    <div class="meta">총 ${responses.length}개 응답 · ${new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' })}</div></div>
    ${SECTIONS.map(s => `<div class="section"><div class="sec-title" style="background:${s.color}15;border-left:3px solid ${s.color}">${s.label} (${responses.length}개)</div>
    ${responses.map(r => `<div class="item"><span>${String(r[s.key]).replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>
    <span class="time">${new Date(r.created_at).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</span></div>`).join('')}</div>`).join('')}
    <div class="footer">위너스 TED쇼 설문 결과</div>
    <script>window.onload=function(){window.print();}</script></body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
  }

  function exportExcel() {
    setExporting(true);
    const p = room?.presentations;
    const title = p?.title ?? '설문결과';
    const presenter = p?.presenter_name ?? '';
    const date = new Date().toLocaleDateString('ko-KR');

    // CSV 데이터 생성 (Excel에서 열 수 있음)
    const BOM = '\uFEFF'; // 한글 깨짐 방지
    const header = ['번호', '좋았던 점', '보완할 점', '궁금한 점', '제출시간'];
    const rows = [...responses].reverse().map((r, i) => [
      i + 1,
      `"${r.good_points.replace(/"/g, '""')}"`,
      `"${r.improvements.replace(/"/g, '""')}"`,
      `"${r.questions.replace(/"/g, '""')}"`,
      `"${new Date(r.created_at).toLocaleString('ko-KR')}"`,
    ]);

    const csv = BOM + [
      [`"발표: ${title}"`],
      [`"발표자: ${presenter}"`],
      [`"출력일: ${date}"`],
      [`"총 응답 수: ${responses.length}개"`],
      [],
      header,
      ...rows,
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}_설문결과_${date.replace(/\./g, '').replace(/ /g, '')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <p style={{ color: 'var(--text3)' }}>불러오는 중...</p>
    </div>
  );

  const p = room?.presentations;
  const TABS = [
    { key: 'good_points' as const, label: '👍 좋았던 점', color: '#2ecc71' },
    { key: 'improvements' as const, label: '✏️ 보완할 점', color: '#c9a84c' },
    { key: 'questions' as const, label: '🙋 궁금한 점', color: '#4fc3f7' },
  ];
  const activeColor = TABS.find(t => t.key === activeTab)?.color ?? 'var(--red)';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{ borderBottom: '1px solid var(--border)', padding: '0 32px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin/dashboard" style={{ color: 'var(--text3)', fontSize: 13, textDecoration: 'none' }}>← 대시보드</Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ fontSize: 14, color: 'var(--text2)' }}>설문 결과</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {responses.length > 0 && (
            <>
              <button className="btn btn-ghost" onClick={exportExcel} disabled={exporting} style={{ fontSize: 13, padding: '8px 14px' }}>
                {exporting ? '준비 중...' : '📊 엑셀 추출'}
              </button>
              <button className="btn btn-ghost" onClick={exportPDF} style={{ fontSize: 13, padding: '8px 14px' }}>
                📄 PDF 추출
              </button>
            </>
          )}
          {room?.is_published ? (
            <button className="btn btn-ghost" onClick={copyShareLink} style={{ fontSize: 13, padding: '8px 14px' }}>🔗 공유 링크 복사</button>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={toggleRoom} style={{ fontSize: 13, padding: '8px 14px' }}>
                {room?.is_open ? '설문 종료' : '설문 열기'}
              </button>
              {!room?.is_open && responses.length > 0 && (
                <button className="btn btn-primary" onClick={publishResults} style={{ fontSize: 13, padding: '8px 16px' }}>결과 공개하기 →</button>
              )}
            </>
          )}
        </div>
      </header>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 32px 80px' }}>
        <div className="fade-up" style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            {room?.is_open ? <span className="badge badge-red">실시간 수집 중</span>
              : room?.is_published ? <span className="badge badge-gold">결과 공개됨</span>
              : <span className="badge badge-dim">설문 종료</span>}
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>총 {responses.length}개 응답</span>
          </div>
          <h1 style={{ fontSize: 'clamp(20px, 3vw, 28px)', marginBottom: 6 }}>{p?.title}</h1>
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>{p?.presenter_name}</p>
        </div>

        {responses.length === 0 ? (
          <div className="card fade-up" style={{ textAlign: 'center', padding: '60px', color: 'var(--text3)' }}>
            <p style={{ fontSize: 15 }}>아직 응답이 없습니다.</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>청중들이 설문에 참여하면 실시간으로 표시됩니다.</p>
            {room?.is_open && <p style={{ fontSize: 12, marginTop: 16, color: 'var(--red)' }}>설문 링크: /survey/{roomId}</p>}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg3)', padding: 4, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              {TABS.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                  flex: 1, padding: '10px 12px',
                  background: activeTab === tab.key ? '#fff' : 'transparent',
                  border: activeTab === tab.key ? `1px solid ${tab.color}33` : '1px solid transparent',
                  borderRadius: 'var(--radius)', color: activeTab === tab.key ? 'var(--text)' : 'var(--text3)',
                  fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'sans-serif',
                }}>
                  {tab.label}
                  <span style={{ marginLeft: 6, fontSize: 11, background: activeTab === tab.key ? `${tab.color}22` : 'transparent', color: activeTab === tab.key ? tab.color : 'var(--text3)', padding: '2px 6px', borderRadius: 10 }}>
                    {responses.length}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {responses.map((resp, i) => (
                <div key={resp.id} className="card fade-up" style={{ animationDelay: `${i * 0.04}s`, opacity: 0, animationFillMode: 'forwards', padding: '18px 20px', borderLeft: `3px solid ${activeColor}44` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <p style={{ fontSize: 15, lineHeight: 1.65, flex: 1, color: 'var(--text)' }}>{resp[activeTab]}</p>
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
