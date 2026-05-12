import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Response } from '@/types';

async function getData(roomId: string) {
  const { data: room } = await supabase
    .from('rooms')
    .select('*, presentations(*)')
    .eq('id', roomId)
    .single();

  if (!room || !room.is_published) return null;

  const { data: responses } = await supabase
    .from('responses')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false });

  return { room, responses: responses ?? [] };
}

export default async function ResultsPage({ params }: { params: { roomId: string } }) {
  const data = await getData(params.roomId);

  if (!data) return notFound();

  const { room, responses } = data;
  const p = room.presentations;

  const SECTIONS = [
    {
      key: 'good_points' as keyof Response,
      emoji: '👍',
      label: '좋았던 점',
      color: '#2ecc71',
      bgColor: 'rgba(46,204,113,0.06)',
      borderColor: 'rgba(46,204,113,0.2)',
    },
    {
      key: 'improvements' as keyof Response,
      emoji: '✏️',
      label: '보완할 점',
      color: '#c9a84c',
      bgColor: 'rgba(201,168,76,0.06)',
      borderColor: 'rgba(201,168,76,0.2)',
    },
    {
      key: 'questions' as keyof Response,
      emoji: '🙋',
      label: '궁금한 점',
      color: '#4fc3f7',
      bgColor: 'rgba(79,195,247,0.06)',
      borderColor: 'rgba(79,195,247,0.2)',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 40px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          textDecoration: 'none', color: 'var(--text)',
        }}>
          <span style={{
            background: 'var(--red)', color: '#fff',
            fontFamily: 'var(--font-serif), serif', fontWeight: 700,
            fontSize: 12, padding: '2px 7px', borderRadius: 3,
          }}>TED</span>
          <span style={{ fontFamily: 'var(--font-serif), serif', fontSize: 16, fontWeight: 700 }}>
            위너스 TED쇼
          </span>
        </Link>
        <Link href="/" className="btn btn-ghost" style={{ fontSize: 13, padding: '7px 14px' }}>
          ← 목록으로
        </Link>
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 32px 100px' }}>

        {/* Hero */}
        <div className="fade-up" style={{ marginBottom: 48 }}>
          <span className="badge badge-gold" style={{ marginBottom: 16, display: 'inline-flex' }}>
            설문 결과 공개
          </span>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 38px)', marginBottom: 12, lineHeight: 1.2 }}>
            {p?.title}
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 16, marginBottom: 8 }}>
            발표자: <strong style={{ color: 'var(--text)' }}>{p?.presenter_name}</strong>
          </p>
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>
            총 <strong style={{ color: 'var(--text2)' }}>{responses.length}명</strong>의 청중이 설문에 참여했습니다.
          </p>
        </div>

        <hr className="divider" style={{ marginBottom: 48 }} />

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {SECTIONS.map((section, si) => (
            <section
              key={section.key}
              className="fade-up"
              style={{
                animationDelay: `${si * 0.1}s`,
                opacity: 0, animationFillMode: 'forwards',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: section.bgColor,
                  border: `1px solid ${section.borderColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>{section.emoji}</span>
                <div>
                  <h2 style={{
                    fontSize: 18, fontFamily: 'var(--font-serif), serif',
                    color: 'var(--text)', margin: 0,
                  }}>{section.label}</h2>
                  <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0 }}>
                    {responses.length}개 응답
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {responses.map((resp) => (
                  <div
                    key={resp.id}
                    style={{
                      background: section.bgColor,
                      border: `1px solid ${section.borderColor}`,
                      borderRadius: 'var(--radius)',
                      padding: '14px 18px',
                    }}
                  >
                    <p style={{
                      fontSize: 15, lineHeight: 1.7,
                      color: 'var(--text)', margin: 0,
                    }}>
                      {String(resp[section.key])}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="fade-up" style={{
          marginTop: 64, padding: '24px',
          background: 'var(--bg2)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          textAlign: 'center',
        }}>
          <p style={{ color: 'var(--text2)', fontSize: 15, marginBottom: 16 }}>
            소중한 피드백 감사합니다 🎉
          </p>
          <Link href="/" className="btn btn-ghost" style={{ fontSize: 14 }}>
            다른 발표 보러가기 →
          </Link>
        </div>
      </div>
    </div>
  );
}
