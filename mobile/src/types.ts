// Shapes returned by the backend (see backend/models.py → to_dict). `Job` also satisfies the shared job-matching module.

export interface User {
  id: number; name: string; email: string; university: string | null; funding_type: string | null;
  region: string | null; role: string; is_verified: boolean; job_alerts_enabled: boolean; created_at: string;
}

export interface Job {
  id: number; title: string; company: string; location: string | null; type: string | null; salary: string | null;
  description: string | null; requirements: string[]; schedule_compatible: string[]; deadline: string | null;
  tags: string[]; apply_link: string; student_friendly: string; student_friendly_note: string;
  apply_count: number; is_active: boolean; created_at: string; isNew: boolean;
  /** filled by normalizeJob(); used by the shared job-matching module */
  studentFriendly?: string;
  days_left: number | null; closing_soon: boolean; expired: boolean;
}

export interface Club {
  id: number; name: string; description: string | null; category: string | null; university: string | null;
  meeting_time: string | null; location: string | null; member_count: number; pending_count: number;
  my_status: "pending" | "approved" | null; is_creator: boolean; telegram_link: string | null; contact: string | null;
  created_at: string; creator_name: string | null; club_type: "club" | "community"; region: string | null;
  website: string; cover_image: string;
}

export interface ClubMessage {
  id: number; club_id: number; user_id: number; author_name: string; content: string; created_at: string;
}

export interface Answer {
  id: number; post_id: number; user_id: number; author_name: string; author_university: string; author_region: string;
  content: string; created_at: string;
}

export interface Question {
  id: number; user_id: number; author_name: string; author_university: string; author_region: string;
  title: string; content: string; scope: string; image_url: string; answer_count: number;
  accepted_answer_id: number | null; solved: boolean; created_at: string; answers?: Answer[];
}

export interface Person { id: number; name: string; university: string }
export interface Msg { id: number; sender_id: number; recipient_id: number; body: string; created_at: string; read: boolean; mine: boolean }
export interface Convo { user: Person; last: Msg; unread: number }
export interface Thread { user: Person; messages: Msg[]; blocked: boolean; blocked_me: boolean }
export interface NewsItem { id: number; title: string; summary: string; url: string; source: string; published_at: string }
export interface CvMeta { filename: string; mime: string; size: number; updated_at: string }
