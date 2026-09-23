
export const DICE_SKINS = Object.freeze({
  dice_gold: Object.freeze({
    id: 'dice_gold',
    name: 'Goldwürfel',
    portrait: new URL('../assets/dice/skins/gold/golden_dice_prev.png', import.meta.url,).href,

    faces: Object.freeze({
      1: {
        key: 'dice-gold-one',
        url: new URL('../assets/dice/skins/gold/golden_dice1.png',import.meta.url,).href,
      },

      2: {
        key: 'dice-gold-two',
        url: new URL('../assets/dice/skins/gold/golden_dice2.png',import.meta.url,).href,
      },

      3: {
        key: 'dice-gold-three',
        url: new URL('../assets/dice/skins/gold/golden_dice3.png',import.meta.url,).href,
      },

      4: {
        key: 'dice-gold-four',
        url: new URL('../assets/dice/skins/gold/golden_dice4.png',import.meta.url,).href,
      },

      5: {
        key: 'dice-gold-five',
        url: new URL('../assets/dice/skins/gold/golden_dice5.png',import.meta.url,).href,
      },

      6: {
        key: 'dice-gold-six',
        url: new URL('../assets/dice/skins/gold/golden_dice6.png',import.meta.url,).href,
      },
    }),
  }),
  dice_flame: Object.freeze({
      id: 'dice_flame',
      name: 'Flammenwürfel',
      portrait: new URL('../assets/dice/skins/flame/flame_dice_prev.webp',import.meta.url,).href,

      faces: Object.freeze({
        1: {
          key: 'dice-flame-one',
          url: new URL('../assets/dice/skins/flame/flame_dice1.png',import.meta.url,).href,
        },

        2: {
          key: 'dice-flame-two',
          url: new URL('../assets/dice/skins/flame/flame_dice2.png',import.meta.url,).href,
        },

        3: {
          key: 'dice-flame-three',
          url: new URL('../assets/dice/skins/flame/flame_dice3.png',import.meta.url,).href,
        },

        4: {
          key: 'dice-flame-four',
          url: new URL('../assets/dice/skins/flame/flame_dice4.png',import.meta.url,).href,
        },

        5: {
          key: 'dice-flame-five',
          url: new URL('../assets/dice/skins/flame/flame_dice5.png',import.meta.url,).href,
        },

        6: {
          key: 'dice-flame-six',
          url: new URL('../assets/dice/skins/flame/flame_dice6.png',import.meta.url,).href,
        },
      }),
    }),

    dice_frost: Object.freeze({
          id: 'dice_frost',
          name: 'Frostwürfel',
          portrait: new URL('../assets/dice/skins/frost/frost_dice_prev.webp',import.meta.url,).href,
          faces: Object.freeze({
            1: {
              key: 'dice-frost-one',
              url: new URL('../assets/dice/skins/frost/frost_dice1.png',import.meta.url,).href,
            },

            2: {
              key: 'dice-frost-two',
              url: new URL('../assets/dice/skins/frost/frost_dice2.png',import.meta.url,).href,
            },

            3: {
              key: 'dice-frost-three',
              url: new URL('../assets/dice/skins/frost/frost_dice3.png',import.meta.url,).href,
            },

            4: {
              key: 'dice-frost-four',
              url: new URL('../assets/dice/skins/frost/frost_dice4.png',import.meta.url,).href,
            },

            5: {
              key: 'dice-frost-five',
              url: new URL('../assets/dice/skins/frost/frost_dice5.png',import.meta.url,).href,
            },

            6: {
              key: 'dice-frost-six',
              url: new URL('../assets/dice/skins/frost/frost_dice6.png',import.meta.url,).href,
            },
          }),
        }),
  dice_galaxy: Object.freeze({
            id: 'dice_galaxy',
            name: 'Galaxywürfel',
            portrait: new URL('../assets/dice/skins/galaxy/galaxy_dice_prev.webp',import.meta.url,).href,

            faces: Object.freeze({
              1: {
                key: 'dice-galaxy-one',
                url: new URL('../assets/dice/skins/galaxy/galaxy_dice1.png',import.meta.url,).href,
              },

              2: {
                key: 'dice-galaxy-two',
                url: new URL('../assets/dice/skins/galaxy/galaxy_dice2.png',import.meta.url,).href,
              },

              3: {
                key: 'dice-galaxy-three',
                url: new URL('../assets/dice/skins/galaxy/galaxy_dice3.png',import.meta.url,).href,
              },

              4: {
                key: 'dice-galaxy-four',
                url: new URL('../assets/dice/skins/galaxy/galaxy_dice4.png',import.meta.url,).href,
              },

              5: {
                key: 'dice-galaxy-five',
                url: new URL('../assets/dice/skins/galaxy/galaxy_dice5.png',import.meta.url,).href,
              },

              6: {
                key: 'dice-galaxy-six',
                url: new URL('../assets/dice/skins/galaxy/galaxy_dice6.png',import.meta.url,).href,
              },
            }),
          }),
  dice_rainbow: Object.freeze({
              id: 'dice_rainbow',
              name: 'Prismawürfel',
              portrait: new URL('../assets/dice/skins/rainbow/rainbow_dice_prev.webp',import.meta.url,).href,

              faces: Object.freeze({
                1: {
                  key: 'dice-rainbow-one',
                  url: new URL('../assets/dice/skins/rainbow/rainbow_dice1.png',import.meta.url,).href,
                },

                2: {
                  key: 'dice-rainbow-two',
                  url: new URL('../assets/dice/skins/rainbow/rainbow_dice2.png',import.meta.url,).href,
                },

                3: {
                  key: 'dice-rainbow-three',
                  url: new URL('../assets/dice/skins/rainbow/rainbow_dice3.png',import.meta.url,).href,
                },

                4: {
                  key: 'dice-rainbow-four',
                  url: new URL('../assets/dice/skins/rainbow/rainbow_dice4.png',import.meta.url,).href,
                },

                5: {
                  key: 'dice-rainbow-five',
                  url: new URL('../assets/dice/skins/rainbow/rainbow_dice5.png',import.meta.url,).href,
                },

                6: {
                  key: 'dice-rainbow-six',
                  url: new URL('../assets/dice/skins/rainbow/rainbow_dice6.png',import.meta.url,).href,
                },
              }),
            }),
  dice_shadow: Object.freeze({
                id: 'dice_shadow',
                name: 'Schattenwürfel',
                portrait: new URL('../assets/dice/skins/shadow/shadow_dice_prev.webp',import.meta.url,).href,

                faces: Object.freeze({
                  1: {
                    key: 'dice-shadow-one',
                    url: new URL('../assets/dice/skins/shadow/shadow_dice1.png',import.meta.url,).href,
                  },

                  2: {
                    key: 'dice-shadow-two',
                    url: new URL('../assets/dice/skins/shadow/shadow_dice2.png',import.meta.url,).href,
                  },

                  3: {
                    key: 'dice-shadow-three',
                    url: new URL('../assets/dice/skins/shadow/shadow_dice3.png',import.meta.url,).href,
                  },

                  4: {
                    key: 'dice-shadow-four',
                    url: new URL('../assets/dice/skins/shadow/shadow_dice4.png',import.meta.url,).href,
                  },

                  5: {
                    key: 'dice-shadow-five',
                    url: new URL('../assets/dice/skins/shadow/shadow_dice5.png',import.meta.url,).href,
                  },

                  6: {
                    key: 'dice-shadow-six',
                    url: new URL('../assets/dice/skins/shadow/shadow_dice6.png',import.meta.url,).href,
                  },
                }),
              }),
  dice_toy: Object.freeze({
                id: 'dice_toy',
                name: 'Spielzeugwürfel',
                portrait: new URL('../assets/dice/skins/toy/toy_dice_prev.webp',import.meta.url,).href,

                faces: Object.freeze({
                  1: {
                    key: 'dice-toy-one',
                    url: new URL('../assets/dice/skins/toy/toy_dice1.png',import.meta.url,).href,
                  },

                  2: {
                    key: 'dice-toy-two',
                    url: new URL('../assets/dice/skins/toy/toy_dice2.png',import.meta.url,).href,
                  },

                  3: {
                    key: 'dice-toy-three',
                    url: new URL('../assets/dice/skins/toy/toy_dice3.png',import.meta.url,).href,
                  },

                  4: {
                    key: 'dice-toy-four',
                    url: new URL('../assets/dice/skins/toy/toy_dice4.png',import.meta.url,).href,
                  },

                  5: {
                    key: 'dice-toy-five',
                    url: new URL('../assets/dice/skins/toy/toy_dice5.png',import.meta.url,).href,
                  },

                  6: {
                    key: 'dice-toy-six',
                    url: new URL('../assets/dice/skins/toy/toy_dice6.png',import.meta.url,).href,
                  },
                }),
              }),
  dice_wood: Object.freeze({
                id: 'dice_wood',
                name: 'Holzwürfel',
                portrait: new URL('../assets/dice/skins/wood/wood_dice_prev.webp',import.meta.url,).href,

                faces: Object.freeze({
                  1: {
                    key: 'dice-wood-one',
                    url: new URL('../assets/dice/skins/wood/wood_dice1.png',import.meta.url,).href,
                  },

                  2: {
                    key: 'dice-wood-two',
                    url: new URL('../assets/dice/skins/wood/wood_dice2.png',import.meta.url,).href,
                  },

                  3: {
                    key: 'dice-wood-three',
                    url: new URL('../assets/dice/skins/wood/wood_dice3.png',import.meta.url,).href,
                  },

                  4: {
                    key: 'dice-wood-four',
                    url: new URL('../assets/dice/skins/wood/wood_dice4.png',import.meta.url,).href,
                  },

                  5: {
                    key: 'dice-wood-five',
                    url: new URL('../assets/dice/skins/wood/wood_dice5.png',import.meta.url,).href,
                  },

                  6: {
                    key: 'dice-wood-six',
                    url: new URL('../assets/dice/skins/wood/wood_dice6.png',import.meta.url,).href,
                  },
                }),
              }),
});

export function getDiceSkinById(skinId) {
  if (typeof skinId !== 'string') {
    return null;
  }

  return DICE_SKINS[skinId] ?? null;
}