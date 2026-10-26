export interface FormState {
  status: "idle" | "error" | "success";
  message?: string;
}

export const INITIAL_FORM_STATE: FormState = { status: "idle" };

export interface MfaEnrollState {
  status: "idle" | "error" | "ready";
  message?: string;
  factorId?: string;
  qrCode?: string;
  secret?: string;
}

export const INITIAL_MFA_ENROLL_STATE: MfaEnrollState = { status: "idle" };
