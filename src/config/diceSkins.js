const assetUrl = (path) =>
  new URL(path, import.meta.url).href;

export const DICE_SKINS = Object.freeze({
  dice_gold: Object.freeze({
    id: 'dice_gold',
    name: 'Goldwürfel',
    portrait: assetUrl('../assets/dice/skins/gold/golden_dice_prev.png'),

    faces: Object.freeze({
      1: {
        key: 'dice-gold-one',
        url: assetUrl('../assets/dice/skins/gold/golden_dice1.png'),
      },

      2: {
        key: 'dice-gold-two',
        url: assetUrl('../assets/dice/skins/gold/golden_dice2.png'),
      },

      3: {
        key: 'dice-gold-three',
        url: assetUrl('../assets/dice/skins/gold/golden_dice3.png'),
      },

      4: {
        key: 'dice-gold-four',
        url: assetUrl('../assets/dice/skins/gold/golden_dice4.png'),
      },

      5: {
        key: 'dice-gold-five',
        url: assetUrl('../assets/dice/skins/gold/golden_dice5.png'),
      },

      6: {
        key: 'dice-gold-six',
        url: assetUrl('../assets/dice/skins/gold/golden_dice6.png'),
      },
    }),
  }),
  dice_flame: Object.freeze({
      id: 'dice_flame',
      name: 'Flammenwürfel',
      portrait: assetUrl('../assets/dice/skins/flame/flame_dice_prev.png'),

      faces: Object.freeze({
        1: {
          key: 'dice-flame-one',
          url: assetUrl('../assets/dice/skins/flame/flame_dice1.png'),
        },

        2: {
          key: 'dice-flame-two',
          url: assetUrl('../assets/dice/skins/flame/flame_dice2.png'),
        },

        3: {
          key: 'dice-flame-three',
          url: assetUrl('../assets/dice/skins/flame/flame_dice3.png'),
        },

        4: {
          key: 'dice-flame-four',
          url: assetUrl('../assets/dice/skins/flame/flame_dice4.png'),
        },

        5: {
          key: 'dice-flame-five',
          url: assetUrl('../assets/dice/skins/flame/flame_dice5.png'),
        },

        6: {
          key: 'dice-flame-six',
          url: assetUrl('../assets/dice/skins/flame/flame_dice6.png'),
        },
      }),
    }),

    dice_frost: Object.freeze({
          id: 'dice_frost',
          name: 'Frostwürfel',
          portrait: assetUrl('../assets/dice/skins/frost/frost_dice_prev.png'),

          faces: Object.freeze({
            1: {
              key: 'dice-frost-one',
              url: assetUrl('../assets/dice/skins/frost/frost_dice1.png'),
            },

            2: {
              key: 'dice-frost-two',
              url: assetUrl('../assets/dice/skins/frost/frost_dice2.png'),
            },

            3: {
              key: 'dice-frost-three',
              url: assetUrl('../assets/dice/skins/frost/frost_dice3.png'),
            },

            4: {
              key: 'dice-frost-four',
              url: assetUrl('../assets/dice/skins/frost/frost_dice4.png'),
            },

            5: {
              key: 'dice-frost-five',
              url: assetUrl('../assets/dice/skins/frost/frost_dice5.png'),
            },

            6: {
              key: 'dice-frost-six',
              url: assetUrl('../assets/dice/skins/frost/frost_dice6.png'),
            },
          }),
        }),
  dice_galaxy: Object.freeze({
            id: 'dice_galaxy',
            name: 'Galaxywürfel',
            portrait: assetUrl('../assets/dice/skins/galaxy/galaxy_dice_prev.png'),

            faces: Object.freeze({
              1: {
                key: 'dice-galaxy-one',
                url: assetUrl('../assets/dice/skins/galaxy/galaxy_dice1.png'),
              },

              2: {
                key: 'dice-galaxy-two',
                url: assetUrl('../assets/dice/skins/galaxy/galaxy_dice2.png'),
              },

              3: {
                key: 'dice-galaxy-three',
                url: assetUrl('../assets/dice/skins/galaxy/galaxy_dice3.png'),
              },

              4: {
                key: 'dice-galaxy-four',
                url: assetUrl('../assets/dice/skins/galaxy/galaxy_dice4.png'),
              },

              5: {
                key: 'dice-galaxy-five',
                url: assetUrl('../assets/dice/skins/galaxy/galaxy_dice5.png'),
              },

              6: {
                key: 'dice-galaxy-six',
                url: assetUrl('../assets/dice/skins/galaxy/galaxy_dice6.png'),
              },
            }),
          }),
  dice_rainbow: Object.freeze({
              id: 'dice_rainbow',
              name: 'Prismawürfel',
              portrait: assetUrl('../assets/dice/skins/rainbow/rainbow_dice_prev.png'),

              faces: Object.freeze({
                1: {
                  key: 'dice-rainbow-one',
                  url: assetUrl('../assets/dice/skins/rainbow/rainbow_dice1.png'),
                },

                2: {
                  key: 'dice-rainbow-two',
                  url: assetUrl('../assets/dice/skins/rainbow/rainbow_dice2.png'),
                },

                3: {
                  key: 'dice-rainbow-three',
                  url: assetUrl('../assets/dice/skins/rainbow/rainbow_dice3.png'),
                },

                4: {
                  key: 'dice-rainbow-four',
                  url: assetUrl('../assets/dice/skins/rainbow/rainbow_dice4.png'),
                },

                5: {
                  key: 'dice-rainbow-five',
                  url: assetUrl('../assets/dice/skins/rainbow/rainbow_dice5.png'),
                },

                6: {
                  key: 'dice-rainbow-six',
                  url: assetUrl('../assets/dice/skins/rainbow/rainbow_dice6.png'),
                },
              }),
            }),
  dice_shadow: Object.freeze({
                id: 'dice_shadow',
                name: 'Schattenwürfel',
                portrait: assetUrl('../assets/dice/skins/shadow/shadow_dice_prev.png'),

                faces: Object.freeze({
                  1: {
                    key: 'dice-shadow-one',
                    url: assetUrl('../assets/dice/skins/shadow/shadow_dice1.png'),
                  },

                  2: {
                    key: 'dice-shadow-two',
                    url: assetUrl('../assets/dice/skins/shadow/shadow_dice2.png'),
                  },

                  3: {
                    key: 'dice-shadow-three',
                    url: assetUrl('../assets/dice/skins/shadow/shadow_dice3.png'),
                  },

                  4: {
                    key: 'dice-shadow-four',
                    url: assetUrl('../assets/dice/skins/shadow/shadow_dice4.png'),
                  },

                  5: {
                    key: 'dice-shadow-five',
                    url: assetUrl('../assets/dice/skins/shadow/shadow_dice5.png'),
                  },

                  6: {
                    key: 'dice-shadow-six',
                    url: assetUrl('../assets/dice/skins/shadow/shadow_dice6.png'),
                  },
                }),
              }),
  dice_toy: Object.freeze({
                id: 'dice_toy',
                name: 'Spielzeugwürfel',
                portrait: assetUrl('../assets/dice/skins/toy/toy_dice_prev.png'),

                faces: Object.freeze({
                  1: {
                    key: 'dice-toy-one',
                    url: assetUrl('../assets/dice/skins/toy/toy_dice1.png'),
                  },

                  2: {
                    key: 'dice-toy-two',
                    url: assetUrl('../assets/dice/skins/toy/toy_dice2.png'),
                  },

                  3: {
                    key: 'dice-toy-three',
                    url: assetUrl('../assets/dice/skins/toy/toy_dice3.png'),
                  },

                  4: {
                    key: 'dice-toy-four',
                    url: assetUrl('../assets/dice/skins/toy/toy_dice4.png'),
                  },

                  5: {
                    key: 'dice-toy-five',
                    url: assetUrl('../assets/dice/skins/toy/toy_dice5.png'),
                  },

                  6: {
                    key: 'dice-toy-six',
                    url: assetUrl('../assets/dice/skins/toy/toy_dice6.png'),
                  },
                }),
              }),
  dice_wood: Object.freeze({
                id: 'dice_wood',
                name: 'Holzwürfel',
                portrait: assetUrl('../assets/dice/skins/wood/wood_dice_prev.png'),

                faces: Object.freeze({
                  1: {
                    key: 'dice-wood-one',
                    url: assetUrl('../assets/dice/skins/wood/wood_dice1.png'),
                  },

                  2: {
                    key: 'dice-wood-two',
                    url: assetUrl('../assets/dice/skins/wood/wood_dice2.png'),
                  },

                  3: {
                    key: 'dice-wood-three',
                    url: assetUrl('../assets/dice/skins/wood/wood_dice3.png'),
                  },

                  4: {
                    key: 'dice-wood-four',
                    url: assetUrl('../assets/dice/skins/wood/wood_dice4.png'),
                  },

                  5: {
                    key: 'dice-wood-five',
                    url: assetUrl('../assets/dice/skins/wood/wood_dice5.png'),
                  },

                  6: {
                    key: 'dice-wood-six',
                    url: assetUrl('../assets/dice/skins/wood/wood_dice6.png'),
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