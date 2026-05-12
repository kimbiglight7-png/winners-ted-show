'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Room, SurveyFormData } from '@/types';

type Step = 'loading' | 'closed' | 'form' | 'submitting' | 'done';

export default function SurveyPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();

  const [step, setStep] = useState<Step>('loading');
  const [room, setRoom] = useState<Room | null>(null);
  const [form, setForm] = useState<SurveyFormData>({
    good_points: '',
    improvements: '',
    questions: '',
  });
  const [errors, setErrors] = useState<Partial<SurveyFormData>>({});

  useEffect(() => {
    async function fetchRoom() {
      const { data } = await supabase
        .from('rooms')
        .select('*, presentations(*)')
        .eq('id', roomId)
        .single();

      if (!data || !data.is_open) {
        setStep('closed');
      } else {
        setRoom(data);
        setStep('form');
      }
    }
    fetchRoom();

    // Realtime: 방 상태 변경 감지 (is_open → false 되면 닫기)
    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
      }, (payload) => {
        if (!(payload.new as Room).is_open) setStep('closed');
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  function validate(): boolean {
    const e: Partial<SurveyFormData> = {};
    if (!form.good_points.trim()) e.good_points = '필수 입력 항목입니다.';
    if (!form.improvements.trim()) e.improvements = '필수 입력 항목입니다.';
    if (!form.questions.trim()) e.questions = '필수 입력 항목입니다.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setStep('submitting');

    const { error } = await supabase.from('responses').insert({
      room_id: roomId,
      good_points: form.good_points.trim(),
      improvements: form.improvements.trim(),
      questions: form.questions.trim(),
    });

    if (error) {
      alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
      setStep('form');
    } else {
      setStep('done');
    }
  }

  const presentation = room?.presentations;

  // ── Loading ──────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <PageShell>
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text3)' }}>
          <div className="spinner" />
          <p style={{ marginTop: 16, fontSize: 14 }}>설문 방을 불러오는 중...</p>
        </div>
      </PageShell>
    );
  }

  // ── Closed ───────────────────────────────────────────────
  if (step === 'closed') {
    return (
      <PageShell>
        <div className="card fade-up" style={{ textAlign: 'center', padding: '60px 24px', maxWidth: 480, margin: '40px auto' }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>🔒</div>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>설문이 종료되었습니다</h2>
          <p style={{ color: 'var(--text2)', fontSize: 15, marginBottom: 28 }}>
            이 발표의 설문 참여 기간이 마감되었습니다.
          </p>
          <Link href="/" className="btn btn-ghost">← 목록으로 돌아가기</Link>
        </div>
      </PageShell>
    );
  }

  // ── Done ─────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <PageShell>
        <div style={{ textAlign: 'center', padding: '80px 24px', maxWidth: 480, margin: '0 auto' }}>
          <div className="fade-up" style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(40, 200, 120, 0.1)',
            border: '1px solid rgba(40, 200, 120, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px',
            fontSize: 32,
          }}>✓</div>
          <h2 className="fade-up fade-up-delay-1" style={{ fontSize: 26, marginBottom: 12 }}>
            피드백이 전달되었습니다!
          </h2>
          <p className="fade-up fade-up-delay-2" style={{ color: 'var(--text2)', fontSize: 16, marginBottom: 8 }}>
            <strong style={{ color: 'var(--text)' }}>{presentation?.presenter_name}</strong> 발표자에게<br />
            소중한 의견을 주셔서 감사합니다.
          </p>
          <p className="fade-up fade-up-delay-3" style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 32 }}>
            발표 종료 후 관리자가 결과를 공개하면 확인하실 수 있습니다.
          </p>
          <Link href="/" className="btn btn-ghost fade-up" style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
            ← 발표 목록 보기
          </Link>
        </div>
      </PageShell>
    );
  }

  // ── Form ─────────────────────────────────────────────────
  const QUESTIONS = [
    {
      key: 'good_points' as keyof SurveyFormData,
      label: '좋았던 점',
      emoji: '👍',
      placeholder: '발표 내용 중 인상적이거나 유익했던 부분을 알려주세요.',
      color: '#2ecc71',
    },
    {
      key: 'improvements' as keyof SurveyFormData,
      label: '보완할 점',
      emoji: '✏️',
      placeholder: '더 발전시키면 좋을 부분이나 아쉬웠던 점을 알려주세요.',
      color: 'var(--gold)',
    },
    {
      key: 'questions' as keyof SurveyFormData,
      label: '궁금한 점',
      emoji: '🙋',
      placeholder: '발표 내용과 관련해 더 알고 싶은 것이 있으신가요?',
      color: '#4fc3f7',
    },
  ];

  return (
    <PageShell>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 0 80px' }}>
        {/* Presentation info */}
        <div className="fade-up" style={{ marginBottom: 40 }}>
          <span className="badge badge-red" style={{ marginBottom: 14, display: 'inline-flex' }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'var(--red)', marginRight: 6,
            }}/>
            설문 진행중
          </span>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', marginBottom: 10 }}>
            {presentation?.title}
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>발표자: {presentation?.presenter_name}</p>
        </div>

        <hr className="divider" style={{ marginBottom: 36 }} />

        {/* Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {QUESTIONS.map((q, i) => (
            <div
              key={q.key}
              className={`fade-up`}
              style={{ animationDelay: `${0.1 + i * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
              }}>
                <span style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--bg3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0,
                }}>{q.emoji}</span>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 15, fontWeight: 500, color: 'var(--text)',
                    marginBottom: 2,
                  }}>{q.label}</label>
                  {errors[q.key] && (
                    <span style={{ fontSize: 12, color: 'var(--red)' }}>{errors[q.key]}</span>
                  )}
                </div>
              </div>
              <textarea
                value={form[q.key]}
                onChange={(e) => {
                  setForm(f => ({ ...f, [q.key]: e.target.value }));
                  if (errors[q.key]) setErrors(err => ({ ...err, [q.key]: undefined }));
                }}
                placeholder={q.placeholder}
                rows={3}
                style={{
                  background: 'var(--bg3)',
                  border: `1px solid ${errors[q.key] ? 'var(--red)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-sans), sans-serif',
                  fontSize: 15,
                  lineHeight: 1.6,
                  padding: '14px 16px',
                  resize: 'vertical',
                  width: '100%',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = q.color;
                  e.target.style.boxShadow = `0 0 0 3px ${q.color}22`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors[q.key] ? 'var(--red)' : 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="fade-up" style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards', marginTop: 40 }}>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={step === 'submitting'}
            style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: '14px 24px' }}
          >
            {step === 'submitting' ? '제출 중...' : '피드백 제출하기 →'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 12 }}>
            익명으로 제출됩니다. 제출 후 수정이 불가능합니다.
          </p>
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 40px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
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
      </header>
      <div style={{ padding: '0 24px' }}>{children}</div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 28px; height: 28px; border-radius: 50%;
          border: 2px solid var(--border);
          border-top-color: var(--red);
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}
