import { Location, world } from "mojang-minecraft";
import * as SA from "../../../index.js";
import { pokemon } from "../api/pokemon.js";
export class Pokemon {
  static level = 1;
  static id = 0;
  static pokemon = {};
  /**
   * Broadcast a message in chat
   * @param {string} id the minecraft identifer for the pokemon entity
   * @param {Location} location a location you want the entity to spawn
   * @example Pokemon("pixelmon:ditto", new Location(1,1,1));
   */
  constructor(
    id,
    location,
    summon = false,
    entity = null,
    health = null,
    level = null
  ) {
    if (!pokemon[id])
      throw new Error(`The id ${id} does not exists in the pokedex`);
    this.id = id;
    if (summon) {
      this.pokemon = this.summon(location);
    } else if (entity) {
      this.pokemon = entity;
    } else {
      throw new Error("You have to either summon a entity or define it");
    }
    this.level = level
      ? level
      : parseInt(
          this.pokemon
            .getTags()
            .find((tag) => tag.startsWith("level:"))
            ?.substring(6) ?? "1"
        ) ?? 1;
    if (health) this.set_health(health);
  }
  summon(location) {
    let entity = world
      .getDimension("overworld")
      .spawnEntity("ss:pokemon", location);
    this.syncComponents(entity);
    return entity;
  }

  syncComponents(entity = this.pokemon) {
    for (const component of pokemon[this.id].components) {
      entity.triggerEvent(component);
    }
  }

  set_health(value) {
    try {
      this.pokemon.getComponent("minecraft:health").setCurrent(value);
      this.pokemon.nameTag = `${pokemon[this.id].name}\n${value} HP`;
    } catch (error) {
      console.warn(error + error.stack);
    }
  }

  get_health() {
    return this.pokemon.getComponent("minecraft:health").current;
  }

  level_up() {
    this.set_level(this.level++);
    this.pokemon.triggerEvent("level_up");
    const evolution = pokemon[this.id].evolutions.find((evolution) => {
      evolution.at_level === this.level++;
    });
    if (!evolution) return;
    this.evolve(evolution.evolves_to);
  }

  set_level(value) {
    this.level = value;
    this.pokemon.getTags().forEach((tag) => {
      if (tag.startsWith("level:")) this.pokemon.removeTag(tag);
    });
    this.pokemon.addTag(`level:${value}`);
  }
  evolve(toID) {}

  //   attack(target, attack)
  //   tame()
  //   pokeball_hit(type)
}

class PokemonBuilder {
  set_health(entity, value, add = false) {
    try {
      const old = entity.getComponent("minecraft:health").current;
      entity.getComponent("minecraft:health").resetToMaxValue();
      const max = entity.getComponent("minecraft:health").current;
      if (old + value > max && add) value = max;
      entity.getComponent("minecraft:health").setCurrent(value);
      entity.nameTag = `${pokemon[entity.id].name}\nLv ${this.getLevel(
        entity
      )} ${entity.getComponent("minecraft:health").current} HP`;
    } catch (error) {
      console.warn(error + error.stack);
    }
  }
  getLevel(entity) {
    return (
      entity
        .getTags()
        .find((tag) => tag.startsWith("level:"))
        ?.substring(6) ?? 1
    );
  }
}

export const PokemonBuild = new PokemonBuilder();
