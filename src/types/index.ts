export type AwardType = "drancon" | "nearpin";
export type HoleAwardType = "none" | "drancon" | "nearpin";
export type RepresentativeStatus = "pending" | "approved" | "rejected";

export interface Account {
  device_id: string;
  account_name: string;
  created_at: string;
}

export interface Competition {
  id: string;
  device_id: string;
  name: string;
  date: string;
  course_name: string | null;
  status: string;
  created_at: string;
}

export interface CompetitionHole {
  id: string;
  competition_id: string;
  hole_number: number;
  award_type: HoleAwardType;
}

export interface CompetitionRepresentative {
  id: string;
  competition_id: string;
  representative_id: string;
  status: RepresentativeStatus;
  created_at: string;
  updated_at: string;
}

export interface RepresentativeWithAccount extends CompetitionRepresentative {
  accounts: { account_name: string } | null;
}

export interface Friendship {
  id: string;
  account_id: string;
  friend_id: string;
  created_at: string;
}

export interface FriendWithAccount {
  device_id: string;
  account_name: string;
}

export interface EvidenceImage {
  id: string;
  competition_id: string;
  device_id: string;
  award_type: AwardType;
  hole_number: number | null;
  distance: number | null;
  image_url: string;
  memo: string | null;
  created_at: string;
}

export interface CompetitionWithCount extends Competition {
  evidence_images: { count: number }[];
  competition_holes?: CompetitionHole[];
}

export interface CompetitionDetail extends Competition {
  holes: CompetitionHole[];
}

export interface EvidenceImageWithRelations extends EvidenceImage {
  competitions: {
    name: string;
    date: string;
    course_name: string | null;
  } | null;
  accounts: {
    account_name: string;
  } | null;
}

export interface ActiveCompetition extends Competition {
  role: "owner" | "representative";
}

export interface DashboardData {
  account: Account;
  stats: {
    totalCompetitions: number;
    activeCompetitions: ActiveCompetition[];
    totalEvidenceImages: number;
    dranconCount: number;
    nearpinCount: number;
  };
  recentImages: EvidenceImageWithRelations[];
  pendingRequests: PendingRepRequest[];
}

export interface CheckNameResponse {
  available: boolean;
  message: string;
  suggestions?: string[];
}

export interface AccountCheckResponse {
  registered: boolean;
  account?: Account;
}

export interface PendingRepRequest {
  id: string;
  competition_id: string;
  competition_name: string;
  requester_id: string;
  requester_name: string;
  status: RepresentativeStatus;
  created_at: string;
}
