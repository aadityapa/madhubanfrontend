export const validationMessages = {
  required: "This field is required.",
  mobileRequired: "Please enter your mobile number.",
  mobileTooLong: "Only 10 digits are allowed.",
  mobileLength: "Please enter a valid 10-digit mobile number.",
  emailRequired: "Please enter your email address.",
  emailInvalid: "Please enter a valid email address.",
  alphabeticOnly: "Only alphabets and spaces are allowed.",
  passwordMinLength: "Password must be at least 8 characters.",
  confirmPasswordRequired: "Please confirm the password.",
  confirmPasswordMismatch: "Passwords do not match.",
} as const;

export const validationStyles = {
  errorText: {
    fontSize: 12,
    color: "#dc2626",
    marginTop: 6,
    fontWeight: 500,
  },
  inputErrorBorder: {
    borderColor: "#dc2626",
  },
} as const satisfies Record<string, React.CSSProperties>;

export function sanitizeDigits(input: string) {
  return String(input || "").replace(/\D/g, "");
}

export function sanitizeAlphabetic(input: string) {
  return String(input || "")
    .replace(/[^a-zA-Z\s]/g, "")
    .replace(/\s{2,}/g, " ");
}

export function isValidIndianMobile(digits: string) {
  return /^[6-9]\d{9}$/.test(sanitizeDigits(digits));
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export function getRequiredError(rawValue: string, message?: string) {
  const resolved = message ?? validationMessages.required;
  return String(rawValue || "").trim() ? null : resolved;
}

export function getIndianMobileError(rawValue: string, requiredMessage?: string) {
  const digits = sanitizeDigits(rawValue);
  if (!digits) return requiredMessage ?? validationMessages.mobileRequired;
  if (digits.length > 10) return validationMessages.mobileTooLong;
  if (!isValidIndianMobile(digits)) return validationMessages.mobileLength;
  return null;
}

export function getEmailError(rawValue: string, requiredMessage?: string) {
  const value = String(rawValue || "").trim();
  if (!value) return requiredMessage ?? validationMessages.emailRequired;
  if (!isValidEmail(value)) return validationMessages.emailInvalid;
  return null;
}

export function getAlphabeticError(rawValue: string, requiredMessage?: string) {
  const value = String(rawValue || "").trim();
  if (!value) return requiredMessage ?? validationMessages.required;
  if (!/^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(value)) return validationMessages.alphabeticOnly;
  return null;
}

export function getPasswordError(rawValue: string, requiredMessage?: string) {
  const value = String(rawValue || "");
  if (!value.trim()) return requiredMessage ?? validationMessages.required;
  if (value.length < 8) return validationMessages.passwordMinLength;
  return null;
}

export function getConfirmPasswordError(password: string, confirmPassword: string) {
  if (!String(confirmPassword || "").trim()) return validationMessages.confirmPasswordRequired;
  if (password !== confirmPassword) return validationMessages.confirmPasswordMismatch;
  return null;
}
