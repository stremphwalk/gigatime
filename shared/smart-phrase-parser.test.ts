import { describe, it, expect } from 'vitest';
import { parseSmartPhraseContent, validateParsedPhrase, reconstructPhraseWithSelections } from './smart-phrase-parser';

describe('smart-phrase-parser', () => {
  it('parses content with no tokens', () => {
    const content = 'Plain sentence without tokens.';
    const parsed = parseSmartPhraseContent(content);
    expect(parsed.template).toBe(content);
    expect(parsed.slots.length).toBe(0);
    expect(parsed.staticParts.join('')).toContain('Plain sentence');
  });

  it('parses simple slash options as single-select', () => {
    const content = 'Patient started /amoxicillin/azithromycin/ceftriaxone/ today.';
    const parsed = parseSmartPhraseContent(content);
    const slot = parsed.slots.find(s => s.placeholder === '/amoxicillin/azithromycin/ceftriaxone/');
    expect(slot).toBeTruthy();
    expect(slot!.type).toBe('single-select');
    expect(slot!.options!.length).toBe(3);
    expect(slot!.options![0].label).toBe('amoxicillin');
  });

  it('parses nested slash options into hierarchical structure', () => {
    const content = 'Start /Antibiotics>Penicillin>Amoxicillin/Antibiotics>Macrolide>Azithromycin/';
    const parsed = parseSmartPhraseContent(content);
    const slot = parsed.slots[0];
    expect(slot.type).toBe('nested');
    expect(slot.options).toBeTruthy();
    const root = slot.options!;
    const antibiotics = root.find(o => o.label === 'Antibiotics');
    expect(antibiotics).toBeTruthy();
    expect(antibiotics!.children!.length).toBeGreaterThan(0);
    const penicillin = antibiotics!.children!.find(o => o.label === 'Penicillin');
    const macrolide = antibiotics!.children!.find(o => o.label === 'Macrolide');
    expect(penicillin).toBeTruthy();
    expect(macrolide).toBeTruthy();
  });

  it('parses {placeholder} as text slot', () => {
    const content = 'Diagnosis: {diagnosis}.';
    const parsed = parseSmartPhraseContent(content);
    const slot = parsed.slots[0];
    expect(slot.type).toBe('text');
    expect(slot.placeholder).toBe('{diagnosis}');
    expect(slot.label).toBe('diagnosis');
  });

  it('parses {date} as date slot', () => {
    const content = 'Follow-up on {date}.';
    const parsed = parseSmartPhraseContent(content);
    const slot = parsed.slots[0];
    expect(slot.type).toBe('date');
    expect(slot.placeholder).toBe('{date}');
  });

  it('validates parsed phrase successfully', () => {
    const content = 'Start /amoxicillin/azithromycin/ on {date} for {diagnosis}.';
    const parsed = parseSmartPhraseContent(content);
    const { valid, errors } = validateParsedPhrase(parsed);
    expect(valid).toBe(true);
    expect(errors.length).toBe(0);
  });

  it('reconstructs content with selections', () => {
    const content = 'Start /amoxicillin/azithromycin/ on {date}.';
    const parsed = parseSmartPhraseContent(content);
    const optionSlot = parsed.slots.find(s => s.type === 'single-select' || s.type === 'nested')!;
    const dateSlot = parsed.slots.find(s => s.type === 'date')!;

    const out = reconstructPhraseWithSelections(parsed, {
      [optionSlot.id]: 'amoxicillin',
      [dateSlot.id]: '2025-09-09'
    });

    expect(out).toContain('Start amoxicillin on 2025-09-09');
  });

  it('reconstructs nested selection using leaf value', () => {
    const content = 'Select /A>B>C/A>D/ now.';
    const parsed = parseSmartPhraseContent(content);
    const nestedSlot = parsed.slots.find(s => s.type === 'nested')!;
    const out = reconstructPhraseWithSelections(parsed, { [nestedSlot.id]: 'C' });
    expect(out).toContain('Select C now.');
  });
});

