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

export class PlayerVsPokemon extends Battle {
  /**
   * Creates a new Player vs player battle
   * @param {Player} player
   * @param {Entity} pokemon
   */
  constructor(player, pokemon) {
    super(player, pokemon);

    this.pokemon = pokemon;
    this.player = player;

    this.events = {
      tick: world.events.tick.subscribe((TickEvent) => {
        try {
          if (this.pokemon.getComponent("minecraft:health").current <= 0) {
            this.pokemonDied();
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
    super.start();
    this.menu1();
  }

  end() {
    this.pokemon.triggerEvent("despawn");
    super.end();
  }

  pokemonDied() {
    this.giveXP();
    this.end();
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

  giveXP() {
    const a = 1;
    const b =
      pokemon[SlotsBuild.getSlot(this.player, this.slot).id].base_experience;
    const e = 1;
    const f = 1;
    const L = this.getPokemonLevel();
    const p = 1;
    const s = 1;
    const t = 1;
    const v = 1;
    const exp = Math.round((a * t * b * e * L * p * f * v) / (7 * s));
    SlotsBuild.addXp(this.player, this.slot, exp);
    SA.build.chat.broadcast(
      `Your Pokemon ${
        pokemon[SlotsBuild.getSlot(this.player, this.slot).id].name
      } Has Gained §e${exp}§f XP!`,
      this.player.nameTag
    );
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
   * attempts to Captures this.pokemon
   * @param {String} ball the ball type
   */
  catch(ball) {
    try {
      const slots = SlotsBuild.getSlots(this.player);
      if (slots.length >= 6 && slots.every((elem) => elem.id !== null))
        return this.menu3(`all your slots are full!`);
      if (ball == "master") return this.capture(ball);
      const CURRENT_HEALTH =
        this.pokemon.getComponent("minecraft:health").current;
      const MAX_HEALTH = pokemon[this.pokemon.id].max_health;
      const N =
        ball === "poke"
          ? Math.floor(Math.random() * (255 + 1))
          : ball === "great"
          ? Math.floor(Math.random() * (200 + 1))
          : Math.floor(Math.random() * (150 + 1));
      if (N > pokemon[this.pokemon.id].catch_rate) {
        // pokemon breaks free
        SA.build.chat.broadcast(`Pokemon Broke Free`, this.player.nameTag);
        return this.end();
      }
      const M = Math.floor(Math.random() * (255 + 1));
      let Ball = ball === "great" ? 8 : 12;
      let f = (MAX_HEALTH * 255 * 4) / (CURRENT_HEALTH * Ball);
      f < 1 ? (f = 1) : f > 255 ? (f = 255) : (f = f);
      if (f >= M) {
        // pokemon is caught
        return this.capture(ball);
      } else {
        // broke free caculate shake chance
        Ball = ball === "poke" ? 255 : ball === "great" ? 200 : 150;
        const d = (pokemon[this.pokemon.id].catch_rate * 100) / Ball;

        if (d >= 256) {
          // ball will shake 3 times
          this.pokemon.runCommand(
            `summon ss:${ball}ballcapture ~~~ ss:tick2catch`
          );
          this.end();
        } else {
          const x = (d * f) / 255;
          if (x < 10) {
            // ball is missed completly
            SA.build.chat.broadcast(`Ball was missed`, this.player.nameTag);
            this.menu2();
          } else if (x < 30) {
            // ball shakes once
            this.pokemon.runCommand(
              `summon ss:${ball}ballcapture ~~~ ss:tick1catch`
            );
            this.end();
          } else if (x < 70) {
            // ball shakes twice
            this.pokemon.runCommand(
              `summon ss:${ball}ballcapture ~~~ ss:tick2catch`
            );
            this.end();
          } else {
            // ball shakes 3 times
            this.pokemon.runCommand(
              `summon ss:${ball}ballcapture ~~~ ss:tick3catch`
            );
            this.end();
          }
        }
      }
    } catch (error) {
      console.warn(error + error.stack);
    }
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
   * attempts to Captures this.pokemon
   * @param {String} ball the ball type
   */
  capture(ball) {
    try {
      const playersSlots = SlotsBuild.getSlots(this.player);
      let fillslot = playersSlots.length + 1;
      const nullElement = playersSlots.find((elm) => elm.id === null);
      if (nullElement) {
        fillslot = playersSlots.indexOf(nullElement) + 1;
      }
      SlotsBuild.setSlot(this.player, fillslot, {
        id: this.pokemon.id,
        level: this.getPokemonLevel(),
        xp: 0,
        health: this.pokemon.getComponent("minecraft:health").current,
        usedAttacks: {},
      });
      this.pokemon.runCommand(
        `summon ss:${ball}ballcapture ~~~ ss:confirmedcap`
      );
      SA.build.chat.broadcast(
        `Captured ${pokemon[this.pokemon.id].name}!`,
        this.player.nameTag
      );
      this.end();
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
      if (isCanceled) return this.end();
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
            this.end();
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
    form.button("Poke Balls"); // potions
    form.button("Battle Items"); // quits fight
    form.button("HP/PP Restore"); //switches pokemon

    form.show(this.player).then(({ isCanceled, selection }) => {
      if (isCanceled) return this.menu2();

      switch (selection) {
        case 0:
          this.menu3(`Status Restore is Coming soon`);
          break;
        case 1:
          this.menu4();
          break;
        case 2:
          this.menu3(`Battle Items are Coming soon`);
          break;
        case 3:
          this.menu5();
          break;
        default:
          break;
      }
    });
  }

  /**
   * This menu is the pokeballs menu, displays pokeballs and allows actions to be preformed
   * @param {String} error an error to be displayed on the form
   */
  menu4(error = "") {
    try {
      let pokeball = 0;
      let greatball = 0;
      let masterball = 0;
      let ultraball = 0;
      let inventory = this.player.getComponent("minecraft:inventory").container;
      for (let i = 0; i < inventory.size; i++) {
        let item = inventory.getItem(i);
        if (!item) continue;
        if (item.id === "ss:pokeball") {
          pokeball += item.amount;
        }
        if (item.id === "ss:greatball") {
          greatball += item.amount;
        }
        if (item.id === "ss:masterball") {
          masterball += item.amount;
        }
        if (item.id === "ss:ultraball") {
          ultraball += item.amount;
        }
      }
      let form = new ActionFormData();

      form.title("Pokeballs");
      form.body(`§c${error}`);
      form.button(`Pokeballs x${pokeball}`, "textures/items/ball/poke"); // opens up attack moves
      form.button(`Greatballs x${greatball}`, "textures/items/ball/great"); // opens up attack moves
      form.button(`Masterballs x${masterball}`, "textures/items/ball/master"); // opens up attack moves
      form.button(`Ultraballs x${ultraball}`, "textures/items/ball/ultra"); // opens up attack moves

      form.show(this.player).then(({ isCanceled, selection }) => {
        if (isCanceled) return this.menu3();

        switch (selection) {
          case 0:
            if (pokeball <= 0)
              return this.menu4("You dont have any pokeball's");
            this.catch("poke");
            this.player.runCommand(`clear @s ss:pokeball 0 1`);
            break;
          case 1:
            if (greatball <= 0)
              return this.menu4("You dont have any greatball's");
            this.catch("great");
            this.player.runCommand(`clear @s ss:greatball 0 1`);
            break;
          case 2:
            if (masterball <= 0)
              return this.menu4("You dont have any masterball's");
            this.catch("master");
            this.player.runCommand(`clear @s ss:masterball 0 1`);
            break;
          case 3:
            if (ultraball <= 0)
              return this.menu4("You dont have any ultraball's");
            this.catch("ultra");
            this.player.runCommand(`clear @s ss:ultraball 0 1`);
            break;
          default:
            break;
        }
      });
    } catch (error) {
      console.warn(error + error.stack);
    }
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
          return this.pokemonDied();
        }
        this.turn();
      });
    } catch (error) {
      console.warn(error + error.stack);
    }
  }
}
