import { Location, world } from "mojang-minecraft";
import * as SA from "../../../index.js";
import {
  ActionFormData,
  ModalFormData,
  MessageFormData,
} from "mojang-minecraft-ui";
import { SlotsBuild } from "./SlotsBuilder.js";
import { pokemon } from "../api/pokemon.js";
import { Pokemon } from "./PokemonBuilder.js";

export const tradeRequests = [
  // {"to": sdsd, "from": sdsd}
];

class PcBuilder {
  open(player) {
    let actionForm = new ActionFormData();

    actionForm.title("Pokemon Pc");
    actionForm.body("Select a Pokemon to preform actions on");
    const pcPokemon = this.getPcPokemon(player);

    for (const pokemonData of pcPokemon) {
      actionForm.button(
        `${pokemon[pokemonData.id]?.name ?? "Empty"}`,
        pokemon[pokemonData.id]?.icon ?? ""
      );
    }
    if (pcPokemon.length == 0) actionForm.button(`Empty`);

    actionForm.show(player).then(({ isCanceled, selection }) => {
      if (isCanceled) return;
      if (pcPokemon[selection].id == null) return this.open(player);

      this.pokemonPage(player, selection);
    });
  }

  pokemonPage(player, index, error = "") {
    try {
      const pokemonData = this.getPcPokemon(player)[index];
      let actionForm = new ActionFormData();

      actionForm.title(`${pokemon[pokemonData.id].name}`);
      actionForm.body(
        `${pokemonData.health} HP Level: ${pokemonData.level}\n§c${error}`
      );
      actionForm.button("Trash Pokemon", "textures/ui/gui/pokeball");
      actionForm.button("Swap Pokemon", "textures/ui/gui/pokeball");

      actionForm.show(player).then(({ isCanceled, selection }) => {
        if (isCanceled) return;

        switch (selection) {
          case 0:
            // trash pokemon
            let confirmMessage = new MessageFormData();
            confirmMessage.body(
              `Are you sure you want to release ${
                pokemon[pokemonData.id].name
              }\nThis will spawn the pokemon out into the wild and you will have to capture it`
            );
            confirmMessage.button1("confirm");
            confirmMessage.button2("back");
            confirmMessage.show(player).then(({ isCanceled, selection }) => {
              try {
                if (isCanceled) return;
                switch (selection) {
                  case 0:
                    this.open(player);
                    break;
                  case 1:
                    this.removePcPokemon(player, index);
                    break;

                  default:
                    break;
                }
              } catch (error) {
                console.warn(error + error.stack);
              }
            });

            break;
          case 1:
            // swap pokemon
            if (SlotsBuild.ammountOfPokemon(player) >= 6) {
              return this.pokemonPage(
                player,
                index,
                "You do not have a open slot!"
              );
            }
            let confirmMessage3 = new MessageFormData();
            confirmMessage3.body(
              `Are you sure you want to transfer ${
                pokemon[pokemonData.id].name
              } to your poke-slots\nThis will remove it from your PC`
            );
            confirmMessage3.button1("confirm");
            confirmMessage3.button2("back");
            confirmMessage3.show(player).then(({ isCanceled, selection }) => {
              try {
                if (isCanceled) return;
                switch (selection) {
                  case 0:
                    this.open(player);
                    break;
                  case 1:
                    const playersSlots = SlotsBuild.getSlots(player);
                    let fillslot = playersSlots.length + 1;
                    const nullElement = playersSlots.find(
                      (elm) => elm.id === null
                    );
                    if (nullElement) {
                      fillslot = playersSlots.indexOf(nullElement) + 1;
                    }
                    SlotsBuild.setSlot(player, fillslot, pokemonData);
                    SA.build.chat.broadcast(
                      `transfered pokemon to slots!`,
                      player.nameTag
                    );
                    this.removePcPokemon(player, index);
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
      });
    } catch (error) {
      console.warn(error + error.stack);
    }
  }

  getPcPokemon(player) {
    const pokemonData =
      player
        .getTags()
        .find((tag) => tag.toString().match(/pokePC:\[([\s\S]*?)\]/g))
        ?.substring(7) ?? JSON.stringify([]);
    return JSON.parse(pokemonData);
  }

  addPcPokemon(player, data) {
    let pokemonData = this.getPcPokemon(player);

    player.removeTag(`pokePC:${JSON.stringify(pokemonData)}`);
    pokemonData.push(data);
    player.addTag(`pokePC:${JSON.stringify(pokemonData)}`);
  }

  removePcPokemon(player, index) {
    let pokemonData = this.getPcPokemon(player);

    player.removeTag(`pokePC:${JSON.stringify(pokemonData)}`);
    pokemonData.splice(index, 1);
    player.addTag(`pokePC:${JSON.stringify(pokemonData)}`);
  }
}
export const PcBuild = new PcBuilder();
