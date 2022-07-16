import { world } from "mojang-minecraft";
import "./modules/commands/index.js";
import "./modules/events/index.js";
import * as SA from "../../index.js";

SA.untils.setTickInterval(() => {
  for (const player of world.getPlayers()) {
    player.onScreenDisplay.setActionBar(
      `§c§cpokemon1_name:21pokemon2_name:-1pokemon3_name:-1pokemon4_name:-1pokemon5_name:-1pokemon6_name:-1`
    );
  }
}, 100);
