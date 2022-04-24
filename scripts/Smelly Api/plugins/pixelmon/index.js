import {
  DataDrivenEntityTriggerEvent,
  EntityQueryOptions,
  Location,
  TickEvent,
  Vector,
  world,
} from "mojang-minecraft";
import {
  ActionFormData,
  ModalFormData,
  MessageFormData,
} from "mojang-minecraft-ui";
import { Pokemon, PokemonBuild } from "./build/PokemonBuilder.js";
import * as SA from "../../index.js";
import { GuiBuild, tradeRequests } from "./build/GuiBuilder.js";
import { Battle } from "./build/BattleBuilder.js";
import { SlotsBuild } from "./build/SlotsBuilder.js";
import { pokemon as pokedex, pokemon } from "./pokemon.js";
import { PcBuild } from "./build/PcBuilder.js";
import { trainers } from "./trainers.js";

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
    }
    if (entity.id.startsWith("trainer:")) {
      entity.nameTag = trainers[entity.id].name;
    }
  } catch (error) {
    console.warn(error + error.stack);
  }
});

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

world.events.beforeDataDrivenEntityTriggerEvent.subscribe(
  (DataDrivenEntityTriggerEvent) => {
    try {
      if (DataDrivenEntityTriggerEvent.id === "engine:level_up") {
        if (!DataDrivenEntityTriggerEvent.entity.hasTag("sent_out_pokemon"))
          return;
        const trackerData = JSON.parse(
          DataDrivenEntityTriggerEvent.entity
            .getTags()
            .find((tag) => tag.toString().match(/tracker:\{([\s\S]*?)\}/g))
            ?.substring(8)
        );
        if (!trackerData) return;
        SlotsBuild.levelUpSlot(
          SA.build.player.fetch(trackerData.owner),
          trackerData.slot
        );
        DataDrivenEntityTriggerEvent.entity.triggerEvent("level_up");
        SA.build.chat.broadcast(
          `Your Pokemon ${
            pokedex[DataDrivenEntityTriggerEvent.entity.id].name
          } Has Leveled Up to ${SlotsBuild.getSlotLevel(
            SA.build.player.fetch(trackerData.owner),
            trackerData.slot
          )}!`
        );
      }
      if (
        DataDrivenEntityTriggerEvent.id.startsWith("engine:stone_interact_") &&
        DataDrivenEntityTriggerEvent.entity.id.startsWith("pokemon:")
      ) {
        if (!DataDrivenEntityTriggerEvent.entity.hasTag("sent_out_pokemon"))
          return DataDrivenEntityTriggerEvent.entity.runCommand(
            `give @p ss:${DataDrivenEntityTriggerEvent.id.substring(22)}`
          );
        const trackerData = JSON.parse(
          DataDrivenEntityTriggerEvent.entity
            .getTags()
            .find((tag) => tag.toString().match(/tracker:\{([\s\S]*?)\}/g))
            ?.substring(8)
        );
        if (!trackerData) return;
        // evolve pokemon
        const evolveTo =
          pokedex[DataDrivenEntityTriggerEvent.entity.id].evolutions.find(
            (evolution) =>
              evolution.evolution_details.item.name ===
              DataDrivenEntityTriggerEvent.id.substring(22)
          )?.evolves_to ?? null;
        if (!evolveTo)
          return DataDrivenEntityTriggerEvent.entity.runCommand(
            `give @p ss:${DataDrivenEntityTriggerEvent.id.substring(22)}`
          );
        SlotsBuild.evolveSlot(
          SA.build.player.fetch(trackerData.owner),
          trackerData.slot,
          evolveTo
        );
      }
      if (DataDrivenEntityTriggerEvent.id === "engine:hit_by_pokeball") {
        const player = SA.build.player.fetch(
          DataDrivenEntityTriggerEvent.entity.runCommand("testfor @p").victim[0]
        );
        new Battle(player, DataDrivenEntityTriggerEvent.entity);
      }
      if (
        DataDrivenEntityTriggerEvent.id === "engine:on_interact" &&
        DataDrivenEntityTriggerEvent.entity.id === "ss:healing_machine"
      ) {
        const player = SA.build.player.fetch(
          DataDrivenEntityTriggerEvent.entity.runCommand("testfor @p").victim[0]
        );
        const ammountDead = SlotsBuild.ammountDead(player);
        if (ammountDead > 0) {
          DataDrivenEntityTriggerEvent.entity.triggerEvent(
            `ss:amountdead${ammountDead}`
          );
          SlotsBuild.healAllPokemon(player);
        } else {
          SA.build.chat.broadcast(
            `None of your pokemon are dead`,
            player.nameTag
          );
        }
      }
      if (
        DataDrivenEntityTriggerEvent.id === "engine:on_interact" &&
        DataDrivenEntityTriggerEvent.entity.id === "ss:pc"
      ) {
        const player = SA.build.player.fetch(
          DataDrivenEntityTriggerEvent.entity.runCommand("testfor @p").victim[0]
        );
        PcBuild.open(player);
      }
      if (
        DataDrivenEntityTriggerEvent.id === "engine:on_interact" &&
        DataDrivenEntityTriggerEvent.entity.id.startsWith("trainer:")
      ) {
        const player = SA.build.player.fetch(
          DataDrivenEntityTriggerEvent.entity.runCommand("testfor @p").victim[0]
        );
        const firstPokemon =
          DataDrivenEntityTriggerEvent.entity.dimension.spawnEntity(
            trainers[DataDrivenEntityTriggerEvent.entity.id].pokemon[0],
            DataDrivenEntityTriggerEvent.entity.location
          );
        new Battle(player, firstPokemon, DataDrivenEntityTriggerEvent.entity);
      }
    } catch (error) {
      console.warn(error + error.stack);
    }
  }
);

world.events.beforeItemUse.subscribe((eventData) => {
  if (eventData.item.id === "ss:gui") {
    GuiBuild.main(eventData.source);
  }
});

SA.build.command.register({ name: "heal" }, (data, args) => {
  try {
    SlotsBuild.healAllPokemon(data.sender);
  } catch (error) {
    console.warn(error + error.stack);
  }
});

SA.build.command.register({ name: "trade" }, (data, args) => {
  try {
    switch (args[0]) {
      case "accept":
        const tradeRequestData = tradeRequests.find(
          (request) => request.to === data.sender.nameTag
        );
        if (!tradeRequestData)
          return SA.build.chat.broadcast(
            "You do not have a pending trade request!"
          );
        const sender = data.sender;
        let callback = world.events.tick.subscribe((data) => {
          try {
            if (sender.velocity.length() > 0.0785) {
              GuiBuild.tradePokemonMenu(tradeRequestData);
              world.events.tick.unsubscribe(callback);
            }
          } catch (error) {}
        });
        break;

      default:
        break;
    }
  } catch (error) {
    console.warn(error + error.stack);
  }
});

world.events.playerJoin.subscribe(({ player }) => {
  let tickcallback = world.events.tick.subscribe((data) => {
    try {
      if (player.velocity.length() > 0.0785) {
        if (player.hasTag("old")) return;
        GuiBuild.firstTimeJoin(player);
        world.events.tick.unsubscribe(tickcallback);
      }
    } catch (error) {}
  });
});

SA.build.command.register({ name: "start" }, (data, args) => {
  let tickcallback = world.events.tick.subscribe((data) => {
    try {
      if (player.velocity.length() > 0.0785) {
        if (player.hasTag("old")) return;
        GuiBuild.firstTimeJoin(player);
        world.events.tick.unsubscribe(tickcallback);
      }
    } catch (error) {}
  });
});
