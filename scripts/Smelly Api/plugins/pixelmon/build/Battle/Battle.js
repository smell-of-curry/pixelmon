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

/**
 * An array of all the battles currently active
 * @type {Array<Battle>}
 */
const BATTLES = [];

export class Battle {
  /**
   * The entity fighting warrior2
   * @type {Entity}
   */
  static warrior1 = {};
  /**
   * The entity fighting warrior1
   * @type {Entity}
   */
  static warrior2 = {};

  /**
   * Creates a new Battle
   * @param {Entity} warrior1 The entity fighting warrior2
   * @param {Entity} warrior2 The entity fighting warrior1
   */
  constructor(warrior1, warrior2) {
    this.warrior1 = warrior1;
    this.warrior2 = warrior2;

    this.alreadyInBattle();
  }

  /**
   * Checks if warrior1, and warrior two are in a battle
   */
  alreadyInBattle() {
    if (BATTLES.find((battle) => battle.warrior1 == this.warrior1)) {
      throw new Error("Warrior 1 is already in a battle");
    }
    if (BATTLES.find((battle) => battle.warrior2 == this.warrior2)) {
      throw new Error("Warrior 2 is already in a battle");
    }
  }

  /**
   * Starts a battle
   */
  start() {
    BATTLES.push(this);
  }

  /**
   * Ends The current Battle
   */
  end() {
    BATTLES.splice(BATTLES.indexOf(this));
  }
}


