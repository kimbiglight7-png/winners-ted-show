export interface Presentation {
  id: string;
  title: string;
  presenter_name: string;
  description: string | null;
  created_at: string;
}

export interface Room {
  id: string;
  presentation_id: string;
  is_open: boolean;
  is_published: boolean;
  created_at: string;
  presentations?: Presentation;
}

export interface Response {
  id: string;
  room_id: string;
  good_points: string;
  improvements: string;
  questions: string;
  created_at: string;
}

export interface SurveyFormData {
  good_points: string;
  improvements: string;
  questions: string;
}
