import {
  EntityQueryOptions,
  Location,
  MinecraftEffectTypes,
  world,
} from "mojang-minecraft";
import * as SA from "../../../index.js";
import { pokemon } from "../api/pokemon.js";

class SlotsBuilder {
  //"pokemon_slots":[{"id":"ss:sdjhsd", "level": 2, "health": 23, "usedAttacks": {"name": 1 /*currentpp*/}},{}]
  constructor() {
    this.defaultData = [
      {
        id: null,
        level: null,
        xp: null,
        health: null,
        sent_out: false,
        shiny: false,
        usedAttacks: {},
      },
      {
        id: null,
        level: null,
        xp: null,
        health: null,
        shiny: false,
        sent_out: false,
        usedAttacks: {},
      },
      {
        id: null,
        level: null,
        xp: null,
        health: null,
        shiny: false,
        sent_out: false,
        usedAttacks: {},
      },
      {
        id: null,
        level: null,
        xp: null,
        health: null,
        shiny: false,
        sent_out: false,
        usedAttacks: {},
      },
      {
        id: null,
        level: null,
        xp: null,
        health: null,
        shiny: false,
        sent_out: false,
        usedAttacks: {},
      },
      {
        id: null,
        level: null,
        xp: null,
        health: null,
        shiny: false,
        sent_out: false,
        usedAttacks: {},
      },
    ];
  }
  instalise(player) {
    this.reset(player);
    player.addTag(`"pokemon_slots":${JSON.stringify(this.defaultData)}`);
  }

  reset(player) {
    player.removeTag(
      player
        .getTags()
        .find((tag) => tag.toString().match(/"pokemon_slots":\[([\s\S]*?)\]/g))
    );
  }
  getSlots(player) {
    const pokemonData =
      player
        .getTags()
        .find((tag) => tag.toString().match(/"pokemon_slots":\[([\s\S]*?)\]/g))
        ?.substring(16) ?? JSON.stringify(this.defaultData);
    return JSON.parse(pokemonData);
  }

  setSlot(player, slot, slotData) {
    let pokemonData = this.getSlots(player);

    player.removeTag(`"pokemon_slots":${JSON.stringify(pokemonData)}`);
    pokemonData[slot - 1] = slotData;
    player.addTag(`"pokemon_slots":${JSON.stringify(pokemonData)}`);
  }

  setSlotsId(player, slot, id) {
    let slotData = this.getSlot(player, slot);
    slotData["id"] = id;
    this.setSlot(player, slot, slotData);
  }
  setSlotsLevel(player, slot, level) {
    let slotData = this.getSlot(player, slot);
    slotData["level"] = level;
    this.setSlot(player, slot, slotData);
  }
  setSlotsXp(player, slot, xp) {
    let slotData = this.getSlot(player, slot);
    slotData["xp"] = xp;
    this.setSlot(player, slot, slotData);
  }
  setSlotsHealth(player, slot, health) {
    let slotData = this.getSlot(player, slot);
    slotData["health"] = health;
    this.setSlot(player, slot, slotData);
  }
  setSlotsShiny(player, slot, shiny) {
    let slotData = this.getSlot(player, slot);
    slotData["shiny"] = shiny;
    this.setSlot(player, slot, slotData);
  }
  setSlotsSentout(player, slot, value) {
    let slotData = this.getSlot(player, slot);
    slotData["sent_out"] = value ?? false;
    this.setSlot(player, slot, slotData);
  }
  setSlotsUsedAttacks(player, slot, usedAttacks) {
    let slotData = this.getSlot(player, slot);
    slotData["usedAttacks"] = usedAttacks;
    this.setSlot(player, slot, slotData);
  }

  sendOut(player, slot) {
    let slotData = this.getSlot(player, slot);
    if (slotData.health <= 0) {
      return new Error("pokemon is dead");
    }
    if (slotData.sent_out) {
      // pokemon is sent out
      return new Error("pokemon is already out");
    } else {
      let entity = player.dimension.spawnEntity(slotData.id, player.location);
      const trackerDATA = {
        owner: player.name,
        slot: parseInt(slot),
        date: Date.now(),
      };
      entity.addTag("sent_out_pokemon");
      entity.addTag(`tracker:${JSON.stringify(trackerDATA)}`);
      entity.addTag(`level:${slotData.level}`);
      entity
        .getComponent("minecraft:health")
        .setCurrent(parseInt(slotData.health));
      if (slotData.shiny) {
        entity.getComponent("minecraft:skin_id").value = 1;
      }
      player.runCommand(`give @s ss:instatametool 1`);
      this.setSlotsSentout(player, slot, true);
    }
  }

  returnPokemon(player, slot) {
    let slotData = this.getSlot(player, slot);
    if (!slotData.sent_out) {
      // pokemon isnt sent out
      return new Error("pokemon is not out");
    } else {
      this.setSlotsSentout(player, slot, false);
      let options = new EntityQueryOptions();
      options.families = ["pokemon"];
      options.tags = ["sent_out_pokemon"];
      for (const entity of player.dimension.getEntities(options)) {
        if (!entity.hasTag("sent_out_pokemon")) continue;
        const trackerData = JSON.parse(
          entity
            .getTags()
            .find((tag) => tag.toString().match(/tracker:\{([\s\S]*?)\}/g))
            ?.substring(8)
        );
        if (!trackerData) continue;
        if (trackerData.owner === player.name && trackerData.slot === slot) {
          // pokemon found now return
          entity.triggerEvent("despawn");
        }
      }
    }
  }

  getSlot(player, slot) {
    let pokemonData = this.getSlots(player);
    return pokemonData[slot - 1];
  }

  ammountOfPokemon(player) {
    let count = 0;
    for (let i = 1; i < 7; i++) {
      const slot = this.getSlot(player, i);
      if (slot.id) count = count + 1;
    }
    return count;
  }

  clearSlot(player, slot) {
    this.setSlot(player, slot, this.defaultData[0]);
  }

  isDead(player, slot) {
    let pokemonData = this.getSlots(player);
    if (pokemonData[slot - 1].health <= 0) return true;
    if (pokemonData[slot - 1] && pokemonData[slot - 1].health == null)
      return true;
    return false;
  }

  ammountDead(player) {
    let dead = 0;
    for (let i = 1; i < 7; i++) {
      const slot = this.getSlot(player, i);
      if (Object.values(slot).some((elm) => elm === null)) continue;
      if (this.isDead(player, i)) dead++;
    }
    return dead;
  }

  allDead(player) {
    if (this.ammountDead(player) == this.ammountOfPokemon(player)) return true;
    return false;
  }

  healAllPokemon(player) {
    for (let i = 1; i < 7; i++) {
      const slot = this.getSlot(player, i);
      if (Object.values(slot).some((elm) => elm === null)) continue;
      if (this.isDead(player, i)) {
        this.setSlotsHealth(player, i, pokemon[slot.id].max_health);
      }
      this.setSlotsUsedAttacks(player, i, {});
    }
  }

  usedAttacks(player, slot) {
    let pokemonData = this.getSlot(player, slot);
    let usedAttacks = pokemonData.usedAttacks;
    return usedAttacks;
  }

  usedAttack(player, slot, name) {
    try {
      let slotData = this.getSlot(player, slot);
      const currentPP =
        slotData.usedAttacks[name] ??
        pokemon[slotData.id].moves.find((move) => move.name === name)?.pp;
      slotData["usedAttacks"][name] = currentPP - 1;
      this.setSlot(player, slot, slotData);
    } catch (error) {
      console.warn(error + error.stack);
    }
  }

  levelUpSlot(player, slot) {
    const slotData = this.getSlot(player, slot);
    this.setSlotsLevel(player, slot, slotData.level + 1);
    const avaliableEvolutions = pokemon[slotData.id].evolutions.filter(
      (evolution) =>
        evolution.evolution_details.min_level === slotData.level + 1
    );
    if (avaliableEvolutions.length > 0) {
      // pokemon can evolve
      this.evolveSlot(player, slot, avaliableEvolutions[0].evolves_to);
    }
  }

  evolveSlot(player, slot, to) {
    const slotData = this.getSlot(player, slot);
    this.setSlotsId(player, slot, to);
    this.setSlotsHealth(player, slot, pokemon[slotData.id].max_health);
    SA.build.chat.broadcast(
      `Your Pokemon ${pokemon[slotData.id].name} Has Evolved to ${
        pokemon[to].name
      }`
    );
    if (slotData.sent_out) {
      let options = new EntityQueryOptions();
      options.families = ["pokemon"];
      options.tags = ["sent_out_pokemon"];
      for (const entity of player.dimension.getEntities(options)) {
        if (!entity.hasTag("sent_out_pokemon")) continue;
        const trackerData = JSON.parse(
          entity
            .getTags()
            .find((tag) => tag.toString().match(/tracker:\{([\s\S]*?)\}/g))
            ?.substring(8)
        );
        if (!trackerData) continue;
        if (trackerData.owner === player.name && trackerData.slot === slot) {
          // pokemon found now evolve
          entity.triggerEvent("evolve");
          const newentity = entity.dimension.spawnEntity(to, entity.location);
          entity.getTags().forEach((tag) => newentity.addTag(tag));
          entity.triggerEvent("despawn");
          newentity.addEffect(MinecraftEffectTypes.slowness, 10, 255);
        }
      }
    }
  }

  getSlotLevel(player, slot) {
    return this.getSlot(player, slot).level;
  }

  addXp(player, slot, ammount) {
    this.setSlotsXp(player, slot, this.currentXp(player, slot) + ammount);
    const slotData = this.getSlot(player, slot);
    const nexLevelRequiredXP = Math.ceil((4 * Math.pow(slotData.level, 3)) / 5);
    if (this.currentXp(player, slot) >= nexLevelRequiredXP) {
      this.setSlotsXp(player, slot, 0);
      this.levelUpSlot(player, slot);
    }
  }

  currentXp(player, slot) {
    return this.getSlot(player, slot).xp;
  }
}
export const SlotsBuild = new SlotsBuilder();
