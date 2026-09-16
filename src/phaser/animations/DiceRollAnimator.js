export class DiceRollAnimator {
  constructor(scene, diceViews) {
    this.scene = scene;
    this.diceViews = diceViews;

    this.activeEvents = [];
  }

  async play(finalResults) {
  this.stop();

  const activeDiceViews =
    this.diceViews.slice(
      0,
      finalResults.length,
    );

  const animations =
    activeDiceViews.map(
      (
        diceView,
        index,
      ) =>
        this.#animateDie(
          diceView,
          finalResults[index],
          index,
        ),
    );

  await Promise.all(
    animations,
  );
}

  #animateDie(diceView, finalValue, index) {
    return new Promise((resolve) => {
      const spinEvent = this.scene.time.addEvent({
        delay: 65,
        loop: true,

        callback: () => {
          const temporaryValue =
            Math.floor(Math.random() * 6) + 1;

          diceView.setValue(temporaryValue);
        },
      });

      this.activeEvents.push(spinEvent);

      const stopDelay =
        1140 + index * 100;

      const stopEvent =
        this.scene.time.delayedCall(
          stopDelay,
          () => {
            spinEvent.remove();

            diceView.setValue(finalValue);

            resolve();
          },
        );

      this.activeEvents.push(stopEvent);
    });
  }

  stop() {
    for (const event of this.activeEvents) {
      event.remove();
    }

    this.activeEvents = [];
  }

  destroy() {
    this.stop();
  }
}