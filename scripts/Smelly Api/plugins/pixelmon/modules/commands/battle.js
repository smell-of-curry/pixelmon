import { world } from "mojang-minecraft";
import * as SA from "../../../../index.js";
import { PlayerVsPlayer } from "../../build/Battle/PlayerVsPlayer.js";
import { GuiBuild, battleRequests } from "../../build/GuiBuilder.js";

SA.build.command.register({ name: "battle" }, (data, args) => {
  try {
    switch (args[0]) {
      case "accept":
        const battleRequestData = battleRequests.find(
          (request) => request.to === data.sender.nameTag
        );
        if (!battleRequestData)
          return SA.build.chat.broadcast(
            "You do not have a pending battle request!",
            data.sender.nameTag
          );
        const otherPlayer = SA.build.player.fetch(battleRequestData.from);
        if (!otherPlayer)
          return SA.build.chat.broadcast(
            `${battleRequestData.from} is not in the game they need to be in the game to battle!`,
            data.sender.nameTag
          );
        const sender = data.sender;
        new PlayerVsPlayer(sender, otherPlayer);

        SA.build.chat.broadcast(
          `Started battle with ${battleRequestData.from} Please move to get started`,
          data.sender.nameTag
        );
        SA.build.chat.broadcast(
          `Started battle with ${battleRequestData.to} Please move to get started`,
          otherPlayer.nameTag
        );
        GuiBuild.battleCancel(battleRequestData);
        break;

      default:
        break;
    }
  } catch (error) {
    console.warn(error + error.stack);
  }
});
