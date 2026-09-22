
export class CoinRulesPanel {
  constructor() {
    this.hostElement = null;
    this.triggerButton = null;
    this.panelElement = null;
    this.closeButton = null;
    this.isOpen = false;
  }

  mount(rootElement) {
    this.hostElement = document.createElement('div');

    this.hostElement.className = 'coin-rules-widget';

    this.hostElement.innerHTML = `
      <button
        type="button"
        class="coin-rules-trigger"
        data-coin-rules-action="toggle"
        aria-controls="coin-rules-panel"
        aria-expanded="false"
      >
        Coin-Regeln
      </button>

      <aside
        id="coin-rules-panel"
        class="coin-rules-panel"
        aria-label="Coin-Regeln"
        aria-hidden="true"
      >
        <header class="coin-rules-panel__header">
          <h2>Gold-Regeln</h2>

          <button
            type="button"
            class="coin-rules-panel__close"
            data-coin-rules-action="close"
            aria-label="Coin-Regeln schließen"
          >
            ×
          </button>
        </header>

        <div class="coin-rules-panel__content">

          <h3>Wie erhalte ich Goldmünzen?</h3>

          <p>
            Goldmünzen können ausschließlich im virtuellen Modus erhalten werden.
            Dabei muss ein Wert von mindestens 1000 Punkten in einem Zug gesichert werden.
            Werden mehr als 1000 Punkte erspielt und nicht gesichert, verfallen die Punkte und die Goldmünzen.
          </p>

          <h3>Wie viele Goldmünzen erhalte ich?</h3>

          <p>
            Die Höhe der Goldmünzen hängt davon ab, wie viele Punkte gesichert werden.
            Dabei gilt: Mehr Punkt, mehr Gold.
            Bei >1000 Punkte: (Pkt*1)/10 = Anzahl der Münzen
            Ab 2000 Punkte: (Pkt*2)/10 = Anzahl der Münzen
            Ab 3000 Punkte: (Pkt*3)/10 = Anzahl der Münzen usw.
          </p>

          <h3>Wofür kann ich Goldmünzen verwenden?</h3>

          <p>
            Mit Goldmünzen können Skins im Shop erworben werden!
          </p>

        </div>
      </aside>
    `;

    rootElement.append(this.hostElement);

    this.triggerButton =
      this.hostElement.querySelector(
        '[data-coin-rules-action="toggle"]',
      );

    this.panelElement =
      this.hostElement.querySelector(
        '#coin-rules-panel',
      );

    this.closeButton =
      this.hostElement.querySelector(
        '[data-coin-rules-action="close"]',
      );

    // Geschlossenes Fenster ist nicht fokussierbar.
    this.panelElement.inert = true;

    this.handleToggle = () => {
      this.setOpen(!this.isOpen);
    };

    this.handleClose = () => {
      this.setOpen(false);
      this.triggerButton.focus();
    };

    this.triggerButton.addEventListener(
      'click',
      this.handleToggle,
    );

    this.closeButton.addEventListener(
      'click',
      this.handleClose,
    );
  }

  setOpen(isOpen) {
    this.isOpen = isOpen;

    this.panelElement.classList.toggle(
      'coin-rules-panel--open',
      isOpen,
    );

    this.panelElement.setAttribute(
      'aria-hidden',
      String(!isOpen),
    );

    this.panelElement.inert = !isOpen;

    this.triggerButton.setAttribute(
      'aria-expanded',
      String(isOpen),
    );
  }

  destroy() {
    this.triggerButton?.removeEventListener(
      'click',
      this.handleToggle,
    );

    this.closeButton?.removeEventListener(
      'click',
      this.handleClose,
    );

    this.hostElement?.remove();

    this.hostElement = null;
    this.triggerButton = null;
    this.panelElement = null;
    this.closeButton = null;

    this.isOpen = false;
  }
}