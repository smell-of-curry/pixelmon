import { world } from "mojang-minecraft";
import * as SA from "../../../index.js";

world.events.beforeChat.subscribe((data) => {
  try {
    if (!data.message.startsWith(SA.prefix)) return;
    const args = data.message
      .slice(SA.prefix.length)
      .trim()
      .match(/"[^"]+"|[^\s]+/g)
      .map((e) => e.replace(/"(.+)"/, "$1"));
    const command = args.shift().toLowerCase();
    const getCommand = SA.build.command
      .getAllRegistation()
      .find(
        (element) =>
          element.name === command ||
          (element.aliases && element.aliases.includes(command))
      );
    if (!getCommand) {
      data.cancel = true;
      return SA.build.chat.runCommand(
        `tellraw "${data.sender.nameTag}" {"rawtext":[{"text":"§c"},{"translate":"commands.generic.unknown", "with": ["§f${command}§c"]}]}`
      );
    }

    data.cancel = true;
    getCommand.callback(data, args);
  } catch (error) {
    console.warn(`${error} : ${error.stack}`);
  }
});
