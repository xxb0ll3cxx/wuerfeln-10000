export function mountSoundControl(
  screenElement,
  audioService,
) {
  const control = document.createElement('div');

  control.className = 'mode-select__sound-control';

  control.innerHTML = `
    <button
      type="button"
      class="mode-select__sound-toggle"
      aria-label="Lautstärkeregler öffnen"
      aria-expanded="false"
      aria-controls="mode-select-sound-panel"
    ></button>

    <div
      id="mode-select-sound-panel"
      class="mode-select__sound-panel"
      hidden
    >
      <label
        class="mode-select__sound-label"
        for="mode-select-sound-range"
      >
        Lautstärke:
        <output class="mode-select__sound-value">
          100 %
        </output>
      </label>

      <input
        id="mode-select-sound-range"
        class="mode-select__sound-range"
        type="range"
        min="0"
        max="100"
        step="1"
        value="100"
        aria-label="Gesamtlautstärke"
      />
    </div>
  `;

  screenElement.appendChild(control);

  const toggle = control.querySelector(
    '.mode-select__sound-toggle',
  );

  const panel = control.querySelector(
    '.mode-select__sound-panel',
  );

  const range = control.querySelector(
    '.mode-select__sound-range',
  );

  const valueLabel = control.querySelector(
    '.mode-select__sound-value',
  );

  // Bereits eingestellte Gesamtlautstärke anzeigen.
  const initialVolume = Math.round(
    audioService.masterVolume * 100,
  );

  range.value = String(initialVolume);
  valueLabel.textContent = `${initialVolume} %`;

  const handleToggle = () => {
    panel.hidden = !panel.hidden;

    const isOpen = !panel.hidden;

    toggle.setAttribute(
      'aria-expanded',
      String(isOpen),
    );

    toggle.setAttribute(
      'aria-label',
      isOpen
        ? 'Lautstärkeregler schließen'
        : 'Lautstärkeregler öffnen',
    );
  };

  const handleVolumeChange = () => {
    const percent = Number(range.value);

    valueLabel.textContent = `${percent} %`;

    audioService.setMasterVolume(
      percent / 100,
    );
  };

  toggle.addEventListener(
    'click',
    handleToggle,
  );

  range.addEventListener(
    'input',
    handleVolumeChange,
  );

  // Aufräumen beim Verlassen des Mode-Select-Screens.
  return () => {
    toggle.removeEventListener(
      'click',
      handleToggle,
    );

    range.removeEventListener(
      'input',
      handleVolumeChange,
    );

    control.remove();
  };
}