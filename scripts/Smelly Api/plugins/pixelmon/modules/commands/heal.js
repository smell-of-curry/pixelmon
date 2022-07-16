import * as SA from "../../../../index.js";
import { SlotsBuild } from "../../build/SlotsBuilder.js";

SA.build.command.register({ name: "heal" }, (data, args) => {
  try {
    SlotsBuild.healAllPokemon(data.sender);
  } catch (error) {
    console.warn(error + error.stack);
  }
});
