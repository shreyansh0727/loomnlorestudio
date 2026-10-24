export interface FormState {
  status: "idle" | "error" | "success";
  message?: string;
}

export const INITIAL_FORM_STATE: FormState = { status: "idle" };
