import { world } from "mojang-minecraft";
import * as SA from "../../../../index.js";
import { GuiBuild } from "../../build/GuiBuilder.js";

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
