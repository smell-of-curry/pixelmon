import { world } from "mojang-minecraft";
import { pokemon } from "../../api/pokemon.js";
import { SlotsBuild } from "../../build/SlotsBuilder.js";
import * as SA from "../../../../index.js";
import { PlayerVsTrainer } from "../../build/Battle/PlayerVsTrainer.js";
import { PcBuild } from "../../build/PcBuilder.js";

world.events.beforeDataDrivenEntityTriggerEvent.subscribe((data) => {
  try {
    if (data.id === "engine:level_up") {
      if (!data.entity.hasTag("sent_out_pokemon")) return;
      const trackerData = JSON.parse(
        data.entity
          .getTags()
          .find((tag) => tag.toString().match(/tracker:\{([\s\S]*?)\}/g))
          ?.substring(8)
      );
      if (!trackerData) return;
      const level = SlotsBuild.getSlotLevel(player, trackerData.slot);
      if (level >= 100)
        return SA.build.chat.broadcast(
          `You cannot level-up your pokemon because its already max level!`,
          player.nameTag
        );
      const player = SA.build.player.fetch(trackerData.owner);
      SlotsBuild.levelUpSlot(player, trackerData.slot);
      data.entity.triggerEvent("level_up");
      SA.build.chat.broadcast(
        `Your Pokemon ${
          pokemon[data.entity.id].name
        } Has Leveled Up to ${SlotsBuild.getSlotLevel(
          player,
          trackerData.slot
        )}!`,
        player.nameTag
      );
    }
    if (
      data.id.startsWith("engine:stone_interact_") &&
      data.entity.id.startsWith("pokemon:")
    ) {
      if (!data.entity.hasTag("sent_out_pokemon"))
        return data.entity.runCommand(`give @p ss:${data.id.substring(22)}`);
      const trackerData = JSON.parse(
        data.entity
          .getTags()
          .find((tag) => tag.toString().match(/tracker:\{([\s\S]*?)\}/g))
          ?.substring(8)
      );
      if (!trackerData) return;
      // evolve pokemon
      const evolveTo =
        pokemon[data.entity.id].evolutions.find(
          (evolution) =>
            evolution.evolution_details.item.name === data.id.substring(22)
        )?.evolves_to ?? null;
      if (!evolveTo)
        return data.entity.runCommand(`give @p ss:${data.id.substring(22)}`);
      SlotsBuild.evolveSlot(
        SA.build.player.fetch(trackerData.owner),
        trackerData.slot,
        evolveTo
      );
    }
    if (
      data.id === "engine:on_interact" &&
      data.entity.id === "ss:healing_machine"
    ) {
      const player = SA.build.player.fetch(
        data.entity.runCommand("testfor @p").victim[0]
      );
      const ammountDead = SlotsBuild.ammountDead(player);
      if (ammountDead > 0) {
        data.entity.triggerEvent(`ss:amountdead${ammountDead}`);
        SlotsBuild.healAllPokemon(player);
      } else {
        SA.build.chat.broadcast(
          `None of your pokemon are dead`,
          player.nameTag
        );
      }
    }
    if (data.id === "engine:on_interact" && data.entity.id === "ss:pc") {
      const player = SA.build.player.fetch(
        data.entity.runCommand("testfor @p").victim[0]
      );
      PcBuild.open(player);
    }
    if (
      data.id === "engine:on_interact" &&
      data.entity.id.startsWith("trainer:")
    ) {
      const player = SA.build.player.fetch(
        data.entity.runCommand("testfor @p").victim[0]
      );
      if (SlotsBuild.allDead(player)) {
        return SA.build.chat.broadcast(
          "You cannot battle because all your pokemon are dead",
          player.nameTag
        );
      }
      new PlayerVsTrainer(player, data.entity);
    }
    if (
      data.id === "engine:on_interact" &&
      data.entity.id === "minecraft:player"
    ) {
      const player = SA.build.player.fetch(
        data.entity.runCommand("testfor @p[rm=0.1]").victim[0]
      );
    }
  } catch (error) {
    console.warn(error + error.stack);
  }
});
