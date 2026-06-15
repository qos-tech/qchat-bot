import { isValidCnpj, normalizeCnpj } from "./cnpj-validator.js";

export type CustomerIdentificationType = "company_name" | "cnpj";

export type CustomerIdentificationResult =
  | {
      type: "cnpj";
      value: string;
    }
  | {
      type: "company_name";
      value: string;
    };

export function detectCustomerIdentification(
  value: string,
): CustomerIdentificationResult {
  const trimmedValue = value.trim();

  if (isValidCnpj(trimmedValue)) {
    return {
      type: "cnpj",
      value: normalizeCnpj(trimmedValue),
    };
  }

  return {
    type: "company_name",
    value,
  };
}
