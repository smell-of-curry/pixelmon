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
      console.log(key);
      const pokemonName = value.name.toLowerCase();
      await fs.promises.mkdir(directory + pokemonName);

      const template = JSON.parse(fs.readFileSync("generate/pokemon.json"));
      template["minecraft:entity"]["description"]["identifier"] = key;
      for (const component of value.components) {
        if (component.startsWith("hp")) {
          template["minecraft:entity"]["components"]["minecraft:health"] = {
            value: component.match(/(?!hp:)\d{1,4}/)[0],
            max: parseInt(component.match(/(?!hp:)\d{1,4}/)[0]) + 100,
          };
        } else if (component.startsWith("attack")) {
          template["minecraft:entity"]["components"]["minecraft:attack"] = {
            damage: component.match(/(?!attack:)\d{1,4}/)[0],
          };
        } else if (component.startsWith("speed")) {
          template["minecraft:entity"]["components"]["minecraft:movement"] = {
            value: 0.3,
          };
        } else {
          const pokemonComp = components[component];
          if (pokemonComp == null) continue;
          for (const [key, value] of Object.entries(pokemonComp)) {
            template["minecraft:entity"]["components"][key] = value;
          }
        }
      }
      let pokemonStoneEvolutions = [];
      for (const evolution of value.evolutions) {
        if (!evolution.evolution_details.item) continue;
        pokemonStoneEvolutions.push(evolution.evolution_details.item.name);
      }
      for (const evolutionStone of pokemonStoneEvolutions) {
        template["minecraft:entity"]["events"][
          `engine:stone_interact_${evolutionStone}`
        ] = {};
        template["minecraft:entity"]["component_groups"]["pokemon:tamed"][
          "minecraft:interact"
        ]["interactions"].push({
          on_interact: {
            filters: {
              all_of: [
                {
                  test: "is_family",
                  subject: "other",
                  value: "player",
                },
                {
                  test: "has_equipment",
                  domain: "hand",
                  subject: "other",
                  value: `ss:${evolutionStone}`,
                },
              ],
            },
            event: `engine:stone_interact_${evolutionStone}`,
            target: "self",
          },
          interact_text: "Evolve Pokemon",
          cooldown: 2,
          use_item: true,
          swing: false,
          play_sounds: "random.levelup",
        });
      }
      fs.writeFileSync(
        `entities/pokemon/${pokemonName}/${pokemonName}.entity.json`,
        JSON.stringify(template)
      );
      const tamed_templace = JSON.parse(
        fs.readFileSync("generate/pre_tamed.json")
      );
      tamed_templace["minecraft:entity"]["description"][
        "identifier"
      ] = `pokemon_tamed:${pokemonName}`;
      tamed_templace["minecraft:entity"]["components"][
        "minecraft:transformation"
      ]["into"] = `pokemon${pokemonName}<minecraft:on_tame>`;
      fs.writeFileSync(
        `entities/pokemon/${pokemonName}/tamed_${pokemonName}.entity.json`,
        JSON.stringify(tamed_templace)
      );
    }
  } catch (error) {
    throw error;
  }
};
generate();
