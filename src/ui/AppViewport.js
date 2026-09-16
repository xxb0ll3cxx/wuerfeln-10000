const VIEWPORTS =
  Object.freeze({
    landscape:
      Object.freeze({
        width: 1600,
        height: 900,
      }),

    portrait:
      Object.freeze({
        width: 900,
        height: 1600,
      }),
  });


export class AppViewport {
  constructor(
    stageElement,
  ) {
    if (
      !(
        stageElement instanceof
        HTMLElement
      )
    ) {
      throw new TypeError(
        'AppViewport benötigt ein gültiges Stage-Element.',
      );
    }

    this.stageElement =
      stageElement;

    this.handleResize =
      this.update.bind(
        this,
      );
  }


  mount() {
    this.update();

    window.addEventListener(
      'resize',
      this.handleResize,
    );

    window.addEventListener(
      'orientationchange',
      this.handleResize,
    );
  }


  update() {
    const orientation =
      window.innerHeight >
      window.innerWidth
        ? 'portrait'
        : 'landscape';

    const viewport =
      VIEWPORTS[
        orientation
      ];

    const scaleX =
      window.innerWidth /
      viewport.width;

    const scaleY =
      window.innerHeight /
      viewport.height;

    /*
     * Immer vollständig sichtbar.
     * Freie Fläche wird automatisch
     * zur schwarzen Letterbox.
     */
    const scale =
      Math.min(
        scaleX,
        scaleY,
      );


    this.stageElement
      .dataset
      .orientation =
      orientation;


    this.stageElement
      .style
      .width =
      `${viewport.width}px`;

    this.stageElement
      .style
      .height =
      `${viewport.height}px`;


    this.stageElement
      .style
      .setProperty(
        '--viewport-width',
        `${viewport.width}px`,
      );

    this.stageElement
      .style
      .setProperty(
        '--viewport-height',
        `${viewport.height}px`,
      );

    this.stageElement
      .style
      .setProperty(
        '--viewport-scale',
        String(scale),
      );
  }


  destroy() {
    window.removeEventListener(
      'resize',
      this.handleResize,
    );

    window.removeEventListener(
      'orientationchange',
      this.handleResize,
    );
  }
}