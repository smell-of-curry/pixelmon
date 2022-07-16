import { Entity, Player, world } from "mojang-minecraft";
import {
  ActionFormData,
  ModalFormData,
  MessageFormData,
} from "mojang-minecraft-ui";
import { heal_itmes } from "../../api/healables.js";
import { pokemon } from "../../api/pokemon.js";
import { SlotsBuild } from "../SlotsBuilder.js";
import * as SA from "../../../../index.js";
import { PokemonBuild } from "../PokemonBuilder.js";
import { trainers } from "../../api/trainers.js";
import { Battle } from "./Battle.js";

export class PlayerVsPlayer extends Battle {
  /**
   * Starts a Player vs trainer battle
   * @param {Player} player1
   * @param {Player} player2
   */
  constructor(player1, player2) {
    super(player1, player2);
    this.player1 = player1;
    this.player2 = player2;
    this.player1Slot = null;
    this.player2Slot = null;

    this.playerWhoHasTurn = player1;

    this.start();

    this.events = {
      playerLeave: world.events.playerLeave.subscribe(({ playerName }) => {
        if (
          playerName == this.player1.name ||
          playerName == this.player2.name
        ) {
          super.end();
        }
      }),
    };
  }

  end(how = null) {
    SA.build.chat.broadcast(`The Battle has ended`, this.player1.nameTag);
    SA.build.chat.broadcast(`The Battle has ended`, this.player2.nameTag);
    super.end();
  }

  start() {
    super.start();
    let callback = world.events.tick.subscribe((data) => {
      try {
        if (this.player1.velocity.length() > 0.0785) {
          this.menu1(this.player1);
          world.events.tick.unsubscribe(callback);
        }
      } catch (error) {}
    });
    let callback2 = world.events.tick.subscribe((data) => {
      try {
        if (this.player2.velocity.length() > 0.0785) {
          this.menu1(this.player2);
          world.events.tick.unsubscribe(callback2);
        }
      } catch (error) {}
    });
  }

  /**
   * Gets the pokemons level
   * @returns {Number}
   */
  getPokemonLevel() {
    const Level =
      parseInt(
        this.pokemon
          .getTags()
          .find((tag) => tag.startsWith("level:"))
          ?.substring(6) ?? "1"
      ) ?? 1;
    return Level ?? 1;
  }

  /**
   * Gets the players pokemons slot level
   * @returns {Number}
   */
  getplayerSlotLevel(player) {
    return parseInt(
      SlotsBuild.getSlot(
        player,
        this.playerWhoHasTurn.name == this.player1.name
          ? this.player1Slot
          : this.player2Slot
      ).level
    );
  }

  /**
   * Switches the turn from the current turn holder\
   * @param {String} data stuff to pass onto the screen
   */
  turn(data = "") {
    if (this.playerWhoHasTurn.name == this.player1.name) {
      this.playerWhoHasTurn = this.player2;
      this.menu2(this.player2, data);
      SA.build.chat.broadcast(
        `Waiting for ${this.player1.name} to attack...`,
        this.player2.nameTag
      );
    } else {
      this.playerWhoHasTurn = this.player1;
      this.menu2(this.player1, data);
      SA.build.chat.broadcast(
        `Waiting for ${this.player2.name} to attack...`,
        this.player1.nameTag
      );
    }
  }

  /**
   * Caculates the damage ammount a
   * @param {String} ball the ball type
   */
  damageAmmount(attackData) {
    try {
      // returns the damage ammount the attack should do
      const slotData = SlotsBuild.getSlot(
        this.playerWhoHasTurn,
        this.playerWhoHasTurn.name == this.player1.name
          ? this.player1Slot
          : this.player2Slot
      );
      // const BattleSlotLevel = this.getplayerSlotLevel();
      // const pokemonLevel = this.getPokemonLevel();
      const Level = slotData.level;
      const A = pokemon[slotData.id].stats["attack"];
      const D = pokemon[slotData.id].stats["defense"];
      const Power = attackData.power;
      const Targets = 1;
      const Weather = 1;
      const Badge = 1;
      const Critical = 1;
      const random = Math.floor(Math.random() * (1.0 - 0.85 + 1)) + 0.85;
      const STAB = 1;
      const Type = 1;
      const Burn = 1;
      const other = 1;
      let Damage =
        ((((2 * Level) / 5 + 2) * Power * (A / D)) / 50 + 2) *
        Targets *
        Weather *
        Badge *
        Critical *
        random *
        STAB *
        Type *
        Burn *
        other;
      if (isNaN(Damage)) Damage = 5;
      return Math.round(Damage ?? 5);
    } catch (error) {
      console.warn(error + error.stack);
    }
  }

  awaitToShowMenu2() {
    SA.build.chat.broadcast(
      `Waiting for both players to select a pokemon to start battle`,
      this.player1.nameTag
    );
    SA.build.chat.broadcast(
      `Waiting for both players to select a pokemon to start battle`,
      this.player2.nameTag
    );
    let a = world.events.tick.subscribe((data) => {
      if (this.player1Slot && this.player2Slot) {
        this.menu2(this.playerWhoHasTurn);
        world.events.tick.unsubscribe(a);
      }
    });
  }

  /**
   * This is the choose pokemon page, displays a page where a player can select a pokemon to battle the pokemon
   * @param {Player} player to show menu to
   * @param {String} error an error to be displayed on the form
   */
  menu1(player, error = "") {
    let form = new ActionFormData();

    form.title("Battle Menu");
    form.body(`Please Select a Pokemon to battle\n§c${error}`);
    const slots = SlotsBuild.getSlots(player);
    if (slots == null)
      return (
        SA.build.chat.broadcast(
          `You need a pokemon to battle!`,
          player.nameTag
        ),
        super.end()
      );
    for (const slot of slots) {
      form.button(
        pokemon[slot.id]?.name ?? "Empty",
        pokemon[slot.id]?.icon ?? ""
      );
    }

    form.show(player).then(({ isCanceled, selection }) => {
      if (isCanceled) return this.end("lose");
      if (SlotsBuild.getSlot(player, selection + 1).id == null)
        return this.menu1(player, "That slot is empty");

      if (SlotsBuild.isDead(player, selection + 1))
        return this.menu1(
          player,
          `${
            pokemon[SlotsBuild.getSlot(player, selection + 1).id].name
          } Is Dead you cannot use it!`
        );

      if (player.name == this.player1.name) {
        this.player1Slot = selection + 1;
      } else {
        this.player2Slot = selection + 1;
      }
      this.awaitToShowMenu2(player);
    });
  }
  /**
   * This is the menu that displays the selections like fight, bag, run, and pokemon
   * @param {Player} player to show menu to
   * @param {String} error an error to be displayed on the form
   */
  menu2(player, error = "") {
    const pokemonslotdata = SlotsBuild.getSlot(
      player,
      player.name == this.player1.name ? this.player1Slot : this.player2Slot
    );
    const otherPokemonslotdata = SlotsBuild.getSlot(
      player.name == this.player1.name ? this.player2 : this.player1,
      player.name == this.player1.name ? this.player2Slot : this.player1Slot
    );
    let form = new ActionFormData();

    form.title("Battle Menu");
    form.body(
      `Your, ${pokemon[pokemonslotdata.id].name} Lv: ${
        pokemonslotdata.level
      }, HP: ${pokemonslotdata.health}\n\nOpponent, ${
        pokemon[otherPokemonslotdata.id].name
      } Lv: ${otherPokemonslotdata.level}, HP: ${
        otherPokemonslotdata.health
      }\n\nWhat will ${pokemon[pokemonslotdata.id].name} do?\n§c${error}`
    );

    if (pokemonslotdata.health > 0) {
      form.button("Fight"); // opens up attack moves
      form.button("Bag"); // potions
    }
    form.button("Run"); // quits fight
    form.button("Pokemon"); //switches pokemon

    form.show(player).then(({ isCanceled, selection }) => {
      if (isCanceled) return this.menu2(player, "To end the battle click RUN");

      if (pokemonslotdata.health > 0) {
        switch (selection) {
          case 0:
            this.menu6(player);
            break;
          case 1:
            this.menu3(player);
            break;
          case 2:
            this.end();
            break;
          case 3:
            this.menu1(player);
            break;
          default:
            break;
        }
      } else {
        switch (selection) {
          case 0:
            this.end();
            break;
          case 1:
            this.menu1(player);
            break;
          default:
            break;
        }
      }
    });
  }

  /**
   * This menu shows the bag of the player, they can use pokeballs status restore, etc
   * @param {Player} player to show menu to
   * @param {String} error an error to be displayed on the form
   */
  menu3(player, error = "") {
    let form = new ActionFormData();

    form.title("Bag Menu");
    form.body(`§c${error}`);
    form.button("Status Restore"); // opens up attack moves
    form.button("Battle Items"); // quits fight
    form.button("HP/PP Restore"); //switches pokemon

    form.show(player).then(({ isCanceled, selection }) => {
      if (isCanceled) return this.menu2(player);

      switch (selection) {
        case 0:
          this.menu3(player, `Status Restore is Coming soon`);
          break;
        case 1:
          this.menu3(player, `Battle Items are Coming soon`);
          break;
        case 2:
          this.menu5(player);
          break;
        default:
          break;
      }
    });
  }

  /**
   * This menu shows the various heal items that can be used to heal the players pokemon
   * @param {Player} player to show menu to
   * @param {String} error an error to be displayed on the form
   */
  menu5(player, error = "") {
    try {
      let form = new ActionFormData();

      form.title("HP/PP Restore");
      form.body(`§c${error}`);

      let inventory = player.getComponent("minecraft:inventory").container;
      let ammounts = [];
      for (const healItem of heal_itmes) {
        let ammount = 0;
        for (let i = 0; i < inventory.size; i++) {
          let item = inventory.getItem(i);
          if (!item) continue;
          if (healItem.item === item.id) ammount += item.amount;
        }
        form.button(
          `${healItem.item.substring(3).replace("_", " ")} x${ammount}`,
          `textures/items/${healItem.item.substring(3)}`
        );
        ammounts.push(ammount);
      }

      form.show(player).then(({ isCanceled, selection }) => {
        if (isCanceled) return this.menu3(player);
        if (ammounts[selection] == 0) return this.menu5(player);

        const slot =
          player.name == this.player1.name
            ? this.player1Slot
            : this.player2Slot;
        SlotsBuild.setSlotsHealth(
          player,
          slot,
          SlotsBuild.getSlot(player, slot).health +
            heal_itmes[selection].heal_amount
        );
        player.runCommand(`clear @s ${heal_itmes[selection].item} 0 1`);

        this.turn();
      });
    } catch (error) {
      console.warn(error + error.stack);
    }
  }
  /**
   * This menu is for the player to select an attack against the pokemon
   * @param {Player} player to show menu to
   * @param {String} error an error to be displayed on the form
   */
  menu6(player) {
    try {
      let form = new ActionFormData();

      form.title("Battle Menu");
      form.body(`What Move you want to run`);
      const slot =
        player.name == this.player1.name ? this.player1Slot : this.player2Slot;
      const allowedAttacks = pokemon[SlotsBuild.getSlot(player, slot).id].moves
        .filter(
          (attack) =>
            attack.level < SlotsBuild.getSlot(player, slot).level &&
            parseInt(SlotsBuild.usedAttacks(player, slot)[attack.name] ?? 1) > 0
        )
        ?.slice(-4);
      if (allowedAttacks.length == 0)
        return this.menu2(
          player,
          `You have no attacks to use, please heal your pokemon to restore its PP`
        );
      for (const attack of allowedAttacks) {
        form.button(
          `${SA.untils.capitalize(attack.name.replace("-", " "), true)}\n${
            attack.power
          } Power, ${
            SlotsBuild.usedAttacks(player, slot)[attack.name] ?? attack.pp
          } PP`,
          attack.icon
        );
      }

      form.show(player).then(({ isCanceled, selection }) => {
        if (isCanceled) return this.menu2(player);
        SlotsBuild.usedAttack(player, slot, allowedAttacks[selection].name);
        const moveDamage = this.damageAmmount(allowedAttacks[selection]);
        const otherPlayer =
          player.name == this.player1.name ? this.player2 : this.player1;
        const otherPlayerSlot =
          player.name == this.player1.name
            ? this.player2Slot
            : this.player1Slot;
        SlotsBuild.setSlotsHealth(
          otherPlayer,
          otherPlayerSlot,
          SlotsBuild.getSlot(otherPlayer, otherPlayerSlot).health - moveDamage
        );
        this.turn(
          `${player.name} Used the Attack: ${
            allowedAttacks[selection].name
          } And Deduced ${moveDamage} HP from ${
            pokemon[SlotsBuild.getSlot(otherPlayer, otherPlayerSlot).id].name
          }`
        );
      });
    } catch (error) {
      console.warn(error + error.stack);
    }
  }
}
