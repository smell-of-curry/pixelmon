import fs from "fs";
import fsExtra from "fs-extra";
import Pokedex from "pokedex-promise-v2";
const P = new Pokedex();
import { pokemon as pokedex } from "./data.mjs";

const components = {
  // size
  "size:small": {
    "minecraft:scale": {
      value: 0.2,
    },
    "minecraft:collision_box": {
      width: 0.7,
      height: 1,
    },
  },
  "size:medium": {
    "minecraft:scale": {
      value: 0.5,
    },
  },
  "size:large": {
    "minecraft:scale": {
      value: 1,
    },
  },
  "size:mega": {
    "minecraft:scale": {
      value: 2,
    },
  },
  "size:extreme": {
    "minecraft:scale": {
      value: 5,
    },
  },
  //Movement
  "movement:fly": {
    "minecraft:navigation.fly": {
      can_path_from_air: true,
    },
    "minecraft:movement.fly": {},
    "minecraft:behavior.random_fly": {},
  },
  "movement:amphibious": {
    "minecraft:navigation.generic": {},
    "minecraft:movement.amphibious": {},
  },
  "movement:basic": {
    "minecraft:navigation.walk": {},
    "minecraft:movement.basic": {},
  },
  "movement:generic": {
    "minecraft:navigation.generic": {},
    "minecraft:movement.generic": {},
  },
  "movement:hover": {
    "minecraft:navigation.float": {},
    "minecraft:movement.hover": {},
  },
  "movement:jump": {
    "minecraft:navigation.jump": {},
    "minecraft:movement.jump": {},
  },
  "movement:skip": {
    "minecraft:navigation.skip": {},
    "minecraft:movement.skip": {},
  },
  "movement:sway": {
    "minecraft:navigation.sway": {},
    "minecraft:movement.sway": {},
  },
  // Miscellaneous
  "misc:fire_immune": {
    "minecraft:fire_immune": {},
  },
};

const directory = "entities/pokemon/";

fsExtra.emptyDirSync(directory);

const generate = async () => {
  try {
    for (const [key, value] of Object.entries(pokedex)) {
      const pokemonName = value.name.toLowerCase();
      let pokemoncomponents = "";
      for (const component of value.components) {
        if (component.startsWith("hp")) {
          pokemoncomponents += `"minecraft:health": {
                  "value": ${component.match(/(?!hp:)\d{1,4}/)[0]},
                  "max": ${parseInt(component.match(/(?!hp:)\d{1,4}/)[0]) + 100}
                },`;
        } else if (component.startsWith("attack")) {
          pokemoncomponents += `"minecraft:attack": {
                "damage": ${component.match(/(?!attack:)\d{1,4}/)[0]}
              },`;
        } else if (component.startsWith("speed")) {
          pokemoncomponents += `"minecraft:movement": {
                "value": 0.3
              },`;
        } else {
          const pokemonComp = components[component];
          if (pokemonComp == null) continue;
          for (const [key, value] of Object.entries(pokemonComp)) {
            pokemoncomponents += `"${key}": ${JSON.stringify(value)},`;
          }
        }
      }
      pokemoncomponents = pokemoncomponents.replace(/,\s*$/, "");
      let pokemonStoneEvolutions = [];
      if (value.evolutions.length > 0) {
        for (const evolution of value.evolutions) {
          if (!evolution.evolution_details.item) continue;
          pokemonStoneEvolutions.push(evolution.evolution_details.item.name);
        }
      }
      let interactText = "";
      let stoneEventText = "";
      for (const evolutionStone of pokemonStoneEvolutions) {
        stoneEventText += `"engine:stone_interact_${evolutionStone}": {},`;
        interactText += `
        ,{
          "on_interact": {
            "filters": {
              "all_of": [
                {
                  "test": "is_family",
                  "subject": "other",
                  "value": "player"
                },
                {
                  "test": "has_equipment",
                  "domain": "hand",
                  "subject": "other",
                  "value": "ss:${evolutionStone}"
                }
              ]
            },
            "event": "engine:stone_interact_${evolutionStone}",
            "target": "self"
          },
          "interact_text": "Evolve Pokemon",
          "cooldown": 2,
          "use_item": true,
          "swing": false,
          "play_sounds": "random.levelup"
        }`;
      }
      fs.writeFileSync(
        `entities/pokemon/${pokemonName}.json`,
        `{
        "format_version": "1.16.100",
        "minecraft:entity": {
          "description": {
            "identifier": "pokemon:${pokemonName}",
            "is_spawnable": true,
            "is_summonable": true,
            "is_experimental": false
          },
          "component_groups": {
            "kill": {
              "minecraft:instant_despawn": {}
            },
			      "wild": {
				      "minecraft:behavior.hurt_by_target": {
					      "hurt_owner": false,
					      "priority": 2,
					      "alert_same_type": true
              }
			      },
            "minecraft:wolf_tame": {
              "minecraft:nameable": {
                "always_show": true,
                "allow_name_tag_renaming": true
              },
              "minecraft:is_tamed": {},
              "minecraft:behavior.follow_owner": {
                "priority": 6,
                "speed_multiplier": 1,
                "start_distance": 10,
                "stop_distance": 2
              },
              "minecraft:behavior.owner_hurt_by_target": {
                "priority": 1
              },
              "minecraft:behavior.owner_hurt_target": {
                "priority": 2
              },
              "minecraft:interact": {
                "interactions": [
                  {
                    "on_interact": {
                      "filters": {
                        "all_of": [
                          {
                            "test": "is_family",
                            "subject": "other",
                            "value": "player"
                          },
                          {
                            "test": "has_equipment",
                            "domain": "hand",
                            "subject": "other",
                            "value": "ss:rare_candy"
                          }
                        ]
                      },
                      "event": "engine:level_up",
                      "target": "self"
                    },
                    "interact_text": "Level Up Pokemon",
                    "cooldown": 1,
                    "use_item": true,
                    "swing": false,
                    "play_sounds": "random.levelup"
                  }
                  ${interactText}
                ]
              },
              "minecraft:healable": {
                "items": [
                  {
                    "item": "ss:potion",
                    "heal_amount": 20
                  },
                  {
                    "item": "ss:super_potion",
                    "heal_amount": 50
                  },
                  {
                    "item": "ss:hyper_potion",
                    "heal_amount": 200
                  },
                  {
                    "item": "ss:max_potion",
                    "heal_amount": 99999
                  },
                  {
                    "item": "ss:moomoo_milk",
                    "heal_amount": 100
                  },
                  {
                    "item": "ss:oran_berry",
                    "heal_amount": 15
                  },
                  {
                    "item": "ss:sitrus_berry",
                    "heal_amount": 30
                  },
                  {
                    "item": "ss:mago_berry",
                    "heal_amount": 12
                  },
                  {
                    "item": "ss:lemonade",
                    "heal_amount": 70
                  },
                  {
                    "item": "ss:soda_pop",
                    "heal_amount": 60
                  },
                  {
                    "item": "ss:rage_candybar",
                    "heal_amount": 20
                  },
                  {
                    "item": "ss:fresh_water",
                    "heal_amount": 30
                  }
                ]
              }
            }
          },
          "components": {
            "minecraft:target_nearby_sensor": {
              "inside_range": 6,
              "outside_range": 6.1,
              "on_inside_range": {
                "event": "ss:switch_to_melee",
                "target": "self"
              },
              "on_outside_range": {
                "event": "ss:switch_to_ranged",
                "target": "self"
              }
            },
            "minecraft:behavior.hurt_by_target": {
              "hurt_owner": false,
              "priority": 2,
              "alert_same_type": true
            },
            "minecraft:tameable": {
              "probability": 1,
              "tame_items": "ss:instatametool",
              "tame_event": {
                "event": "minecraft:on_tame",
                "target": "self"
              }
            },
            "minecraft:nameable": {
              "always_show": true,
              "allow_name_tag_renaming": false
            },
            "minecraft:collision_box": {
              "width": 0.7,
              "height": 1
            },
            "minecraft:type_family": {
              "family": ["pokemon"]
            },
            "minecraft:damage_sensor": {
              "triggers": [
                {
                  "on_damage": {
                    "filters": {
                      "all_of": [
                        {
                          "test": "has_damage",
                          "operator": "==",
                          "value": "projectile"
                        }
                      ],
                      "any_of": [
                        {
                          "test": "has_nametag",
                          "operator": "==",
                          "value": "entity.ss:pokeball.name"
                        }
                      ]
                    },
                    "event": "engine:hit_by_pokeball",
                    "deals_damage": true
                  }
                },
                {
                  "on_damage": {
                    "filters": {
                      "all_of": [
                        {
                          "test": "has_damage",
                          "operator": "==",
                          "value": "projectile"
                        }
                      ],
                      "any_of": [
                        {
                          "test": "has_nametag",
                          "operator": "==",
                          "value": "entity.ss:masterball.name"
                        }
                      ]
                    },
                    "event": "engine:hit_by_masterball",
                    "deals_damage": true
                  }
                },
                {
                  "on_damage": {
                    "filters": {
                      "all_of": [
                        {
                          "test": "has_damage",
                          "operator": "==",
                          "value": "projectile"
                        }
                      ],
                      "any_of": [
                        {
                          "test": "has_nametag",
                          "operator": "==",
                          "value": "entity.ss:ultraball.name"
                        }
                      ]
                    },
                    "event": "engine:hit_by_ultraball",
                    "deals_damage": true
                  }
                },
                {
                  "on_damage": {
                    "filters": {
                      "all_of": [
                        {
                          "test": "has_damage",
                          "operator": "==",
                          "value": "projectile"
                        }
                      ],
                      "any_of": [
                        {
                          "test": "has_nametag",
                          "operator": "==",
                          "value": "entity.ss:greatball.name"
                        }
                      ]
                    },
                    "event": "engine:hit_by_greatball",
                    "deals_damage": true
                  }
                },
                {
                  "on_damage": {
                    "filters": {
                        "test": "is_family",
                        "subject": "other",
                        "value": "player"
                    }
                  },
                  "deals_damage": false
                }
              ]
            },
            "minecraft:physics": {},
            "minecraft:pushable": {
              "is_pushable": true,
              "is_pushable_by_piston": true
            },
            "minecraft:behavior.random_stroll": {
              "priority": 6,
              "speed_multiplier": 1
            },
            "minecraft:behavior.look_at_player": {
              "priority": 7,
              "look_distance": 6,
              "probability": 0.02
            },
            ${pokemoncomponents}
          },
          "events": {
            "engine:level_up": {},
            "engine:hit_by_pokeball": {},
            "engine:hit_by_masterball": {},
            "engine:hit_by_greatball": {},
            "engine:hit_by_ultraball": {},
            ${stoneEventText}
            "despawn": {
              "add": {
                "component_groups": [
                  "kill"
                ]
              }
            },
            "level_up": {
              "run_command": {
                "command": [
                  "playsound gameplay.levelup @a[r=5]",
                  "particle minecraft:example_flipbook ~~~"
                ]
              }
            },
            "evolve": {
              "run_command": {
                "command": [
						      "playsound gameplay.evolving @a[r=10]",
                  "particle minecraft:example_directional_sphere ~~2~"
                ]
              }
            },
            "minecraft:on_tame": {
              "run_command": {
                "command": [
                  "tellraw @p {\\"rawtext\\":[{\\"text\\":\\"§l§bYou Have Tamed: §e\\"},{\\"selector\\":\\"@s\\"}]}",
                  "playsound random.levelup @p"
                ],
                "target": "self"
              },
              "add": {
                "component_groups": [
                  "minecraft:wolf_tame"
                ]
              },
              "remove": {
                "component_groups": [
                  "wild"
                ]
              }
            }
          }
        }
    }`,
        { encoding: "utf8" }
      );
    }
  } catch (error) {
    throw error;
  }
};
generate();
