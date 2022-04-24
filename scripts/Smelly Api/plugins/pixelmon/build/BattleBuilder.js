import {
  Entity,
  Location,
  MinecraftEffectTypes,
  Player,
  TickEvent,
  Vector,
  world,
} from "mojang-minecraft";
import * as SA from "../../../index.js";
import {
  ActionFormData,
  ModalFormData,
  MessageFormData,
} from "mojang-minecraft-ui";
import { SlotsBuild } from "./SlotsBuilder.js";
import { pokemon } from "../pokemon.js";
import { Pokemon, PokemonBuild } from "./PokemonBuilder.js";
import { trainers } from "../trainers.js";

const peopleBattling = [];
const pokemonBattling = [];
const trainersBattling = [];
const pokeballs = {
  poke: 255,
  great: 200,
  ultra: 150,
};

const ballMultiplyers = {
  poke: 1.0,
  great: 1.5,
  ultra: 2.0,
};

export class Battle {
  static battler = {};
  static pokemon = {};
  static slot = 0;
  /**
   * Broadcast a message in chat
   * @param {Player} battler Message you want to broadcast in chat
   * @param {Entity} pokemon Player you want to broadcast to
   */
  constructor(battler, pokemon, trainer = null) {
    if (peopleBattling.includes(battler.nameTag))
      throw new Error("Player is already in a battle");
    if (pokemonBattling.includes(pokemon))
      throw new Error("Pokemon is already in a battle");

    this.battler = battler;
    this.pokemon = pokemon;
    if (trainer) {
      this.trainer = trainer;
    }
    this.round = 1;
    this.start();
    this.battler.runCommand(`music play battle.music 1 0 loop`);
    this.battler.playSound("battle.music");
    this.tickcallback = world.events.tick.subscribe((TickEvent) => {
      try {
        if (this.pokemon.getComponent("minecraft:health").current <= 0) {
          this.pokemonDied();
        }
        this.pokemon.teleportFacing(
          this.pokemon.location,
          this.pokemon.dimension,
          this.battler.location
        );
      } catch (error) {}
    });
  }

  start() {
    peopleBattling.push(this.battler.nameTag);
    pokemonBattling.push(this.pokemon);
    if (this.trainer) trainersBattling.push(this.trainer);
    this.choosePokemonMenu();
  }

  end(how = null) {
    try {
      SA.build.chat.broadcast(`The Battle has Ended`, this.battler.nameTag);
      this.battler.runCommand(`music stop 3`);
      if (this.trainer) {
        this.pokemon.triggerEvent("despawn");
        this.trainer.triggerEvent("despawn");
        trainersBattling.splice(this.trainer);
        if (how === "win") {
          SA.build.chat.broadcast(
            `<${
              trainers[this.trainer.id].name
            }> Not as invincible as I thought..`,
            this.battler.nameTag
          );
        } else if (how === "lose") {
          SA.build.chat.broadcast(
            `<${trainers[this.trainer.id].name}> I did warn you! Nice try.`,
            this.battler.nameTag
          );
        }
      }
      peopleBattling.splice(this.battler.nameTag);
      pokemonBattling.splice(this.pokemon);
      world.events.tick.unsubscribe(this.tickcallback);
    } catch (error) {}
  }

  pokemonDied() {
    try {
      this.giveXP();
      if (this.trainer) {
        if (this.round >= trainers[this.trainer.id].pokemon.length) {
          // battle is over and player won
          return this.end("win");
        }
        // battle needs to continue
        console.warn(
          `round ${this.round} pokemon ${this.pokemon.id} trainer ${
            this.trainer.id
          } ${JSON.stringify(trainers[this.trainer.id].pokemon)}`
        );
        this.round++;
        console.warn(trainers[this.trainer.id].pokemon[this.round - 1]);
        this.pokemon = this.trainer.dimension.spawnEntity(
          trainers[this.trainer.id].pokemon[this.round - 1],
          this.trainer.location
        );
        console.warn(`round ${this.round} pokemon ${this.pokemon.id}`);
        return this.base_menu(
          `${trainers[this.trainer.id].name} Changed there pokemon to ${
            pokemon[trainers[this.trainer.id].pokemon[this.round - 1]].name
          }`
        );
      } else {
        return this.end();
      }
    } catch (error) {
      console.warn(error + error.stack);
    }
  }

  giveXP() {
    const a = 1;
    const b =
      pokemon[SlotsBuild.getSlot(this.battler, this.slot).id].base_experience;
    const e = 1;
    const f = 1;
    const L =
      parseInt(
        this.pokemon
          .getTags()
          .find((tag) => tag.startsWith("level:"))
          ?.substring(6) ?? "1"
      ) ?? 1;
    const p = 1;
    const s = 1;
    const t = 1;
    const v = 1;
    const exp = Math.round((a * t * b * e * L * p * f * v) / (7 * s));
    SlotsBuild.addXp(this.battler, this.slot, exp);
    SA.build.chat.broadcast(
      `Your Pokemon ${
        pokemon[SlotsBuild.getSlot(this.battler, this.slot).id].name
      } Has Gained §e${exp}§f XP!`,
      this.battler.nameTag
    );
  }

  choosePokemonMenu(error = "") {
    if (SlotsBuild.ammountDead >= 6 && this.trainer) return this.end(`lose`);
    let actionForm = new ActionFormData();

    actionForm.title("Battle Menu");
    actionForm.body(`Please Select a Pokemon to battle\n§c${error}`);
    const slots = SlotsBuild.getSlots(this.battler);
    if (slots == null)
      return (
        SA.build.chat.broadcast(
          `You need a pokemon to battle!`,
          this.battler.nameTag
        ),
        this.end()
      );
    for (const slot of slots) {
      actionForm.button(
        pokemon[slot.id]?.name ?? "Empty",
        pokemon[slot.id]?.icon ?? ""
      );
    }

    actionForm.show(this.battler).then(({ isCanceled, selection }) => {
      if (isCanceled) return this.end();
      if (SlotsBuild.getSlot(this.battler, selection + 1).id == null)
        return this.choosePokemonMenu("That slot is empty");

      if (SlotsBuild.isDead(this.battler, selection + 1))
        return this.choosePokemonMenu(
          `${
            pokemon[SlotsBuild.getSlot(this.battler, selection + 1).id].name
          } Is Dead you cannot use it!`
        );

      this.slot = selection + 1;
      this.base_menu();
    });
  }

  base_menu(error = "") {
    const pokemonslotdata = SlotsBuild.getSlot(this.battler, this.slot);
    let actionForm = new ActionFormData();

    actionForm.title("Battle Menu");
    actionForm.body(
      `Your, ${pokemon[pokemonslotdata.id].name} Lv: ${
        pokemonslotdata.level
      }, HP: ${pokemonslotdata.health}\n\nOpponent, ${
        pokemon[this.pokemon.id].name
      } Lv: ${
        parseInt(
          this.pokemon
            .getTags()
            .find((tag) => tag.startsWith("level:"))
            ?.substring(6) ?? "1"
        ) ?? 1
      }, HP: ${
        this.pokemon.getComponent("minecraft:health").current
      }\n\nWhat will ${pokemon[pokemonslotdata.id].name} do?\n§c${error}`
    );
    actionForm.button("Fight"); // opens up attack moves
    actionForm.button("Bag"); // potions
    actionForm.button("Run"); // quits fight
    actionForm.button("Pokemon"); //switches pokemon

    actionForm.show(this.battler).then(({ isCanceled, selection }) => {
      if (isCanceled) return this.base_menu("To end the battle click RUN");

      switch (selection) {
        case 0:
          this.fight_menu();
          break;
        case 1:
          this.bag_menu();
          break;
        case 2:
          if (this.trainer) return this.end(`lose`);
          this.end();
          break;
        case 3:
          this.choosePokemonMenu();
          break;
        default:
          break;
      }
    });
  }

  bag_menu(error = "") {
    let actionForm = new ActionFormData();

    actionForm.title("Bag Menu");
    actionForm.body(`§c${error}`);
    actionForm.button("Status Restore"); // opens up attack moves
    actionForm.button("Poke Balls"); // potions
    actionForm.button("Battle Items"); // quits fight
    actionForm.button("HP/PP Restore"); //switches pokemon

    actionForm.show(this.battler).then(({ isCanceled, selection }) => {
      if (isCanceled) return this.base_menu();

      switch (selection) {
        case 0:
          this.bag_menu(`Status Restore is Coming soon`);
          break;
        case 1:
          this.pokeBalls_menu();
          break;
        case 2:
          this.bag_menu(`Battle Items are Coming soon`);
          break;
        case 3:
          this.HP_PP_Restore();
          break;
        default:
          break;
      }
    });
  }

  pokeBalls_menu(error = "") {
    try {
      let pokeball = 0;
      let greatball = 0;
      let masterball = 0;
      let ultraball = 0;
      let inventory = this.battler.getComponent(
        "minecraft:inventory"
      ).container;
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
      let actionForm = new ActionFormData();

      actionForm.title("Pokeballs");
      actionForm.body(`§c${error}`);
      actionForm.button(`Pokeballs x${pokeball}`, "textures/items/ball/poke"); // opens up attack moves
      actionForm.button(
        `Greatballs x${greatball}`,
        "textures/items/ball/great"
      ); // opens up attack moves
      actionForm.button(
        `Masterballs x${masterball}`,
        "textures/items/ball/master"
      ); // opens up attack moves
      actionForm.button(
        `Ultraballs x${ultraball}`,
        "textures/items/ball/ultra"
      ); // opens up attack moves

      actionForm.show(this.battler).then(({ isCanceled, selection }) => {
        if (isCanceled) return this.bag_menu();

        switch (selection) {
          case 0:
            if (pokeball <= 0)
              return this.pokeBalls_menu("You dont have any pokeball's");
            this.pokemon_catch("poke");
            this.battler.runCommand(`clear @s ss:pokeball 0 1`);
            break;
          case 1:
            if (greatball <= 0)
              return this.pokeBalls_menu("You dont have any greatball's");
            this.pokemon_catch("great");
            this.battler.runCommand(`clear @s ss:greatball 0 1`);
            break;
          case 2:
            if (masterball <= 0)
              return this.pokeBalls_menu("You dont have any masterball's");
            this.pokemon_catch("master");
            this.battler.runCommand(`clear @s ss:masterball 0 1`);
            break;
          case 3:
            if (ultraball <= 0)
              return this.pokeBalls_menu("You dont have any ultraball's");
            this.pokemon_catch("ultra");
            this.battler.runCommand(`clear @s ss:ultraball 0 1`);
            break;
          default:
            break;
        }
      });
    } catch (error) {
      console.warn(error + error.stack);
    }
  }
  HP_PP_Restore(error = "") {
    try {
      const heal_itmes = [
        {
          item: "ss:potion",
          heal_amount: 20,
          pp: 0,
        },
        {
          item: "ss:super_potion",
          heal_amount: 50,
          pp: 0,
        },
        {
          item: "ss:hyper_potion",
          heal_amount: 200,
          pp: 0,
        },
        {
          item: "ss:max_potion",
          heal_amount: 99999,
          pp: 0,
        },
        {
          item: "ss:moomoo_milk",
          heal_amount: 100,
          pp: 0,
        },
        {
          item: "ss:oran_berry",
          heal_amount: 15,
          pp: 0,
        },
        {
          item: "ss:sitrus_berry",
          heal_amount: 30,
          pp: 0,
        },
        {
          item: "ss:mago_berry",
          heal_amount: 12,
          pp: 0,
        },
        {
          item: "ss:lemonade",
          heal_amount: 70,
          pp: 0,
        },
        {
          item: "ss:ragecandybar",
          heal_amount: 20,
          pp: 0,
        },
        {
          item: "ss:freshwater",
          heal_amount: 30,
          pp: 0,
        },
      ];
      let actionForm = new ActionFormData();

      actionForm.title("HP/PP Restore");
      actionForm.body(`§c${error}`);

      let inventory = this.battler.getComponent(
        "minecraft:inventory"
      ).container;
      let ammounts = [];
      for (const healItem of heal_itmes) {
        let ammount = 0;
        for (let i = 0; i < inventory.size; i++) {
          let item = inventory.getItem(i);
          if (!item) continue;
          if (healItem.item === item.id) ammount += item.amount;
        }
        actionForm.button(
          `${healItem.item.substring(3).replace("_", " ")} x${ammount}`,
          `textures/items/${healItem.item.substring(3)}`
        );
        ammounts.push(ammount);
      }

      actionForm.show(this.battler).then(({ isCanceled, selection }) => {
        if (isCanceled) return this.bag_menu();
        if (ammounts[selection] == 0) return this.HP_PP_Restore();

        SlotsBuild.setSlotsHealth(
          this.battler,
          this.slot,
          SlotsBuild.getSlot(this.battler, this.slot).health +
            heal_itmes[selection].heal_amount
        );
        this.battler.runCommand(`clear @s ${heal_itmes[selection].item} 0 1`);

        SA.build.chat.broadcast(
          `Waiting for pokemon to attack...`,
          this.battler.nameTag
        );
        SA.untils.setTickTimeout(() => {
          this.pokemonAttack();
        }, 40);
      });
    } catch (error) {
      console.warn(error + error.stack);
    }
  }
  pokemon_catch(ball) {
    try {
      const slots = SlotsBuild.getSlots(this.battler);
      if (slots.length >= 6 && slots.every((elem) => elem.id !== null))
        return this.bag_menu(`all your slots are full!`);
      if (ball == "master") return this.capturePokemon(ball);
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
        SA.build.chat.broadcast(`Pokemon Broke Free`, this.battler.nameTag);
        this.pokemon.triggerEvent("despawn");
        return this.end();
      }
      const M = Math.floor(Math.random() * (255 + 1));
      let Ball = ball === "great" ? 8 : 12;
      let f = (MAX_HEALTH * 255 * 4) / (CURRENT_HEALTH * Ball);
      f < 1 ? (f = 1) : f > 255 ? (f = 255) : (f = f);
      if (f >= M) {
        // pokemon is caught
        return this.capturePokemon(ball);
      } else {
        // broke free caculate shake chance
        Ball = ball === "poke" ? 255 : ball === "great" ? 200 : 150;
        const d = (pokemon[this.pokemon.id].catch_rate * 100) / Ball;

        if (d >= 256) {
          // ball will shake 3 times
          this.pokemon.runCommand(
            `summon ss:${ball}ballcapture ~~~ ss:tick2catch`
          );
          this.pokemon.triggerEvent("despawn");
        } else {
          const x = (d * f) / 255;
          if (x < 10) {
            // ball is missed completly
            SA.build.chat.broadcast(`Ball was missed`, this.battler.nameTag);
          } else if (x < 30) {
            // ball shakes once
            this.pokemon.runCommand(
              `summon ss:${ball}ballcapture ~~~ ss:tick1catch`
            );
            this.pokemon.triggerEvent("despawn");
          } else if (x < 70) {
            // ball shakes twice
            this.pokemon.runCommand(
              `summon ss:${ball}ballcapture ~~~ ss:tick2catch`
            );
            this.pokemon.triggerEvent("despawn");
          } else {
            // ball shakes 3 times
            this.pokemon.runCommand(
              `summon ss:${ball}ballcapture ~~~ ss:tick3catch`
            );
            this.pokemon.triggerEvent("despawn");
          }
        }
      }
    } catch (error) {
      console.warn(error + error.stack);
    }
  }

  capturePokemon(ball) {
    try {
      const playersSlots = SlotsBuild.getSlots(this.battler);
      let fillslot = playersSlots.length + 1;
      const nullElement = playersSlots.find((elm) => elm.id === null);
      if (nullElement) {
        fillslot = playersSlots.indexOf(nullElement) + 1;
      }
      SlotsBuild.setSlot(this.battler, fillslot, {
        id: this.pokemon.id,
        level:
          parseInt(
            this.pokemon
              .getTags()
              .find((tag) => tag.startsWith("level:"))
              ?.substring(6) ?? "1"
          ) ?? 1,
        xp: 0,
        health: this.pokemon.getComponent("minecraft:health").current,
        usedAttacks: {},
      });
      this.pokemon.runCommand(
        `summon ss:${ball}ballcapture ~~~ ss:confirmedcap`
      );
      SA.build.chat.broadcast(`Captured ${pokemon[this.pokemon.id].name}!`);
      this.pokemon.triggerEvent("despawn");
      this.end();
    } catch (error) {
      console.warn(error + error.stack);
    }
  }

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

  getBattlerSlotLevel() {
    return parseInt(SlotsBuild.getSlot(this.battler, this.slot).level);
  }

  damageAmmount(attackData, battler) {
    try {
      // returns the damage ammount the attack should do
      const slotData = SlotsBuild.getSlot(this.battler, this.slot);
      // const BattleSlotLevel = this.getBattlerSlotLevel();
      // const pokemonLevel = this.getPokemonLevel();
      const Level = battler
        ? this.getBattlerSlotLevel()
        : this.getPokemonLevel();
      const A = battler
        ? pokemon[slotData.id].stats["attack"]
        : pokemon[this.pokemon.id].stats["attack"];
      const D = battler
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

  pokemonAttack() {
    const moves = pokemon[this.pokemon.id].moves.filter(
      (attack) => attack.level <= this.getPokemonLevel()
    );
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    const moveDamage = this.damageAmmount(randomMove, false);
    SlotsBuild.setSlotsHealth(
      this.battler,
      this.slot,
      SlotsBuild.getSlot(this.battler, this.slot).health - moveDamage
    );
    if (SlotsBuild.getSlot(this.battler, this.slot).health <= 0) {
      // pokemon is dead
      return this.base_menu(
        `Pokemon Used the Attack: ${
          randomMove.name
        } And Deduced ${moveDamage} HP from ${
          pokemon[SlotsBuild.getSlot(this.battler, this.slot).id].name
        }\nYour pokemon died please switch your pokemon`
      );
    }
    this.base_menu(
      `Pokemon Used the Attack: ${
        randomMove.name
      } And Deduced ${moveDamage} HP from ${
        pokemon[SlotsBuild.getSlot(this.battler, this.slot).id].name
      }`
    );
  }

  fight_menu() {
    try {
      if (SlotsBuild.getSlot(this.battler, this.slot).health <= 0) {
        // players pokemon is dead
        return this.base_menu(
          `That Pokemon is Dead and cannot fight please switch pokemon`
        );
      }
      let actionForm = new ActionFormData();

      actionForm.title("Battle Menu");
      actionForm.body(`What Move you want to run`);
      const allowedAttacks = pokemon[
        SlotsBuild.getSlot(this.battler, this.slot).id
      ].moves
        .filter(
          (attack) =>
            attack.level < SlotsBuild.getSlot(this.battler, this.slot).level &&
            parseInt(
              SlotsBuild.usedAttacks(this.battler, this.slot)[attack.name] ?? 1
            ) > 0
        )
        ?.slice(-4);
      if (allowedAttacks.length == 0)
        return this.base_menu(
          `You have no attacks to use, please heal your pokemon to restore its PP`
        );
      for (const attack of allowedAttacks) {
        actionForm.button(
          `${SA.untils.capitalize(attack.name.replace("-", " "), true)}\n${
            attack.power
          } Power, ${
            SlotsBuild.usedAttacks(this.battler, this.slot)[attack.name] ??
            attack.pp
          } PP`,
          attack.icon
        );
      }

      actionForm.show(this.battler).then(({ isCanceled, selection }) => {
        if (isCanceled) return this.base_menu();
        SlotsBuild.usedAttack(
          this.battler,
          this.slot,
          allowedAttacks[selection].name
        );
        PokemonBuild.set_health(
          this.pokemon,
          this.pokemon.getComponent("minecraft:health").current -
            this.damageAmmount(allowedAttacks[selection], true)
        );
        if (this.pokemon.getComponent("minecraft:health").current <= 0) {
          return;
        }
        // used attack
        SA.build.chat.broadcast(
          `Waiting for pokemon to attack...`,
          this.battler.nameTag
        );
        SA.untils.setTickTimeout(() => {
          this.pokemonAttack();
        }, 40);
      });
    } catch (error) {
      console.warn(error + error.stack);
    }
  }
}
