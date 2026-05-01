import type { ParsedQuestion } from './quiz_questions.js';

export type AnswerValue =
  | { option_index: number }
  | { option_indices: number[] }
  | { value: boolean }
  | { text: string; format?: 'html' | 'plain' }
  | { value: string; unit?: string }
  | { pairs: Array<{ sub_slot: number; stem_index: number }> }
  | { placements: Array<{ drop_slot: number; draggable_index: number }> };

export interface EncodedField {
  name: string;
  value: string;
}

function prefix(q: ParsedQuestion): string {
  const { slot, qid } = q.raw_form_fields;
  return `q${slot}:${qid}`;
}

export function encodeAnswer(q: ParsedQuestion, value: AnswerValue): EncodedField[] {
  const p = prefix(q);

  if (q.type === 'multichoice') {
    if (q.multiselect) {
      if (!('option_indices' in value)) {
        throw new Error(`expected option_indices for multichoice (multi) at slot ${q.slot}`);
      }
      return value.option_indices.map((idx) => ({ name: `${p}_choice${idx}`, value: '1' }));
    }
    if (!('option_index' in value)) {
      throw new Error(`expected option_index for multichoice (single) at slot ${q.slot}`);
    }
    return [{ name: `${p}_answer`, value: String(value.option_index) }];
  }

  if (q.type === 'truefalse') {
    if (!('value' in value) || typeof (value as { value: unknown }).value !== 'boolean') {
      throw new Error(`expected value: boolean for truefalse at slot ${q.slot}`);
    }
    return [{ name: `${p}_answer`, value: (value as { value: boolean }).value ? '1' : '0' }];
  }

  if (q.type === 'shortanswer') {
    if (!('text' in value)) throw new Error(`expected text for shortanswer at slot ${q.slot}`);
    return [{ name: `${p}_answer`, value: String((value as { text: string }).text) }];
  }

  if (q.type === 'essay') {
    if (!('text' in value)) throw new Error(`expected text for essay at slot ${q.slot}`);
    const v = value as { text: string; format?: 'html' | 'plain' };
    return [
      { name: `${p}_answer`, value: v.text },
      { name: `${p}_answerformat`, value: v.format === 'plain' ? '0' : '1' },
    ];
  }

  if (q.type === 'numerical') {
    if (!('value' in value) || typeof (value as { value: unknown }).value !== 'string') {
      throw new Error(`expected value: string for numerical at slot ${q.slot}`);
    }
    const v = value as { value: string; unit?: string };
    return [{ name: `${p}_answer`, value: v.unit ? `${v.value}${v.unit}` : v.value }];
  }

  if (q.type === 'match') {
    if (!('pairs' in value)) throw new Error(`expected pairs for match at slot ${q.slot}`);
    return (value as { pairs: Array<{ sub_slot: number; stem_index: number }> }).pairs.map(
      (p2) => ({
        name: `${p}_sub${p2.sub_slot}`,
        value: String(p2.stem_index),
      }),
    );
  }

  if (q.type === 'ddwtos') {
    if (!('placements' in value))
      throw new Error(`expected placements for ddwtos at slot ${q.slot}`);
    return (
      value as { placements: Array<{ drop_slot: number; draggable_index: number }> }
    ).placements.map((pl) => ({
      name: `${p}_p${pl.drop_slot}`,
      value: String(pl.draggable_index),
    }));
  }

  throw new Error(`unsupported question type at slot ${q.slot}: ${q.type}`);
}
