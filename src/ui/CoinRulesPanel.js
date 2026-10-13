
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
          <h2>Informationen</h2>

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

          <h3>Ziel des Spiels</h3>
            <p>
              Gespielt wird mit <strong>6 Würfeln</strong>.
              Ziel ist es, mindestens <strong>10.000 Punkte</strong>
              zu erreichen.
            </p>

            <p>
              Die Spieler sind nacheinander am Zug und versuchen,
              während ihres Zuges möglichst viele Punkte zu sammeln
              und rechtzeitig zu sichern.
            </p>

          <h3>Grundwertungen</h3>

            <p>
              Eine <strong>1</strong> zählt <strong>100 Punkte</strong>.
              Eine <strong>5</strong> zählt <strong>50 Punkte</strong>.
              Die Würfel <strong>2, 3, 4 und 6</strong> bringen einzeln keine Punkte.
            </p>

              <h3>Pasche</h3>

                  <p>
                    Bei <strong>drei gleichen Würfeln</strong> gilt normalerweise:
                    Augenzahl × 100. Drei 1en ergeben stattdessen
                    <strong>1.000 Punkte</strong>.
                  </p>

                  <p>
                    Bei <strong>vier gleichen Würfeln</strong> wird zum Wert des
                    Dreierpaschs zusätzlich Augenzahl × 50 addiert.
                    Vier 1en ergeben <strong>1.500 Punkte</strong>.
                  </p>

                  <p>
                    Bei <strong>fünf gleichen Würfeln</strong> wird zum Wert des
                    Viererpaschs zusätzlich Augenzahl × 100 addiert.
                    Fünf 1en ergeben <strong>2.500 Punkte</strong>.
                  </p>

                  <p>
                    Bei <strong>sechs gleichen Würfeln</strong> wird zum Wert des
                    Fünferpaschs zusätzlich Augenzahl × 150 addiert.
                    Sechs 1en ergeben <strong>10.000 Punkte und einen Sofortsieg</strong>.
                  </p>

                  <p>
                    <strong>Beispiel mit 3ern:</strong><br>
                    Drei 3en = 300 Punkte<br>
                    Vier 3en = 450 Punkte<br>
                    Fünf 3en = 750 Punkte<br>
                    Sechs 3en = 1.200 Punkte
                  </p>

                  <p>
                    <strong>Beispiel mit 3ern:</strong><br>
                    3 × 3 = 300 Punkte<br>
                    4 × 3 = 450 Punkte<br>
                    5 × 3 = 750 Punkte<br>
                    6 × 3 = 1.200 Punkte
                  </p>

                  <h3>Sonderregel: zwei 5er</h3>

                      <p>
                        Zwei einzeln gewertete <strong>5en</strong> ergeben
                        zusammen <strong>100 Punkte</strong>.
                      </p>

                      <p>
                        Dabei wird aber nur <strong>eine 5 herausgelegt</strong>.
                        Die zweite 5 bleibt aktiv und darf erneut gewürfelt werden.
                      </p>

                      <p>
                        Diese Wertung ist freiwillig, wenn gleichzeitig eine andere
                        gültige Kombination möglich ist.
                      </p>


                  <h3>Straßen</h3>

                        <p>
                          Eine <strong>kleine Straße</strong> besteht aus
                          <strong>1, 2, 3, 4, 5</strong> plus einem beliebigen weiteren Würfel
                          oder aus <strong>2, 3, 4, 5, 6</strong> plus einem beliebigen weiteren Würfel.
                          Sie zählt <strong>500 Punkte</strong>.
                        </p>

                        <p>
                          Eine <strong>große Straße</strong> besteht aus
                          <strong>1, 2, 3, 4, 5, 6</strong>
                          und zählt <strong>2.000 Punkte</strong>.
                        </p>

                  <h3>Du entscheidest, was du wertest</h3>

                      <p>
                        Ein Wurf kann mehrere gültige Wertungen enthalten.
                        Du entscheidest selbst, welche Kombination oder Teilmenge
                        du verwenden möchtest.
                      </p>

                      <p>
                        Die höchste mögliche Punktzahl muss
                        <strong>nicht</strong> automatisch gewählt werden.
                      </p>

                      <p>
                        <strong>Beispiel:</strong><br>
                        Wurf: 2, 3, 4, 5, 5, 6
                      </p>

                      <p>
                        Du kannst entweder die kleine Straße für
                        <strong>500 Punkte</strong> nehmen oder die beiden 5en
                        nach der Sonderregel für <strong>100 Punkte</strong> werten.
                      </p>

                  <h3>Würfel herauslegen</h3>

                      <p>
                        Nach einem erfolgreichen Wurf musst du mindestens
                        <strong>einen wertenden Würfel</strong> oder eine gültige
                        Kombination herauslegen.
                      </p>

                      <p>
                        Würfel ohne Wertung dürfen nicht herausgelegt werden.
                        Anschließend würfelst du mit den verbleibenden aktiven
                        Würfeln weiter.
                      </p>
                    </section>

                  <h3>Sonderfall: Straße mit bereits herausgelegten Würfeln</h3>

                      <p>
                        Hast du bereits eine <strong>1</strong> und/oder
                        <strong>5</strong> herausgelegt und bilden diese zusammen
                        mit deinem aktuellen Wurf eine kleine oder große Straße,
                        hast du eine zusätzliche Möglichkeit:
                      </p>

                      <ul>
                        <li>Du erhältst dafür <strong>0 zusätzliche Punkte</strong>.</li>
                        <li>Du legst keine weiteren Würfel heraus.</li>
                        <li>Du darfst alle aktuell aktiven Würfel erneut würfeln.</li>
                      </ul>

                      <p>
                        <strong>Beispiel:</strong><br>
                        Bereits draußen: 1<br>
                        Aktueller Wurf: 2, 3, 4, 5, 5
                      </p>

                      <p>
                        Zusammen wäre eine Straße 1, 2, 3, 4, 5 möglich.
                        Du darfst deshalb freiwillig alle
                        <strong>5 aktiven Würfel erneut würfeln</strong>.
                      </p>

                      <p>
                        Sind bereits 1 und 5 herausgelegt, werden entsprechend
                        nur die noch <strong>4 aktiven Würfel</strong> erneut gewürfelt.
                      </p>

                  <h3>Heiße Würfel</h3>

                      <p>
                        Hast du alle verfügbaren Würfel erfolgreich verwertet,
                        bekommst du wieder <strong>alle 6 Würfel</strong>.
                      </p>

                      <p>
                        Du musst anschließend weiterwürfeln.
                        Dein Zug endet dadurch nicht.
                      </p>

                      <p>
                        <strong>Wichtig:</strong>
                        Nach heißen Würfeln darfst du nicht sofort sichern.
                        Mit den neuen Würfeln musst du zuerst mindestens
                        <strong>einmal erfolgreich punkten</strong>.
                      </p>

                      <p>
                        Danach darfst du wieder sichern, sofern du die normale
                        Mindestpunktzahl erreicht hast.
                      </p>

                      <p>
                        Ausnahme:
                        <strong>Sechs 1en führen sofort zum Sieg.</strong>
                      </p>

                  <h3>Fehlwurf</h3>

                      <p>
                        Würfelst du keine verwertbare Wertung, endet dein Zug
                        <strong>sofort</strong>.
                      </p>

                      <p>
                        Alle Punkte, die du während dieses Zuges gesammelt,
                        aber noch nicht gesichert hast, gehen verloren.
                      </p>

                  <h3>Fehlwurf beim ersten Wurf</h3>

                      <p>
                        Würfelst du bereits beim
                        <strong>ersten Wurf deines Zuges</strong> keine Wertung,
                        gilt zusätzlich eine Strafe:
                      </p>

                      <p>
                        Deine <strong>zuletzt gesicherte Wertung</strong>
                        wird wieder von deinem Gesamtpunktestand abgezogen.
                      </p>

                      <p>
                        Dabei spielt es keine Rolle, wie viele Runden diese
                        Sicherung zurückliegt.
                      </p>

                      <p>
                        Hast du noch nie Punkte gesichert, kann entsprechend
                        nichts abgezogen werden.
                      </p>

                      <p>
                        <strong>Beispiel:</strong><br>
                        Letzte gesicherte Wertung: 2.000 Punkte<br>
                        Erster Wurf eines späteren Zuges: Fehlwurf<br>
                        → 2.000 Punkte werden wieder abgezogen.
                      </p>

                  <h3>Punkte sichern</h3>

                      <p>
                        Sobald du in deinem aktuellen Zug mindestens
                        <strong>350 Punkte</strong> gesammelt hast,
                        darfst du deine Punkte sichern.
                      </p>

                      <p>
                        Die Zugpunkte werden deinem Gesamtpunktestand
                        gutgeschrieben und dein Zug endet.
                        Danach ist der nächste Spieler an der Reihe.
                      </p>

                  <h3>10.000 Punkte und letzte Runde</h3>

                      <p>
                        Erreicht ein Spieler mindestens
                        <strong>10.000 Gesamtpunkte</strong>,
                        gewinnt er normalerweise noch nicht sofort.
                      </p>

                      <p>
                        Die anderen Spieler erhalten jeweils noch
                        <strong>einen letzten Zug</strong>.
                      </p>

                      <p>
                        Danach werden die Gesamtpunktestände verglichen.
                        Der Spieler mit den meisten Punkten gewinnt.
                      </p>

                  <h3>Sofortsieg: sechs 1en</h3>

                      <p>
                        Würfelst du in einem Wurf
                        <strong>sechs 1en</strong>, erhältst du
                        <strong>10.000 Punkte und gewinnst sofort</strong>.
                      </p>

                      <p>
                        In diesem Fall gibt es
                        <strong>keine Nachziehrunde</strong>.
                      </p>
                  
          <h3>Wie erhalte ich Goldmünzen?</h3>
          <p>
            Goldmünzen können ausschließlich im virtuellen Modus erhalten werden.
            Dabei muss ein Wert von mindestens 1000 Punkten in einem Zug gesichert werden.
            Werden mehr als 1000 Punkte erspielt und nicht gesichert, verfallen die Punkte und die Goldmünzen.
          </p>

          <h3>Wie viele Goldmünzen erhalte ich?</h3>

          <p>
            Die Höhe der Goldmünzen hängt davon ab, wie viele Punkte gesichert werden.
            Dabei gilt: Mehr Punkte, mehr Gold. 
            </p>
            <p> Bei >1000 Punkte: (Pkt*1)/10 = Anzahl der Münzen </p>
            <p> Ab 2000 Punkte: (Pkt*2)/10 = Anzahl der Münzen </p>
            <p>Ab 3000 Punkte: (Pkt*3)/10 = Anzahl der Münzen usw. </p>

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