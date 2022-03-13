import { world } from "mojang-minecraft";
import * as SA from "../../../Smelly Api/index.js";

SA.build.command.register(
  {
    name: "test",
    description: "Test command",
    usage: [""],
  },
  (data, args) => {
    console.warn("this command was used!");
  }
);
