import fs, { stat } from "fs";
import scraper from "table-scraper";
import Pokedex from "pokedex-promise-v2";
const P = new Pokedex();
import { pokemon as pokedex } from "./list.mjs";

//capitalize only the first letter of the string.
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const pokemonMovement = {
  bug: "fly",
  dark: "basic",
  dragon: "fly",
  electric: "basic",
  fairy: "fly",
  fighting: "basic",
  fire: "basic",
  flying: "fly",
  ghost: "hover",
  grass: "generic",
  ice: "generic",
  normal: "basic",
  posion: "basic",
  psychic: "basic",
  rock: "basic",
  steel: "basic",
  water: "amphibious",
};

const generate = async () => {
  try {
    const pokemonLISTDATA = {};
    for (const pokemon of pokedex) {
      console.log(pokemon);
      await P.getPokemonByName(pokemon) // with Promise
        .then(async (response) => {
          const pokemonMovesData = [];
          const pokemonEvolutionData = [];
          const moves = response.moves;
          const species = response.species?.name ?? undefined;
          if (!moves || !species)
            return console.log(pokemon + " does not have working stats");

          await P.getPokemonSpeciesByName(species)
            .then(async (response) => {
              const evolution_chain_ID = response.evolution_chain.url
                .replace("https://pokeapi.co/api/v2/evolution-chain/", "")
                .replace("/", "");
              await P.getEvolutionChainById(evolution_chain_ID)
                .then(async (response) => {
                  const evolutions = response.chain.evolves_to;
                  for (const evolution of evolutions) {
                    if (pokedex.indexOf(evolution.species.name) < 0) return;
                    pokemonEvolutionData.push({
                      evolution_details: evolution.evolution_details[0],
                      evolves_to: `pokemon:${evolution.species.name ?? null}`,
                    });
                  }
                })
                .catch((error) => {
                  console.log("There was an ERROR: ", error);
                });
            })
            .catch((error) => {
              console.log("There was an ERROR: ", error);
            });
          for (const move of moves) {
            const name = move["move"].name;
            const learned_at =
              move["version_group_details"][0]["level_learned_at"];

            await P.getMoveByName(name)
              .then((response) => {
                const power = response.power;
                if (!power) return;
                pokemonMovesData.push({
                  name: name ?? "",
                  accuracy: response.accuracy ?? 100,
                  effect_chance: response.effect_chance,
                  pp: response.pp ?? 5,
                  priority: response.priority,
                  power: response.power ?? 10,
                  type: response.type.name,
                  level: learned_at ?? 0,
                  icon: `textures/ui/gui/attacks/${response.type.name}`,
                });
              })
              .catch((error) => {
                console.log("There was an ERROR: ", error);
              });
          }
          let catchrate = 0;
          await scraper
            .get(
              "https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_catch_rate"
            )
            .then(function (tableData) {
              catchrate =
                parseInt(
                  tableData[1].find(
                    (elm) => elm["1"] === capitalizeFirstLetter(pokemon)
                  )?.Name
                ) ?? 45;
            });
          let components = new Array(20)
            .fill(null)
            .map((v, i) => {
              if (!response.stats[i]) return;
              return `${response.stats[i].stat.name}:${response.stats[i].base_stat}`;
            })
            .filter((item) => (item == null ? false : true));
          const movement = response.types.find((type) => type.name === "flying")
            ? "fly"
            : response.types.find((type) => type.name === "water")
            ? "amphibious"
            : "generic";
          components.push(`movement:${movement}`);
          let stats = {};
          for (const stat of response.stats) {
            stats[stat.stat.name] = stat.base_stat;
          }
          let spawn_range = [1, 10];
          await scraper
            .get(`https://pixelmonmod.com/wiki/${pokemon}`)
            .then(function (tableData) {
              spawn_range = tableData[1][15][4]
                .match(/[0-9]+/g)
                .map((elm) => parseInt(elm));
            });
          console.log("pushed data for " + response.name);
          pokemonLISTDATA[`pokemon:${response.name}`] = {
            id: `ss:${response.name}`,
            name: capitalizeFirstLetter(response.name),
            evolutions: pokemonEvolutionData,
            max_health: response.stats[0].base_stat,
            base_experience: response.base_experience,
            catch_rate: catchrate,
            spawn_range: spawn_range,
            icon: `textures/items/${response.name}`,
            stats: stats,
            components: components,
            moves: pokemonMovesData.sort((a, b) => {
              return a.level - b.level;
            }),
          };
        })
        .catch((error) => {
          console.log("There was an ERROR: ", error);
        });
    }
    console.log("writting FILE!!!");
    let fileData =
      "export const pokemon = " + JSON.stringify(pokemonLISTDATA, 0, 3);
    fs.writeFileSync(`generate/data.mjs`, fileData, {
      encoding: "utf8",
    });
  } catch (error) {
    throw error;
  }
};
generate();
