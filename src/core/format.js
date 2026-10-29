export function fmt(value, digits = 0) {
  if (value == null || Number.isNaN(Number(value))) return "\u2013";
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function gb(bytes, digits = 1) {
  return bytes == null ? "\u2013" : fmt(Number(bytes) / 1073741824, digits);
}
