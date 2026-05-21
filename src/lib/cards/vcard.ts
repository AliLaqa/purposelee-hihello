type VCardInput = {
  fullName: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
};

function clean(value: string) {
  return value.replace(/\r?\n/g, " ").trim();
}

export function generateVCard(input: VCardInput): string {
  const lines: string[] = [];
  lines.push("BEGIN:VCARD");
  lines.push("VERSION:3.0");
  lines.push(`FN:${clean(input.fullName)}`);

  if (input.company) {
    lines.push(`ORG:${clean(input.company)}`);
  }
  if (input.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${clean(input.email)}`);
  }
  if (input.phone) {
    lines.push(`TEL;TYPE=CELL:${clean(input.phone)}`);
  }

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

