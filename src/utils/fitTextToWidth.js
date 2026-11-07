
export function fitTextToWidth(
  element,
  maxTextWidth,
  minFontSize = 12,
) {
  if (!element) return;

  element.style.removeProperty('font-size');

  const style = getComputedStyle(element);
  const originalSize = parseFloat(style.fontSize);

  if (!Number.isFinite(originalSize)) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return;

  const text = element.textContent || '';
  const spacing = parseFloat(style.letterSpacing) || 0;

  let size = originalSize;

  while (size > minFontSize) {
    ctx.font =
      `${style.fontStyle} ${style.fontWeight} ` +
      `${size}px ${style.fontFamily}`;

    const width =
      ctx.measureText(text).width +
      Math.max(0, text.length - 1) * spacing;

    if (width <= maxTextWidth) break;

    size = Math.max(minFontSize, size - 0.5);
  }

  element.style.fontSize = `${size}px`;
}
