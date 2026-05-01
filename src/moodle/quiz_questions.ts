import { parse, type HTMLElement } from 'node-html-parser';

export type QuestionType =
  | 'multichoice'
  | 'truefalse'
  | 'shortanswer'
  | 'essay'
  | 'numerical'
  | 'match'
  | 'ddwtos'
  | 'unsupported';

export interface ParsedOption {
  index: number;
  text: string;
  html: string;
}

export interface ParsedSubSlot {
  index: number;
  prompt: string;
}

export interface ParsedQuestion {
  slot: number;
  type: QuestionType;
  text: string;
  html: string;
  images: Array<{ src: string; alt?: string }>;
  options?: ParsedOption[];
  multiselect?: boolean;
  sub_slots?: ParsedSubSlot[];
  number_unit_required?: boolean;
  max_length?: number;
  raw_form_fields: Record<string, string>;
}

const QTYPE_RE = /\bque\s+([a-z]+)\b/;
const FIELD_RE = /^q(\d+):(\d+)_/;

export function rewriteImageUrls(html: string, token: string): string {
  return html.replace(/(src=["'])([^"']*pluginfile\.php[^"']*)(["'])/g, (_m, p1, url, p3) => {
    const sep = url.includes('?') ? '&' : '?';
    return `${p1}${url}${sep}token=${encodeURIComponent(token)}${p3}`;
  });
}

function detectType(root: HTMLElement): QuestionType {
  const cls = root.classList.value.join(' ');
  const m = cls.match(QTYPE_RE);
  if (!m) return 'unsupported';
  const t = m[1];
  if (t === 'multichoice') return 'multichoice';
  if (t === 'truefalse') return 'truefalse';
  if (t === 'shortanswer') return 'shortanswer';
  if (t === 'essay') return 'essay';
  if (t === 'numerical') return 'numerical';
  if (t === 'match') return 'match';
  if (t === 'ddwtos') return 'ddwtos';
  return 'unsupported';
}

function extractRawFormFields(root: HTMLElement): { slot: string; qid: string } | null {
  const inputs = root.querySelectorAll('input[name],textarea[name],select[name]');
  for (const el of inputs) {
    const name = el.getAttribute('name') ?? '';
    const m = name.match(FIELD_RE);
    if (m) return { slot: m[1] ?? '', qid: m[2] ?? '' };
  }
  return null;
}

function extractImages(root: HTMLElement, token: string): Array<{ src: string; alt?: string }> {
  return root.querySelectorAll('img').map((img) => {
    const rawSrc = img.getAttribute('src') ?? '';
    let src = rawSrc;
    if (src.includes('pluginfile.php')) {
      const sep = src.includes('?') ? '&' : '?';
      src = `${src}${sep}token=${encodeURIComponent(token)}`;
    }
    const alt = img.getAttribute('alt');
    return alt ? { src, alt } : { src };
  });
}

function plainText(root: HTMLElement): string {
  return (root.querySelector('.qtext')?.text ?? root.text).trim().replace(/\s+/g, ' ');
}

function parseMultichoice(root: HTMLElement): {
  options: ParsedOption[];
  multiselect: boolean;
} {
  const inputs = root.querySelectorAll('.answer input[type="radio"], .answer input[type="checkbox"]');
  const multiselect = inputs.length > 0 && inputs.every((i) => i.getAttribute('type') === 'checkbox');
  const options: ParsedOption[] = inputs.map((input) => {
    const name = input.getAttribute('name') ?? '';
    const value = input.getAttribute('value') ?? '0';
    let index = Number(value);
    const m = name.match(/_choice(\d+)$/);
    if (m) index = Number(m[1]);
    const label = input.parentNode?.text?.trim() ?? '';
    const html = (input.parentNode as HTMLElement | null)?.innerHTML?.replace(/<input[^>]*>/, '').trim() ?? label;
    return { index, text: label, html };
  });
  return { options, multiselect };
}

function parseMatch(root: HTMLElement): { sub_slots: ParsedSubSlot[]; options: ParsedOption[] } {
  const sub_slots: ParsedSubSlot[] = [];
  const optionMap = new Map<number, ParsedOption>();
  for (const tr of root.querySelectorAll('tr')) {
    const cells = tr.querySelectorAll('td');
    const select = tr.querySelector('select');
    if (!select || cells.length < 2) continue;
    const name = select.getAttribute('name') ?? '';
    const m = name.match(/_sub(\d+)$/);
    if (!m) continue;
    sub_slots.push({ index: Number(m[1]), prompt: cells[0]?.text.trim() ?? '' });
    for (const opt of select.querySelectorAll('option')) {
      const idx = Number(opt.getAttribute('value') ?? '0');
      if (!optionMap.has(idx)) {
        const text = opt.text.trim();
        optionMap.set(idx, { index: idx, text, html: text });
      }
    }
  }
  return { sub_slots, options: [...optionMap.values()].sort((a, b) => a.index - b.index) };
}

export function parseQuestion(
  slot: number,
  html: string,
  token: string,
): ParsedQuestion {
  const root = parse(html);
  const wrapper =
    (root.querySelector('div.que') as HTMLElement | null) ?? (root.firstChild as HTMLElement);
  const type = detectType(wrapper);
  const fields = extractRawFormFields(wrapper) ?? { slot: String(slot), qid: '0' };
  const text = plainText(wrapper);
  const images = extractImages(wrapper, token);
  const rewritten = rewriteImageUrls(html, token);

  const base: ParsedQuestion = {
    slot,
    type,
    text,
    html: rewritten,
    images,
    raw_form_fields: { slot: fields.slot, qid: fields.qid },
  };

  if (type === 'multichoice') {
    const { options, multiselect } = parseMultichoice(wrapper);
    return { ...base, options, multiselect };
  }
  if (type === 'match') {
    const { sub_slots, options } = parseMatch(wrapper);
    return { ...base, sub_slots, options };
  }
  if (type === 'essay') {
    const ta = wrapper.querySelector('textarea');
    const max = Number(ta?.getAttribute('maxlength') ?? '0');
    return { ...base, max_length: max > 0 ? max : undefined };
  }
  if (type === 'numerical') {
    const sel = wrapper.querySelector('select[name*="_unit"]');
    return { ...base, number_unit_required: !!sel };
  }
  return base;
}
