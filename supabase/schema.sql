-- ============================================
-- 위너스 TED쇼 - Supabase Schema
-- ============================================

-- 발표 정보
CREATE TABLE presentations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  presenter_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 설문 방 (발표 1개 = 방 1개)
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
  is_open BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 청중 설문 응답
CREATE TABLE responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  good_points TEXT NOT NULL,
  improvements TEXT NOT NULL,
  questions TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- presentations: 누구나 읽기 가능, 인증된 사용자만 쓰기
CREATE POLICY "presentations_select" ON presentations FOR SELECT USING (true);
CREATE POLICY "presentations_insert" ON presentations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "presentations_update" ON presentations FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "presentations_delete" ON presentations FOR DELETE USING (auth.role() = 'authenticated');

-- rooms: 누구나 읽기, 인증된 사용자만 쓰기
CREATE POLICY "rooms_select" ON rooms FOR SELECT USING (true);
CREATE POLICY "rooms_insert" ON rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "rooms_update" ON rooms FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "rooms_delete" ON rooms FOR DELETE USING (auth.role() = 'authenticated');

-- responses: 누구나 읽기/쓰기 (설문은 비로그인도 가능)
CREATE POLICY "responses_select" ON responses FOR SELECT USING (true);
CREATE POLICY "responses_insert" ON responses FOR INSERT WITH CHECK (true);

-- ============================================
-- Realtime 활성화
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE responses;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;

-- ============================================
-- 샘플 데이터
-- ============================================
INSERT INTO presentations (title, presenter_name, description) VALUES
  ('AI가 바꾸는 미래 직업 세계', '김민준', 'AI 시대에 살아남을 직업과 새롭게 탄생할 직업들에 대한 통찰'),
  ('지속 가능한 스타트업 성장 전략', '이서연', '빠른 성장보다 지속 가능한 성장을 추구하는 스타트업의 이야기'),
  ('뇌과학으로 보는 학습의 비밀', '박지호', '뇌가 정보를 처리하고 기억하는 방식으로 효율적인 학습법 제안');
