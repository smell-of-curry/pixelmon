import { world } from "mojang-minecraft";
import { pokemon } from "../../api/pokemon.js";
import { trainers } from "../../api/trainers.js";

world.events.entityCreate.subscribe(({ entity }) => {
  try {
    if (entity.id.startsWith("pokemon:")) {
      let level = 1;
      if (pokemon[entity.id].spawn_range.length == 1) {
        level = pokemon[entity.id].spawn_range[0];
      } else if (pokemon[entity.id].spawn_range.length == 2) {
        const maxLevelRange = pokemon[entity.id].spawn_range[1];
        const minLevelRange = pokemon[entity.id].spawn_range[0];
        level =
          Math.floor(Math.random() * (maxLevelRange - minLevelRange + 1)) +
            minLevelRange ?? 1;
      }
      entity.addTag(`level:${level}`);
      entity.nameTag = `${pokemon[entity.id].name}\nLv ${level ?? 1} ${
        entity.getComponent("minecraft:health").current
      } HP`;

      if (Math.random() <= 0.1) {
        // sets the pokemon to shiny at a 0.1 percentage
        entity.getComponent("minecraft:skin_id").value = 1;
      }
    }
    if (entity.id.startsWith("trainer:")) {
      entity.nameTag = trainers[entity.id].name;
    }
  } catch (error) {
    console.warn(error + error.stack);
  }
});
