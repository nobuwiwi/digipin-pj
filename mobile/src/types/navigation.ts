export type SubView =
  | { view: "competition-manage"; competitionId: string }
  | { view: "competition-edit"; competitionId: string }
  | { view: "competition-detail"; competitionId: string }
  | { view: "representative-manage"; competitionId: string }
  | { view: "competition-create" }
  | { view: "qr-codes"; competitionId: string }
  | { view: "evidence-register"; competitionId: string; holeNumber: number; awardType: string; repNames?: string[] };

export type View = SubView | null;
