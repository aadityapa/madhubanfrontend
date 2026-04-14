export const validationMessages = {
  required: "This field is required.",
  mobileRequired: "Please enter your mobile number.",
  mobileTooLong: "Only 10 digits are allowed.",
  mobileLength: "Please enter a valid 10-digit mobile number.",
  emailRequired: "Please enter your email address.",
  emailInvalid: "Please enter a valid email address.",
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

export function isValidIndianMobile(digits: string) {
  return /^[6-9]\d{9}$/.test(sanitizeDigits(digits));
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export function getRequiredError(rawValue: string, message = validationMessages.required) {
  return String(rawValue || "").trim() ? null : message;
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
