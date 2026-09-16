import {
  PROBABILITY_SCENARIOS,
} from '../core/probability/probabilityRules.js';

export class ProbabilityPanel {
  constructor({
    calculator,
    getSuggestedDiceCount = null,
  }) {
    this.calculator =
      calculator;

    this.getSuggestedDiceCount =
      getSuggestedDiceCount;

    this.rootElement =
      null;

    this.hostElement =
      null;

    this.isOpen =
      false;
  }

  mount(
    rootElement,
  ) {
    this.rootElement =
      rootElement;

    this.hostElement =
      document.createElement(
        'div',
      );

    this.hostElement.className =
      'probability-widget';

    this.hostElement.innerHTML = `
      <button
        type="button"
        class="probability-trigger"
        data-probability-action="toggle"
        aria-expanded="false"
      >
        Wahrscheinlichkeit
      </button>

      <aside
        class="probability-panel"
        data-probability-panel
        aria-hidden="true"
      >
        <header class="probability-panel__header">
          <div>
            <span class="probability-panel__eyebrow">
              Würfeln 10.000
            </span>

            <h2>
              Wahrscheinlichkeit
            </h2>
          </div>

          <button
            type="button"
            class="probability-panel__close"
            data-probability-action="close"
            aria-label="Wahrscheinlichkeit schließen"
          >
            ×
          </button>
        </header>

        <div class="probability-panel__form">
          <label>
            <span>
              Verfügbare Würfel
            </span>

            <select
              data-probability-dice-count
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6" selected>6</option>
            </select>
          </label>

          <label>
            <span>
              Szenario
            </span>

            <select
              data-probability-scenario
            >
              <option
                value="${PROBABILITY_SCENARIOS.ANY_SCORE}"
              >
                Mindestens eine direkte Wertung
              </option>

              <option
                value="${PROBABILITY_SCENARIOS.ANY_KIND}"
              >
                Mindestens N gleiche Würfel
              </option>

              <option
                value="${PROBABILITY_SCENARIOS.SPECIFIC_KIND}"
              >
                Mindestens N × bestimmte Zahl
              </option>

              <option
                value="${PROBABILITY_SCENARIOS.SMALL_STRAIGHT}"
              >
                Mindestens kleine Straße
              </option>

              <option
                value="${PROBABILITY_SCENARIOS.LARGE_STRAIGHT}"
              >
                Große Straße
              </option>
            </select>
          </label>

          <label
            data-probability-kind-field
            hidden
          >
            <span>
              Anzahl gleiche Würfel
            </span>

            <select
              data-probability-kind-count
            >
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
            </select>
          </label>

          <label
            data-probability-face-field
            hidden
          >
            <span>
              Augenzahl
            </span>

            <select
              data-probability-face
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
            </select>
          </label>

          <button
            type="button"
            class="game-button game-button--primary"
            data-probability-action="calculate"
          >
            BERECHNEN
          </button>
        </div>

        <section class="probability-result">
          <span>
            Wahrscheinlichkeit
          </span>

          <strong
            data-probability-result
          >
            –
          </strong>

          <p
            data-probability-details
          >
            Wähle ein Szenario und berechne die Chance.
          </p>
        </section>
      </aside>
    `;

    rootElement.append(
      this.hostElement,
    );

    this.triggerButton =
      this.hostElement.querySelector(
        '[data-probability-action="toggle"]',
      );

    this.closeButton =
      this.hostElement.querySelector(
        '[data-probability-action="close"]',
      );

    this.calculateButton =
      this.hostElement.querySelector(
        '[data-probability-action="calculate"]',
      );

    this.panelElement =
      this.hostElement.querySelector(
        '[data-probability-panel]',
      );

    this.diceCountElement =
      this.hostElement.querySelector(
        '[data-probability-dice-count]',
      );

    this.scenarioElement =
      this.hostElement.querySelector(
        '[data-probability-scenario]',
      );

    this.kindCountElement =
      this.hostElement.querySelector(
        '[data-probability-kind-count]',
      );

    this.faceElement =
      this.hostElement.querySelector(
        '[data-probability-face]',
      );

    this.kindField =
      this.hostElement.querySelector(
        '[data-probability-kind-field]',
      );

    this.faceField =
      this.hostElement.querySelector(
        '[data-probability-face-field]',
      );

    this.resultElement =
      this.hostElement.querySelector(
        '[data-probability-result]',
      );

    this.detailsElement =
      this.hostElement.querySelector(
        '[data-probability-details]',
      );

    this.handleToggle =
      () => {
        this.#setOpen(
          !this.isOpen,
        );
      };

    this.handleClose =
      () => {
        this.#setOpen(
          false,
        );
      };

    this.handleCalculate =
      () => {
        this.#calculate();
      };

    this.handleScenarioChange =
      () => {
        this.#syncScenarioFields();
      };

    this.triggerButton
      .addEventListener(
        'click',
        this.handleToggle,
      );

    this.closeButton
      .addEventListener(
        'click',
        this.handleClose,
      );

    this.calculateButton
      .addEventListener(
        'click',
        this.handleCalculate,
      );

    this.scenarioElement
      .addEventListener(
        'change',
        this.handleScenarioChange,
      );

    this.#syncScenarioFields();
  }

  #setOpen(
    isOpen,
  ) {
    this.isOpen =
      isOpen;

    if (
      isOpen &&
      typeof this
        .getSuggestedDiceCount ===
        'function'
    ) {
      const suggestedCount =
        this.getSuggestedDiceCount();

      if (
        Number.isInteger(
          suggestedCount,
        ) &&
        suggestedCount >= 1 &&
        suggestedCount <= 6
      ) {
        this.diceCountElement.value =
          String(
            suggestedCount,
          );
      }
    }

    this.panelElement
      .classList.toggle(
        'probability-panel--open',
        isOpen,
      );

    this.panelElement
      .setAttribute(
        'aria-hidden',
        String(
          !isOpen,
        ),
      );

    this.triggerButton
      .setAttribute(
        'aria-expanded',
        String(
          isOpen,
        ),
      );
  }

  #syncScenarioFields() {
    const scenario =
      this.scenarioElement.value;

    const needsKindCount =
      scenario ===
        PROBABILITY_SCENARIOS.ANY_KIND ||
      scenario ===
        PROBABILITY_SCENARIOS.SPECIFIC_KIND;

    const needsFace =
      scenario ===
      PROBABILITY_SCENARIOS.SPECIFIC_KIND;

    this.kindField.hidden =
      !needsKindCount;

    this.faceField.hidden =
      !needsFace;
  }

  #calculate() {
    try {
      const diceCount =
        Number(
          this.diceCountElement.value,
        );

      const scenario =
        this.scenarioElement.value;

      const kindCount =
        Number(
          this.kindCountElement.value,
        );

      const face =
        Number(
          this.faceElement.value,
        );

      const result =
        this.calculator.calculate({
          diceCount,

          scenario,

          kindCount,

          face,
        });

      this.resultElement.textContent =
        `${this.#formatPercentage(
          result.percentage,
        )} %`;

      this.detailsElement.textContent =
        `${result.favorableOutcomes.toLocaleString('de-DE')} ` +
        `von ${result.totalOutcomes.toLocaleString('de-DE')} ` +
        `gleichwahrscheinlichen Würfelergebnissen.`;
    } catch (error) {
      this.resultElement.textContent =
        '–';

      this.detailsElement.textContent =
        error instanceof Error
          ? error.message
          : 'Die Wahrscheinlichkeit konnte nicht berechnet werden.';
    }
  }

  #formatPercentage(
    percentage,
  ) {
    return percentage
      .toLocaleString(
        'de-DE',
        {
          minimumFractionDigits:
            2,

          maximumFractionDigits:
            4,
        },
      );
  }

  destroy() {
    this.triggerButton
      ?.removeEventListener(
        'click',
        this.handleToggle,
      );

    this.closeButton
      ?.removeEventListener(
        'click',
        this.handleClose,
      );

    this.calculateButton
      ?.removeEventListener(
        'click',
        this.handleCalculate,
      );

    this.scenarioElement
      ?.removeEventListener(
        'change',
        this.handleScenarioChange,
      );

    this.hostElement
      ?.remove();

    this.hostElement =
      null;

    this.rootElement =
      null;
  }
}