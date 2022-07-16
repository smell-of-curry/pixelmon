import { world } from "mojang-minecraft";
import { GuiBuild } from "../../build/GuiBuilder.js";

world.events.beforeItemUse.subscribe((eventData) => {
  if (eventData.item.id === "ss:gui") {
    GuiBuild.main(eventData.source);
  }
});
