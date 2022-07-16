import { world } from "mojang-minecraft";
import { GuiBuild } from "../../build/GuiBuilder.js";

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
