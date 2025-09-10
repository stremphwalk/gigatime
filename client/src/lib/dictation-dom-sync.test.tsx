// @vitest-environment jsdom
import React, { useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { describe, it, expect } from 'vitest';
import { act } from 'react-dom/test-utils';

function ControlledTextarea({ id, initial }: { id: string; initial: string }) {
  const [value, setValue] = useState(initial);
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      data-testid={id}
    />
  );
}

function nativeSetValue(el: HTMLTextAreaElement, value: string) {
  const proto = HTMLTextAreaElement.prototype as any;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(el, value);
  else (el as any).value = value;
}

describe('Dictation DOM sync with React controlled inputs', () => {
  it('programmatic InputEvent updates controlled textarea, persists across typing in another field', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOM.createRoot(container);

    await act(async () => {
      root.render(
        <div>
          <ControlledTextarea id="taA" initial="A" />
          <ControlledTextarea id="taB" initial="B" />
        </div>
      );
    });

    const taA = document.getElementById('taA') as HTMLTextAreaElement;
    const taB = document.getElementById('taB') as HTMLTextAreaElement;
    expect(taA.value).toBe('A');
    expect(taB.value).toBe('B');

    // Simulate dictation inserting into A via native setter + InputEvent
    await act(async () => {
      nativeSetValue(taA, taA.value + ' hello');
      taA.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: ' hello', inputType: 'insertText' } as any));
    });
    expect(taA.value).toBe('A hello');

    // Type in another field (B)
    await act(async () => {
      nativeSetValue(taB, taB.value + ' X');
      taB.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: ' X', inputType: 'insertText' } as any));
    });

    // Ensure A's update persisted (was not reverted by a React re-render)
    expect(taA.value).toBe('A hello');
  });

  it('dispatching InputEvent on contenteditable triggers onChange in RichTextEditor', async () => {
    function CEWrapper() {
      const [value, setValue] = useState('');
      const ref = useRef<HTMLDivElement>(null);
      const onInput = useCallback(() => {
        setValue(ref.current?.textContent || '');
      }, []);
      return (
        <>
          <div ref={ref} contentEditable onInput={onInput} data-testid="ce" />
          <div data-testid="mirror">{value}</div>
        </>
      );
    }

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOM.createRoot(container);

    await act(async () => { root.render(<CEWrapper />); });

    const editor = container.querySelector('[data-testid="ce"]') as HTMLDivElement;
    const mirror = container.querySelector('[data-testid="mirror"]') as HTMLDivElement;
    expect(editor).toBeTruthy();

    await act(async () => {
      editor.textContent = 'abc';
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true } as any));
    });

    expect(mirror.textContent).toBe('abc');
  });
});


