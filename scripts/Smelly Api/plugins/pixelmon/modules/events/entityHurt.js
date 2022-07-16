import { world } from "mojang-minecraft";
import { SlotsBuild } from "../../build/SlotsBuilder.js";
import * as SA from "../../../../index.js";
import { PlayerVsPokemon } from "../../build/Battle/PlayerVsPokemon.js";
import { pokemon } from "../../api/pokemon.js";

world.events.entityHurt.subscribe((data) => {
  if (!data.hurtEntity.id.startsWith("pokemon:")) return;
  if (data.cause != "projectile") return;

  if (SlotsBuild.allDead(data.damagingEntity)) {
    return SA.build.chat.broadcast(
      "You cannot battle because all your pokemon are dead",
      data.damagingEntity.nameTag
    );
  }
  if (data.projectile.id == "ss:masterball") {
    const playersSlots = SlotsBuild.getSlots(data.damagingEntity);
    let fillslot = playersSlots.length + 1;
    const nullElement = playersSlots.find((elm) => elm.id === null);
    if (fillslot > 6)
      return SA.build.chat.broadcast(
        `Cannot capture pokemon because all slots are full!`,
        data.damagingEntity.nameTag
      );
    if (nullElement) {
      fillslot = playersSlots.indexOf(nullElement) + 1;
    }
    console.warn(fillslot);
    SlotsBuild.setSlot(data.damagingEntity, fillslot, {
      id: data.hurtEntity.id,
      level:
        parseInt(
          data.hurtEntity
            .getTags()
            .find((tag) => tag.startsWith("level:"))
            ?.substring(6) ?? "1"
        ) ?? 1,
      xp: 0,
      health: data.hurtEntity.getComponent("minecraft:health").current,
      usedAttacks: {},
    });
    data.hurtEntity.triggerEvent("despawn");
    return SA.build.chat.broadcast(
      `Captured ${pokemon[data.hurtEntity.id].name}!`,
      data.damagingEntity.nameTag
    );
  }
  new PlayerVsPokemon(data.damagingEntity, data.hurtEntity);
});
