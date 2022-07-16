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

export class PlayerVsTrainer extends Battle {
  /**
   * Starts a Player vs trainer battle
   * @param {Player} player
   * @param {Entity} trainer
   */
  constructor(player, trainer) {
    super(player, trainer);
    this.player = player;
    this.trainer = trainer;
    this.pokemon = null;

    this.round = 1;
    this.pokemonBattle = null;
    this.start();

    this.events = {
      tick: world.events.tick.subscribe((TickEvent) => {
        try {
          if (this.pokemon.getComponent("minecraft:health").current <= 0) {
            this.end();
          }
          this.pokemon.teleportFacing(
            this.pokemon.location,
            this.pokemon.dimension,
            this.player.location
          );
        } catch (error) {}
      }),
      playerLeave: world.events.playerLeave.subscribe(({ playerName }) => {
        if (playerName == this.player.name) {
          super.end();
        }
      }),
    };
  }

  end(how = null) {
    this.pokemon.triggerEvent("despawn");
    this.trainer.triggerEvent("despawn");
    if (how === "win") {
      SA.build.chat.broadcast(
        `<${trainers[this.trainer.id].name}> Not as invincible as I thought..`,
        this.player.nameTag
      );
    } else if (how === "lose") {
      SA.build.chat.broadcast(
        `<${trainers[this.trainer.id].name}> I did warn you! Nice try.`,
        this.player.nameTag
      );
    }
    super.end();
  }

  start() {
    const firstPokemon = this.trainer.dimension.spawnEntity(
      trainers[this.trainer.id].pokemon[0],
      this.trainer.location
    );
    this.pokemon = firstPokemon;
    super.start();
    this.menu1();
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
  getplayerSlotLevel() {
    return parseInt(SlotsBuild.getSlot(this.player, this.slot).level);
  }

  /**
   * Ends the current round and could start another one
   */
  roundEnd() {
    if (this.round >= trainers[this.trainer.id].pokemon.length) {
      // battle is over and player won
      return this.end("win");
    }
    // battle needs to continue
    this.round++;
    this.pokemon = this.trainer.dimension.spawnEntity(
      trainers[this.trainer.id].pokemon[this.round - 1],
      this.trainer.location
    );
    return this.menu2(
      `${trainers[this.trainer.id].name} Changed there pokemon to ${
        pokemon[trainers[this.trainer.id].pokemon[this.round - 1]].name
      }`
    );
  }

  /**
   * Switches the turn from the current turn holder
   * so if its the pokemons turn it will become the players turn, vise versa
   */
  turn() {
    SA.build.chat.broadcast(
      `Waiting for pokemon to attack...`,
      this.player.nameTag
    );
    SA.untils.setTickTimeout(() => {
      this.pokemonAttack();
    }, 40);
  }

  /**
   * Caculates the damage ammount a
   * @param {String} ball the ball type
   */
  damageAmmount(attackData, player) {
    try {
      // returns the damage ammount the attack should do
      const slotData = SlotsBuild.getSlot(this.player, this.slot);
      // const BattleSlotLevel = this.getplayerSlotLevel();
      // const pokemonLevel = this.getPokemonLevel();
      const Level = player ? this.getplayerSlotLevel() : this.getPokemonLevel();
      const A = player
        ? pokemon[slotData.id].stats["attack"]
        : pokemon[this.pokemon.id].stats["attack"];
      const D = player
        ? pokemon[slotData.id].stats["defense"]
        : pokemon[this.pokemon.id].stats["defense"];
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

  /**
   * Makes the pokemon attack the players slot
   */
  pokemonAttack() {
    const moves = pokemon[this.pokemon.id].moves.filter(
      (attack) => attack.level <= this.getPokemonLevel()
    );
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    const moveDamage = this.damageAmmount(randomMove, false);
    SlotsBuild.setSlotsHealth(
      this.player,
      this.slot,
      SlotsBuild.getSlot(this.player, this.slot).health - moveDamage
    );
    this.menu2(
      `Pokemon Used the Attack: ${
        randomMove.name
      } And Deduced ${moveDamage} HP from ${
        pokemon[SlotsBuild.getSlot(this.player, this.slot).id].name
      }`
    );
  }

  /**
   * This is the choose pokemon page, displays a page where a player can select a pokemon to battle the pokemon
   * @param {String} error an error to be displayed on the form
   */
  menu1(error = "") {
    if (SlotsBuild.ammountDead >= 6) return this.end(`lose`);
    let form = new ActionFormData();

    form.title("Battle Menu");
    form.body(`Please Select a Pokemon to battle\n§c${error}`);
    const slots = SlotsBuild.getSlots(this.player);
    if (slots == null)
      return (
        SA.build.chat.broadcast(
          `You need a pokemon to battle!`,
          this.player.nameTag
        ),
        super.end()
      );
    for (const slot of slots) {
      form.button(
        pokemon[slot.id]?.name ?? "Empty",
        pokemon[slot.id]?.icon ?? ""
      );
    }

    form.show(this.player).then(({ isCanceled, selection }) => {
      if (isCanceled) return this.end("lose");
      if (SlotsBuild.getSlot(this.player, selection + 1).id == null)
        return this.menu1("That slot is empty");

      if (SlotsBuild.isDead(this.player, selection + 1))
        return this.menu1(
          `${
            pokemon[SlotsBuild.getSlot(this.player, selection + 1).id].name
          } Is Dead you cannot use it!`
        );

      this.slot = selection + 1;
      this.menu2();
    });
  }
  /**
   * This is the menu that displays the selections like fight, bag, run, and pokemon
   * @param {String} error an error to be displayed on the form
   */
  menu2(error = "") {
    const pokemonslotdata = SlotsBuild.getSlot(this.player, this.slot);
    let form = new ActionFormData();

    form.title("Battle Menu");
    form.body(
      `Your, ${pokemon[pokemonslotdata.id].name} Lv: ${
        pokemonslotdata.level
      }, HP: ${pokemonslotdata.health}\n\nOpponent, ${
        pokemon[this.pokemon.id].name
      } Lv: ${this.getPokemonLevel()}, HP: ${
        this.pokemon.getComponent("minecraft:health").current
      }\n\nWhat will ${pokemon[pokemonslotdata.id].name} do?\n§c${error}`
    );

    if (SlotsBuild.getSlot(this.player, this.slot).health > 0) {
      form.button("Fight"); // opens up attack moves
      form.button("Bag"); // potions
    }
    form.button("Run"); // quits fight
    form.button("Pokemon"); //switches pokemon

    form.show(this.player).then(({ isCanceled, selection }) => {
      if (isCanceled) return this.menu2("To end the battle click RUN");

      if (SlotsBuild.getSlot(this.player, this.slot).health > 0) {
        switch (selection) {
          case 0:
            this.menu6();
            break;
          case 1:
            this.menu3();
            break;
          case 2:
            this.end();
            break;
          case 3:
            this.menu1();
            break;
          default:
            break;
        }
      } else {
        switch (selection) {
          case 0:
            this.end("lose");
            break;
          case 1:
            this.menu1();
            break;
          default:
            break;
        }
      }
    });
  }

  /**
   * This menu shows the bag of the player, they can use pokeballs status restore, etc
   * @param {String} error an error to be displayed on the form
   */
  menu3(error = "") {
    let form = new ActionFormData();

    form.title("Bag Menu");
    form.body(`§c${error}`);
    form.button("Status Restore"); // opens up attack moves
    form.button("Battle Items"); // quits fight
    form.button("HP/PP Restore"); //switches pokemon

    form.show(this.player).then(({ isCanceled, selection }) => {
      if (isCanceled) return this.menu2();

      switch (selection) {
        case 0:
          this.menu3(`Status Restore is Coming soon`);
          break;
        case 1:
          this.menu3(`Battle Items are Coming soon`);
          break;
        case 2:
          this.menu5();
          break;
        default:
          break;
      }
    });
  }

  /**
   * This menu shows the various heal items that can be used to heal the players pokemon
   * @param {String} error an error to be displayed on the form
   */
  menu5(error = "") {
    try {
      let form = new ActionFormData();

      form.title("HP/PP Restore");
      form.body(`§c${error}`);

      let inventory = this.player.getComponent("minecraft:inventory").container;
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

      form.show(this.player).then(({ isCanceled, selection }) => {
        if (isCanceled) return this.menu3();
        if (ammounts[selection] == 0) return this.menu5();

        SlotsBuild.setSlotsHealth(
          this.player,
          this.slot,
          SlotsBuild.getSlot(this.player, this.slot).health +
            heal_itmes[selection].heal_amount
        );
        this.player.runCommand(`clear @s ${heal_itmes[selection].item} 0 1`);

        this.turn();
      });
    } catch (error) {
      console.warn(error + error.stack);
    }
  }
  /**
   * This menu is for the player to select an attack against the pokemon
   * @param {String} error an error to be displayed on the form
   */
  menu6() {
    try {
      let form = new ActionFormData();

      form.title("Battle Menu");
      form.body(`What Move you want to run`);
      const allowedAttacks = pokemon[
        SlotsBuild.getSlot(this.player, this.slot).id
      ].moves
        .filter(
          (attack) =>
            attack.level < SlotsBuild.getSlot(this.player, this.slot).level &&
            parseInt(
              SlotsBuild.usedAttacks(this.player, this.slot)[attack.name] ?? 1
            ) > 0
        )
        ?.slice(-4);
      if (allowedAttacks.length == 0)
        return this.menu2(
          `You have no attacks to use, please heal your pokemon to restore its PP`
        );
      for (const attack of allowedAttacks) {
        form.button(
          `${SA.untils.capitalize(attack.name.replace("-", " "), true)}\n${
            attack.power
          } Power, ${
            SlotsBuild.usedAttacks(this.player, this.slot)[attack.name] ??
            attack.pp
          } PP`,
          attack.icon
        );
      }

      form.show(this.player).then(({ isCanceled, selection }) => {
        if (isCanceled) return this.menu2();
        SlotsBuild.usedAttack(
          this.player,
          this.slot,
          allowedAttacks[selection].name
        );
        PokemonBuild.set_health(
          this.pokemon,
          this.pokemon.getComponent("minecraft:health").current -
            this.damageAmmount(allowedAttacks[selection], true)
        );
        if (this.pokemon.getComponent("minecraft:health").current <= 0) {
          return this.roundEnd();
        }
        this.turn();
      });
    } catch (error) {
      console.warn(error + error.stack);
    }
  }
}
