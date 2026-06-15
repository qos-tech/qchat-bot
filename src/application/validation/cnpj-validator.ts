function onlyDigits(value: string): string {
  return value.replace(/\D+/g, "");
}

export function normalizeCnpj(value: string): string {
  return onlyDigits(value);
}

export function isValidCnpj(value: string): boolean {
  const cnpj = normalizeCnpj(value);

  if (cnpj.length !== 14) {
    return false;
  }

  if (/^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  const digits = cnpj.split("").map((digit) => Number.parseInt(digit, 10));

  const calculateDigit = (base: number[]): number => {
    const weights =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const sum = base.reduce(
      (acc, digit, index) => acc + digit * (weights[index] ?? 0),
      0,
    );
    const remainder = sum % 11;

    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calculateDigit(digits.slice(0, 12));
  const secondDigit = calculateDigit([...digits.slice(0, 12), firstDigit]);

  return firstDigit === digits[12] && secondDigit === digits[13];
}
