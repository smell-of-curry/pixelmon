import { world } from "mojang-minecraft";
import * as SA from "../../../../index.js";
import { GuiBuild, tradeRequests } from "../../build/GuiBuilder.js";

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
