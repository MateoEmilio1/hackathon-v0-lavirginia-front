export type ValidatorDecision = "APROBADO" | "RECHAZADO";
export type ImageQuality = "good" | "acceptable" | "poor";

export interface ValidatorFailedAxes {
  capsule_damage: boolean;
  capsule_disorder: boolean;
  packaging_damage: boolean;
}

export interface ValidatorResult {
  decision: ValidatorDecision;
  approved: boolean;
  confidence: number;
  reason: string;
  secondary_reasons: string[];
  observations: string[];
  validator_summary: string;
  failed_axes: ValidatorFailedAxes;
  image_quality: ImageQuality;
}
