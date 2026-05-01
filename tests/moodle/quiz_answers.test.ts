import { describe, it, expect } from 'vitest';
import { encodeAnswer } from '../../src/moodle/quiz_answers.js';
import type { ParsedQuestion } from '../../src/moodle/quiz_questions.js';

const baseQuestion = (over: Partial<ParsedQuestion>): ParsedQuestion => ({
  slot: 1,
  type: 'multichoice',
  text: '',
  html: '',
  images: [],
  raw_form_fields: { slot: '1', qid: '42' },
  ...over,
});

describe('encodeAnswer', () => {
  it('encodes multichoice single', () => {
    const q = baseQuestion({ type: 'multichoice', multiselect: false });
    expect(encodeAnswer(q, { option_index: 1 })).toEqual([{ name: 'q1:42_answer', value: '1' }]);
  });

  it('encodes multichoice single with -1 (clear)', () => {
    const q = baseQuestion({ type: 'multichoice', multiselect: false });
    expect(encodeAnswer(q, { option_index: -1 })).toEqual([{ name: 'q1:42_answer', value: '-1' }]);
  });

  it('encodes multichoice multi (selected indices only)', () => {
    const q = baseQuestion({ type: 'multichoice', multiselect: true });
    expect(encodeAnswer(q, { option_indices: [0, 2] })).toEqual([
      { name: 'q1:42_choice0', value: '1' },
      { name: 'q1:42_choice2', value: '1' },
    ]);
  });

  it('encodes truefalse', () => {
    const q = baseQuestion({ type: 'truefalse' });
    expect(encodeAnswer(q, { value: true })).toEqual([{ name: 'q1:42_answer', value: '1' }]);
    expect(encodeAnswer(q, { value: false })).toEqual([{ name: 'q1:42_answer', value: '0' }]);
  });

  it('encodes shortanswer', () => {
    const q = baseQuestion({ type: 'shortanswer' });
    expect(encodeAnswer(q, { text: 'Paris' })).toEqual([{ name: 'q1:42_answer', value: 'Paris' }]);
  });

  it('encodes essay with default html format', () => {
    const q = baseQuestion({ type: 'essay' });
    expect(encodeAnswer(q, { text: '<p>hi</p>' })).toEqual([
      { name: 'q1:42_answer', value: '<p>hi</p>' },
      { name: 'q1:42_answerformat', value: '1' },
    ]);
  });

  it('encodes essay with plain format', () => {
    const q = baseQuestion({ type: 'essay' });
    expect(encodeAnswer(q, { text: 'hi', format: 'plain' })).toEqual([
      { name: 'q1:42_answer', value: 'hi' },
      { name: 'q1:42_answerformat', value: '0' },
    ]);
  });

  it('encodes numerical without unit', () => {
    const q = baseQuestion({ type: 'numerical' });
    expect(encodeAnswer(q, { value: '42' })).toEqual([{ name: 'q1:42_answer', value: '42' }]);
  });

  it('encodes numerical with unit', () => {
    const q = baseQuestion({ type: 'numerical' });
    expect(encodeAnswer(q, { value: '42', unit: ' m' })).toEqual([
      { name: 'q1:42_answer', value: '42 m' },
    ]);
  });

  it('encodes match', () => {
    const q = baseQuestion({
      type: 'match',
      sub_slots: [
        { index: 1, prompt: 'Apple' },
        { index: 2, prompt: 'Carrot' },
      ],
    });
    expect(
      encodeAnswer(q, {
        pairs: [
          { sub_slot: 1, stem_index: 1 },
          { sub_slot: 2, stem_index: 2 },
        ],
      }),
    ).toEqual([
      { name: 'q1:42_sub1', value: '1' },
      { name: 'q1:42_sub2', value: '2' },
    ]);
  });

  it('encodes ddwtos placements', () => {
    const q = baseQuestion({ type: 'ddwtos' });
    expect(
      encodeAnswer(q, {
        placements: [
          { drop_slot: 1, draggable_index: 3 },
          { drop_slot: 2, draggable_index: 1 },
        ],
      }),
    ).toEqual([
      { name: 'q1:42_p1', value: '3' },
      { name: 'q1:42_p2', value: '1' },
    ]);
  });

  it('rejects unsupported question types', () => {
    const q = baseQuestion({ type: 'unsupported' });
    expect(() => encodeAnswer(q, { value: true })).toThrow(/unsupported question type/i);
  });

  it('rejects mismatched value shape for question type', () => {
    const q = baseQuestion({ type: 'truefalse' });
    expect(() => encodeAnswer(q, { text: 'true' } as never)).toThrow(/expected/i);
  });
});
