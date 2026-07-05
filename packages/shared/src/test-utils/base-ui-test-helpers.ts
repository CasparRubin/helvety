import { fireEvent, type Screen } from "@testing-library/react";

/**
 * Opens a Base UI menu trigger in jsdom.
 * Base UI dropdown/popover triggers often need pointerdown + click (click alone is flaky).
 */
export function openMenuTrigger(element: Element): void {
  fireEvent.pointerDown(element);
  fireEvent.click(element);
}

/**
 * Queries a Base UI Slider's hidden range input by its aria-label.
 * Base UI exposes role="group" on the root; the interactive control is `input[type="range"]`.
 */
export function getRangeInputByLabel(
  screen: Screen,
  label: string | RegExp
): HTMLElement {
  return screen.getByLabelText(label, { selector: 'input[type="range"]' });
}
