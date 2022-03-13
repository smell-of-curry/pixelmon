import { Location, world } from "mojang-minecraft";
import * as SA from "../../../index.js";
import {
  ActionFormData,
  ModalFormData,
  MessageFormData,
} from "mojang-minecraft-ui";
import { SlotsBuild } from "./SlotsBuilder.js";
import { pokemon } from "../pokemon.js";
import { Pokemon } from "./PokemonBuilder.js";
import { PcBuild } from "./PcBuilder.js";

export const tradeRequests = [
  // {"to": sdsd, "from": sdsd}
];

class GuiBuilder {
  firstTimeJoin(player) {
    try {
      let actionForm = new ActionFormData();
      actionForm.title("Welcome new commer!");
      actionForm.body("Please choose a starter pokemon...");
      actionForm.button("Bulbasaur", "textures/items/bulbasaur");
      actionForm.button("Charmander", "textures/items/charmander");
      actionForm.button("Squirtle", "textures/items/squirtle");
      actionForm.button("Chikorita", "textures/items/chikorita");
      actionForm.button("Cyndaquil", "textures/items/cyndaquil");
      actionForm.button("Totodile", "textures/items/totodile");
      actionForm.button("Turtwig", "textures/items/turtwig");
      actionForm.button("Chimchar", "textures/items/chimchar");
      actionForm.button("Piplup", "textures/items/piplup");

      actionForm
        .show(player)
        .then(({ isCanceled, selection }) => {
          if (isCanceled) return this.firstTimeJoin(player);
          player.runCommand(`function start`)
          switch (selection) {
            case 0:
              SlotsBuild.setSlot(player, 1, {
                id: "pokemon:bulbasaur",
                level: 5,
                xp: 0,
                health: pokemon["pokemon:bulbasaur"].max_health,
                sent_out: false,
                usedAttacks: {},
              });
              SA.build.chat.broadcast(
                "§l§eYou Have Chose §aBulbasaur §eto Come with you on your journey!",
                player.nameTag
              );
              break;
            case 1:
              SlotsBuild.setSlot(player, 1, {
                id: "pokemon:charmander",
                level: 5,
                xp: 0,
                health: pokemon["pokemon:charmander"].max_health,
                sent_out: false,
                usedAttacks: {},
              });
              SA.build.chat.broadcast(
                "§l§eYou Have Chose §aCharmander §eto Come with you on your journey!",
                player.nameTag
              );
              break;
            case 2:
              SlotsBuild.setSlot(player, 1, {
                id: "pokemon:squirtle",
                level: 5,
                xp: 0,
                health: pokemon["pokemon:squirtle"].max_health,
                sent_out: false,
                usedAttacks: {},
              });
              SA.build.chat.broadcast(
                "§l§eYou Have Chose §aSquirtle §eto Come with you on your journey!",
                player.nameTag
              );
              break;
            case 3:
              SlotsBuild.setSlot(player, 1, {
                id: "pokemon:chikorita",
                level: 5,
                xp: 0,
                health: pokemon["pokemon:chikorita"].max_health,
                sent_out: false,
                usedAttacks: {},
              });
              SA.build.chat.broadcast(
                "§l§eYou Have Chose §aChikorita §eto Come with you on your journey!",
                player.nameTag
              );
              break;
            case 4:
              SlotsBuild.setSlot(player, 1, {
                id: "pokemon:cyndaquil",
                level: 5,
                xp: 0,
                health: pokemon["pokemon:cyndaquil"].max_health,
                sent_out: false,
                usedAttacks: {},
              });
              SA.build.chat.broadcast(
                "§l§eYou Have Chose §aCyndaquil §eto Come with you on your journey!",
                player.nameTag
              );
              break;
            case 5:
              SlotsBuild.setSlot(player, 1, {
                id: "pokemon:totodile",
                level: 5,
                xp: 0,
                health: pokemon["pokemon:totodile"].max_health,
                sent_out: false,
                usedAttacks: {},
              });
              SA.build.chat.broadcast(
                "§l§eYou Have Chose §aTotodile §eto Come with you on your journey!",
                player.nameTag
              );
              break;
            case 6:
              SlotsBuild.setSlot(player, 1, {
                id: "pokemon:turtwig",
                level: 5,
                xp: 0,
                health: pokemon["pokemon:turtwig"].max_health,
                sent_out: false,
                usedAttacks: {},
              });
              SA.build.chat.broadcast(
                "§l§eYou Have Chose §aTurtwig §eto Come with you on your journey!",
                player.nameTag
              );
              break;
            case 7:
              SlotsBuild.setSlot(player, 1, {
                id: "pokemon:chimchar",
                level: 5,
                xp: 0,
                health: pokemon["pokemon:chimchar"].max_health,
                sent_out: false,
                usedAttacks: {},
              });
              SA.build.chat.broadcast(
                "§l§eYou Have Chose §aChimchar §eto Come with you on your journey!",
                player.nameTag
              );
              break;

            case 8:
              SlotsBuild.setSlot(player, 1, {
                id: "pokemon:piplup",
                level: 5,
                xp: 0,
                health: pokemon["pokemon:piplup"].max_health,
                sent_out: false,
                usedAttacks: {},
              });
              SA.build.chat.broadcast(
                "§l§eYou Have Chose §aPiplup §eto Come with you on your journey!",
                player.nameTag
              );
              break;

            default:
              break;
          }
        })
        .catch((error) => {
          console.warn(error + error.stack);
        });
    } catch (error) {
      console.warn(error + error.stack);
    }
  }
  main(player) {
    let actionForm = new ActionFormData();

    actionForm.title("Menu");
    actionForm.body("");
    actionForm.button("Pokémon", "textures/ui/gui/pokeball");

    actionForm.show(player).then(({ isCanceled, selection }) => {
      if (isCanceled) return;

      switch (selection) {
        case 0:
          this.page_1(player);
          break;
        case 1:
          player.runCommand("say §7ActionFormData: §bButton §e(2) §atest");
          player.runCommand(`give @s golden_apple 1`);
          break;
      }
    });
  }

  page_1(player) {
    try {
      let actionForm = new ActionFormData();
      actionForm.title("Pokemon");
      actionForm.body("Select a pokemon to preform actions on");
      for (let i = 1; i < 7; i++) {
        const slot = SlotsBuild.getSlot(player, i);
        actionForm.button(
          `Slot ${i}\n${pokemon[slot.id]?.name ?? "Empty"}`,
          pokemon[slot.id]?.icon ?? ""
        );
      }

      actionForm.show(player).then(({ isCanceled, selection }) => {
        if (isCanceled) return;
        if (SlotsBuild.getSlot(player, selection + 1).id == null)
          return this.page_1(player);

        this.pokemonPage(player, selection + 1);
      });
    } catch (error) {
      console.warn(error + error.stack);
    }
  }

  pokemonPage(player, slot, error = "") {
    try {
      let actionForm = new ActionFormData();

      const slotData = SlotsBuild.getSlot(player, slot);
      actionForm.title(`${pokemon[slotData.id].name}`);
      actionForm.body(
        `${slotData.health} HP Level: ${slotData.level}\n§c${error}`
      );
      actionForm.button("Send Out", "textures/ui/gui/pokeball");
      actionForm.button("Return Pokemon", "textures/ui/gui/pokeball");
      actionForm.button("Release Pokemon", "textures/ui/gui/pokeball");
      actionForm.button("Trade", "textures/ui/gui/pokeball");
      actionForm.button("Transfer to PC", "textures/ui/gui/pokeball");

      actionForm.show(player).then(({ isCanceled, selection }) => {
        if (isCanceled) return;

        switch (selection) {
          case 0:
            // send out pokemon
            try {
              SlotsBuild.sendOut(player, slot);
              SA.build.chat.broadcast("Sent out pokemon", player.nameTag);
            } catch (error) {
              console.warn(error + error.stack);
            }

            break;
          case 1:
            // send out pokemon
            SlotsBuild.returnPokemon(player, slot);
            SA.build.chat.broadcast("Returned pokemon to GUI");
            break;
          case 2:
            // release pokemon
            if (SlotsBuild.ammountOfPokemon(player) == 1)
              return this.pokemonPage(player, slot, "You must keep 1 pokemon!");
            let confirmMessage = new MessageFormData();
            confirmMessage.body(
              `Are you sure you want to release ${
                pokemon[slotData.id].name
              }\nThis will spawn the pokemon out into the wild and you will have to capture it`
            );
            confirmMessage.button1("confirm");
            confirmMessage.button2("back");
            confirmMessage.show(player).then(({ isCanceled, selection }) => {
              try {
                if (isCanceled) return;
                switch (selection) {
                  case 0:
                    this.pokemonPage(player, slot);
                    break;
                  case 1:
                    new Pokemon(
                      slotData.id,
                      new Location(
                        player.location.x,
                        player.location.y,
                        player.location.z
                      ),
                      true,
                      null,
                      slotData.health,
                      slotData.level
                    );
                    SlotsBuild.clearSlot(player, slot);
                    break;

                  default:
                    break;
                }
              } catch (error) {
                console.warn(error + error.stack);
              }
            });
            break;
          case 3:
            // trade pokemon
            this.tradePokemon(player, slot);
            break;
          case 4:
            // transfer to pc
            if (SlotsBuild.ammountOfPokemon(player) == 1)
              return this.pokemonPage(player, slot, "You must keep 1 pokemon!");
            let confirmMessage2 = new MessageFormData();
            confirmMessage2.body(
              `Are you sure you want to transfer ${
                pokemon[slotData.id].name
              }\nThis will transfer it to your pokemon PC and you will have to re-transfer it from there!`
            );
            confirmMessage2.button1("confirm");
            confirmMessage2.button2("back");
            confirmMessage2.show(player).then(({ isCanceled, selection }) => {
              try {
                if (isCanceled) return;
                switch (selection) {
                  case 0:
                    this.pokemonPage(player, slot);
                    break;
                  case 1:
                    PcBuild.addPcPokemon(
                      player,
                      SlotsBuild.getSlot(player, slot)
                    );
                    SlotsBuild.clearSlot(player, slot);
                    break;

                  default:
                    break;
                }
              } catch (error) {
                console.warn(error + error.stack);
              }
            });

          default:
            break;
        }
      });
    } catch (error) {
      console.warn(error + error.stack);
    }
  }

  tradePokemon(player, slot) {
    try {
      let slotData = SlotsBuild.getSlot(player, slot);
      let actionForm = new ActionFormData();

      actionForm.title(`${pokemon[slotData.id].name}`);
      actionForm.body(`Select a player to trade with`);
      const worldPlayers = [...world.getPlayers()];
      worldPlayers.forEach((elm) => actionForm.button(elm.nameTag));
      actionForm.show(player).then(({ isCanceled, selection }) => {
        if (isCanceled) return;
        if (worldPlayers[selection].nameTag === player.nameTag)
          return this.pokemonPage(player, slot, "You cant trade with yourself");
        if (tradeRequests.find((request) => request.from === player.nameTag))
          return this.pokemonPage(
            player,
            slot,
            "You already have a open trade request please cancel it!"
          );
        tradeRequests.push({
          to: worldPlayers[selection].name,
          from: player.name,
          slot: slot,
        });
        SA.build.chat.broadcast(
          `§e${player.nameTag}§f wants to trade a Lv: ${slotData.level} §a${
            pokemon[slotData.id].name
          }§f, type §e-trade accept§f to start a trade menu`,
          worldPlayers[selection].nameTag
        );
        return SA.build.chat.broadcast(
          `Sent a trade request to ${worldPlayers[selection].nameTag}`,
          player.nameTag
        );
      });
    } catch (error) {
      console.warn(error + error.stack);
    }
  }

  tradePokemonMenu(tradeRequestData) {
    const to = SA.build.player.fetch(tradeRequestData.to);
    const from = SA.build.player.fetch(tradeRequestData.from);

    if (!to || !from) return new Error("player is not in game");
    const slotData = SlotsBuild.getSlot(from, tradeRequestData.slot);
    let actionForm = new ActionFormData();

    actionForm.title(`Trade Menu`);
    actionForm.body(
      `Offered Trade:\n${pokemon[slotData.id].name} Level: ${
        slotData.level
      }, Health: ${slotData.health}\nSelect a Pokemon you want to trade`
    );
    for (let i = 1; i < 7; i++) {
      const slot = SlotsBuild.getSlot(to, i);
      actionForm.button(
        `Slot ${i}\n${pokemon[slot.id]?.name ?? "Empty"}`,
        pokemon[slot.id]?.icon ?? ""
      );
    }
    actionForm.show(to).then(({ isCanceled, selection }) => {
      if (isCanceled)
        return (
          SA.build.chat.broadcast("You have cancled the trade!", to.nameTag),
          SA.build.chat.broadcast(
            `${to.nameTag} Has cancled your trade request`,
            from.nameTag
          ),
          this.tradeCancel(tradeRequestData)
        );
      const selectedPokemonSlotData = SlotsBuild.getSlot(to, selection + 1);
      const TOS_SLOT = selection + 1;
      if (selectedPokemonSlotData.id == null)
        return this.tradePokemonMenu(tradeRequestData);

      let confirmMessage = new MessageFormData();
      confirmMessage.body(
        `Are you sure you want to trade Lvl: ${selectedPokemonSlotData.level} ${
          pokemon[selectedPokemonSlotData.id].name
        } for ${pokemon[slotData.id].name} Level: ${slotData.level}`
      );
      confirmMessage.button1("confirm");
      confirmMessage.button2("cancel");
      confirmMessage.show(to).then(({ isCanceled, selection }) => {
        try {
          if (isCanceled)
            return (
              SA.build.chat.broadcast(
                "You have cancled the trade!",
                to.nameTag
              ),
              SA.build.chat.broadcast(
                `${to.nameTag} Has cancled your trade request`,
                from.nameTag
              ),
              this.tradeCancel(tradeRequestData)
            );
          switch (selection) {
            case 0:
              return (
                SA.build.chat.broadcast(
                  "You have cancled the trade!",
                  to.nameTag
                ),
                SA.build.chat.broadcast(
                  `${to.nameTag} Has cancled your trade request`,
                  from.nameTag
                ),
                this.tradeCancel(tradeRequestData)
              );
              break;
            case 1:
              let confirmMessage2 = new MessageFormData();
              confirmMessage2.body(
                `Do you want to accept ${to.nameTag} offer of Lvl: ${
                  selectedPokemonSlotData.level
                } ${pokemon[selectedPokemonSlotData.id].name} for your ${
                  pokemon[slotData.id].name
                } Level: ${slotData.level}`
              );
              confirmMessage2.button1("confirm");
              confirmMessage2.button2("deny");
              confirmMessage2.show(from).then(({ isCanceled, selection }) => {
                try {
                  if (isCanceled)
                    return (
                      SA.build.chat.broadcast(
                        "You have cancled the trade!",
                        from.nameTag
                      ),
                      SA.build.chat.broadcast(
                        `${from.nameTag} Has denied your offer`,
                        to.nameTag
                      ),
                      this.tradeCancel(tradeRequestData)
                    );
                  switch (selection) {
                    case 0:
                      return (
                        SA.build.chat.broadcast(
                          "You have cancled the trade!",
                          from.nameTag
                        ),
                        SA.build.chat.broadcast(
                          `${from.nameTag} Has denied your offer`,
                          to.nameTag
                        ),
                        this.tradeCancel(tradeRequestData)
                      );
                      break;
                    case 1:
                      // complete trade
                      SlotsBuild.setSlot(to, TOS_SLOT, slotData);
                      SlotsBuild.setSlot(
                        from,
                        tradeRequestData.slot,
                        selectedPokemonSlotData
                      );
                      return (
                        SA.build.chat.broadcast(
                          `Succesfully Traded ${pokemon[slotData.id].name} to ${
                            to.nameTag
                          } for ${pokemon[selectedPokemonSlotData.id].name}`,
                          from.nameTag
                        ),
                        SA.build.chat.broadcast(
                          `Succesfully Traded ${
                            pokemon[selectedPokemonSlotData.id].name
                          } to ${from.nameTag} for ${
                            pokemon[slotData.id].name
                          }`,
                          to.nameTag
                        ),
                        this.tradeCancel(tradeRequestData)
                      );
                      break;

                    default:
                      break;
                  }
                } catch (error) {
                  console.warn(error + error.stack);
                }
              });
              break;

            default:
              break;
          }
        } catch (error) {
          console.warn(error + error.stack);
        }
      });
    });
  }

  tradeCancel(tradeRequestData) {
    tradeRequests.splice(tradeRequestData, 1);
  }
}
export const GuiBuild = new GuiBuilder();
