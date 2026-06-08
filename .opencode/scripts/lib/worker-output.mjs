export function parseStructuredOutput(text) {
  const fields = {};
  const lines = String(text || '').split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^([A-Z][A-Z0-9_]*):\s*(.*)$/);
    if (match) fields[match[1]] = match[2].trim();
  }

  return fields;
}

export function missingFields(fields, required) {
  return required.filter(field => !fields[field]);
}

export function enumViolation(fields, name, allowed) {
  if (!fields[name]) return null;
  return allowed.includes(fields[name]) ? null : `${name} must be one of ${allowed.join(' | ')}; got ${fields[name]}`;
}
