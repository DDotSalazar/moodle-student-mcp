import { describe, it, expect } from 'vitest';
import { parseQuestion, rewriteImageUrls } from '../../src/moodle/quiz_questions.js';

describe('quiz_questions parser', () => {
  it('detects multichoice single-answer with options', () => {
    const html = `<div class="que multichoice deferredfeedback notyetanswered">
      <div class="qtext"><p>Which is a primary colour?</p></div>
      <div class="answer">
        <div class="r0"><label><input type="radio" name="q1:42_answer" value="0"/> Red</label></div>
        <div class="r1"><label><input type="radio" name="q1:42_answer" value="1"/> Cyan</label></div>
      </div>
    </div>`;
    const parsed = parseQuestion(1, html, 'tok');
    expect(parsed.type).toBe('multichoice');
    expect(parsed.multiselect).toBe(false);
    expect(parsed.options).toEqual([
      { index: 0, text: 'Red', html: 'Red' },
      { index: 1, text: 'Cyan', html: 'Cyan' },
    ]);
    expect(parsed.raw_form_fields).toEqual({ qid: '42', slot: '1' });
    expect(parsed.text).toMatch(/primary colour/i);
  });

  it('detects multichoice multi-answer (checkboxes)', () => {
    const html = `<div class="que multichoice">
      <div class="qtext"><p>Pick all primary colours.</p></div>
      <div class="answer">
        <div class="r0"><label><input type="checkbox" name="q2:43_choice0" value="1"/> Red</label></div>
        <div class="r1"><label><input type="checkbox" name="q2:43_choice1" value="1"/> Cyan</label></div>
        <div class="r2"><label><input type="checkbox" name="q2:43_choice2" value="1"/> Blue</label></div>
      </div>
    </div>`;
    const parsed = parseQuestion(2, html, 'tok');
    expect(parsed.type).toBe('multichoice');
    expect(parsed.multiselect).toBe(true);
    expect(parsed.options).toHaveLength(3);
  });

  it('detects truefalse', () => {
    const html = `<div class="que truefalse">
      <div class="qtext"><p>Water is H2O.</p></div>
      <div class="answer">
        <input type="radio" name="q3:50_answer" value="1"/> True
        <input type="radio" name="q3:50_answer" value="0"/> False
      </div>
    </div>`;
    const parsed = parseQuestion(3, html, 'tok');
    expect(parsed.type).toBe('truefalse');
    expect(parsed.raw_form_fields.qid).toBe('50');
  });

  it('detects shortanswer', () => {
    const html = `<div class="que shortanswer">
      <div class="qtext"><p>Capital of France?</p></div>
      <div class="answer"><input type="text" name="q4:60_answer" value=""/></div>
    </div>`;
    const parsed = parseQuestion(4, html, 'tok');
    expect(parsed.type).toBe('shortanswer');
  });

  it('detects essay with max length', () => {
    const html = `<div class="que essay">
      <div class="qtext"><p>Discuss.</p></div>
      <textarea name="q5:70_answer" maxlength="500"></textarea>
      <input type="hidden" name="q5:70_answerformat" value="1"/>
    </div>`;
    const parsed = parseQuestion(5, html, 'tok');
    expect(parsed.type).toBe('essay');
    expect(parsed.max_length).toBe(500);
  });

  it('detects numerical with unit', () => {
    const html = `<div class="que numerical">
      <div class="qtext"><p>Distance?</p></div>
      <input type="text" name="q6:80_answer" value=""/>
      <select name="q6:80_unit"><option>m</option><option>km</option></select>
    </div>`;
    const parsed = parseQuestion(6, html, 'tok');
    expect(parsed.type).toBe('numerical');
    expect(parsed.number_unit_required).toBe(true);
  });

  it('detects match with sub_slots', () => {
    const html = `<div class="que match">
      <div class="qtext"><p>Pair them.</p></div>
      <table>
        <tr><td>Apple</td><td><select name="q7:90_sub1"><option value="0">--</option><option value="1">Fruit</option></select></td></tr>
        <tr><td>Carrot</td><td><select name="q7:90_sub2"><option value="0">--</option><option value="2">Vegetable</option></select></td></tr>
      </table>
    </div>`;
    const parsed = parseQuestion(7, html, 'tok');
    expect(parsed.type).toBe('match');
    expect(parsed.sub_slots).toEqual([
      { index: 1, prompt: 'Apple' },
      { index: 2, prompt: 'Carrot' },
    ]);
    expect(parsed.options).toEqual([
      { index: 0, text: '--', html: '--' },
      { index: 1, text: 'Fruit', html: 'Fruit' },
      { index: 2, text: 'Vegetable', html: 'Vegetable' },
    ]);
  });

  it('detects ddwtos drag-and-drop into text', () => {
    const html = `<div class="que ddwtos">
      <div class="qtext"><p>The cat sat on the [[1]].</p></div>
      <input type="hidden" name="q8:100_p1" value="0"/>
    </div>`;
    const parsed = parseQuestion(8, html, 'tok');
    expect(parsed.type).toBe('ddwtos');
  });

  it('marks unknown question types as unsupported', () => {
    const html = `<div class="que ddmarker"><p>Place the markers</p></div>`;
    const parsed = parseQuestion(9, html, 'tok');
    expect(parsed.type).toBe('unsupported');
  });

  it('rewrites pluginfile.php image URLs to include token', () => {
    const html = `<p>See <img src="https://m.test/pluginfile.php/1/mod_quiz/img.png" alt="diagram"/>.</p>`;
    const rewritten = rewriteImageUrls(html, 'tok');
    expect(rewritten).toContain('https://m.test/pluginfile.php/1/mod_quiz/img.png?token=tok');
  });

  it('does not double-append token when one already exists', () => {
    const once = rewriteImageUrls(`<img src="https://m.test/pluginfile.php/1/img.png"/>`, 'tok');
    const twice = rewriteImageUrls(once, 'tok');
    expect(twice).toBe(once);
  });

  it('extracts images from question HTML with auth-tokenised URLs', () => {
    const html = `<div class="que multichoice">
      <div class="qtext"><img src="https://m.test/pluginfile.php/2/mod_quiz/q.png" alt="chart"/></div>
      <div class="answer"><input type="radio" name="q1:1_answer" value="0"/></div>
    </div>`;
    const parsed = parseQuestion(1, html, 'tok');
    expect(parsed.images).toEqual([
      { src: 'https://m.test/pluginfile.php/2/mod_quiz/q.png?token=tok', alt: 'chart' },
    ]);
  });
});
