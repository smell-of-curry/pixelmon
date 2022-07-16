import { world } from "mojang-minecraft";
import { PokemonBuild } from "../../build/PokemonBuilder.js";

world.events.entityHit.subscribe((entityHit) => {
  try {
    if (entityHit.hitEntity && entityHit.hitEntity.id.startsWith("pokemon:")) {
      PokemonBuild.set_health(
        entityHit.hitEntity,
        entityHit.hitEntity.getComponent("minecraft:health").current
      );
    }
  } catch (error) {
    console.warn(error + error.stack);
  }
});