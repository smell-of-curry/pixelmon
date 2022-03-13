import { world, BlockLocation } from "mojang-minecraft";
import { configuration } from "../../../config.js";
import * as SA from "../../../index.js";

const FILE_NAME = configuration.DATABASE.FILE_NAME;
const ENTITY_LOCATION = configuration.DATABASE.ENTITY_LOCATION;
const ENTITY_IDENTIFIER = configuration.DATABASE.ENTITY_IDENTIFIER;
const ON_SUMMON_EVENT = configuration.DATABASE.ON_SUMMON_EVENT;
const ON_SUMMON_NAME = configuration.DATABASE.ON_SUMMON_NAME;

export class Database {
  static tableName;
  /**
   * @param {String} table
   */
  constructor(table) {
    this.tableName = table;
    this.position = new BlockLocation(
      ENTITY_LOCATION.x,
      ENTITY_LOCATION.y,
      ENTITY_LOCATION.z
    );
    this._entity = null;
    if (this.tableName.includes("|")) {
      throw new Error("Prefix cannot contain |");
    }
    let TickCallback = world.events.tick.subscribe((callback) => {
      // first entity has been spawned so your able to get entitys now
      try {
        world.getDimension("overworld").runCommand(`testfor @a`);

        try {
          this.syncEntity();
          if (this._entity == (null || undefined)) {
            // enttiies is not set
            let entity = world
              .getDimension("overworld")
              .spawnEntity(ENTITY_IDENTIFIER, this.position);
            entity.nameTag = `DB${this.tableName}`;
            entity.addTag(`DB${this.tableName}|00000{}`);
            this._entity = entity;
          }
        } catch (error) {
          console.warn(error + error.stack);
        }

        world.events.tick.unsubscribe(TickCallback);
      } catch (error) {}
    });
  }
  syncEntity() {
    this._entity = world
      .getDimension("overworld")
      .getEntitiesAtBlockLocation(this.position)
      .find((entity) => entity.nameTag.startsWith("DB" + this.tableName));
  }
  /**
   * Get the table from the entity name tag
   * @returns {Object} tables keys
   * @example this._getData();
   */
  _getData() {
    this.syncEntity();
    if (this._entity == (null || undefined)) return {};
    let sortedTags = this._entity
      .getTags()
      .sort(
        (a, b) =>
          parseInt(
            a.nameTag.substring(
              3 + this.tableName.length,
              8 + this.tableName.length
            )
          ) -
          parseInt(
            b.nameTag.substring(
              3 + this.tableName.length,
              8 + this.tableName.length
            )
          )
      );
    let content = sortedTags
      .map((content) => content.substring(8 + this.tableName.length))
      .join("");
    return JSON.parse(content) ?? {};
  }

  _saveToEntity(value) {
    this.syncEntity();
    value = JSON.stringify(value);
    let chunkSize = 32767 - 8 - this.tableName.length;
    let chunkCount = Math.ceil(value.length / chunkSize);
    let tags = this._entity.getTags();
    tags.forEach((tag) => this._entity.removeTag(tag));
    for (let i = 0; i < chunkCount; i++) {
      let chunk = value.substr(i * chunkSize, chunkSize);
      this._entity.addTag(
        "DB" + this.tableName + "|" + i.toString().padStart(5, "0") + chunk
      );
    }
  }

  /**
   * Save a value or update a value in the Database under a key
   * @param {string} Key The key you want to save the value as
   * @param {any} value The value you want to save
   * @example Database.set('Test Key', 'Test Value');
   */
  set(key, value) {
    let data = this._getData();
    data[key] = value;
    this._saveToEntity(data);
    this.backup();
  }
  /**
   * Saves the entity to the database structure file
   * @example Database.backup();
   */
  backup() {
    SA.build.chat.runCommand(
      `setblock ${ENTITY_LOCATION.x} ${ENTITY_LOCATION.y} ${ENTITY_LOCATION.z} air`
    );
    SA.build.chat.runCommand(
      `structure save ${FILE_NAME} ${ENTITY_LOCATION.x} ${ENTITY_LOCATION.y} ${ENTITY_LOCATION.z} ${ENTITY_LOCATION.x} ${ENTITY_LOCATION.y} ${ENTITY_LOCATION.z} true disk`
    );
  }
  /**
   * Get the value of the key
   * @param {string} key
   * @returns {any}
   * @example Database.get('Test Key');
   */
  get(key) {
    const json = this._getData();
    return json[key];
  }

  /**
   * Check if the key exists in the table
   * @param {string} key
   * @returns {boolean}
   * @example Database.has('Test Key');
   */
  has(key) {
    return this.keys().includes(key);
  }
  /**
   * Delete the key from the table
   * @param {string} key
   * @returns {boolean}
   * @example Database.delete('Test Key');
   */
  delete(key) {
    let json = this._getData();
    const status = delete json[key];
    this._saveToEntity(json);
    return status;
  }
  /**
   * Returns the number of key/value pairs in the Map object.
   * @example Database.size()
   */
  size() {
    return this.keys().length;
  }
  /**
   * Clear everything in the table
   * @example Database.clear()
   */
  clear() {
    let json = this._getData();
    json = {};
    this._saveToEntity(json);
  }
  /**
   * Get all the keys in the table
   * @returns {Array<string>}
   * @example Database.keys();
   */
  keys() {
    let json = this._getData();
    return Object.keys(json);
  }
  /**
   * Get all the values in the table
   * @returns {Array<any>}
   * @example Database.values();
   */
  values() {
    let json = this._getData();
    return Object.values(json);
  }
  /**
   * Gets all the keys and values
   * @returns {any}
   * @example Database.getCollection();
   */
  getCollection() {
    let json = this._getData();
    return json;
  }
  /**
   * Check if all the keys exists in the table
   * @param {string} keys
   * @returns {boolean}
   * @example Database.hasAll('Test Key', 'Test Key 2', 'Test Key 3');
   */
  hasAll(...keys) {
    return keys.every((k) => this.has(k));
  }
  /**
   * Check if any of the keys exists in the table
   * @param {string} keys
   * @returns {boolean}
   * @example Database.hasAny('Test Key', 'Test Key 2', 'Test Key 3');
   */
  hasAny(...keys) {
    return keys.some((k) => this.has(k));
  }
  /**
   * Get all the key(s) from the beginning of the table
   * @param {number} [amount]
   * @returns {Array<string>}
   * @example Database.firstKey(2);
   */
  firstKey(amount) {
    const keys = this.keys();
    if (typeof amount !== "number") return [keys[0]];
    if (!amount) return [];
    if (amount < 0) return this.lastKey(amount * -1);
    return keys.slice(0, amount);
  }
  /**
   * Get all the values(s) from the beginning of the table
   * @param {number} [amount]
   * @returns {Array<any>}
   * @example Database.firstValue(2);
   */
  firstValue(amount) {
    const values = this.values();
    if (typeof amount !== "number") return [values[0]];
    if (!amount) return [];
    if (amount < 0) return this.lastValue(amount * -1);
    return values.slice(0, amount);
  }
  /**
   * Get all the key(s) from the end of the table
   * @param {number} [amount]
   * @returns {Array<string>}
   * @example Database.lastKey();
   */
  lastKey(amount) {
    const keys = this.keys();
    if (typeof amount !== "number") return [keys[keys.length - 1]];
    if (!amount) return [];
    if (amount < 0) return this.firstKey(amount * -1);
    return keys.slice(-amount).reverse();
  }
  /**
   * Get all the values(s) from the end of the table
   * @param {number} [amount]
   * @returns {Array<any>}
   * @example Database.lastValue();
   */
  lastValue(amount) {
    const values = this.values();
    if (typeof amount !== "number") return [values[values.length - 1]];
    if (!amount) return [];
    if (amount < 0) return this.firstValue(amount * -1);
    return values.slice(-amount).reverse();
  }
  /**
   * Get random key(s)
   * @param {number} amount
   * @returns {Array<string>}
   * @example Database.randomKey(3);
   */
  randomKey(amount) {
    const keys = this.keys();
    return keys
      .sort(() => Math.random() - Math.random())
      .slice(0, Math.abs(amount));
  }
  /**
   * Get random value(s)
   * @param {number} amount
   * @returns {Array<string>}
   * @example Database.randomValue(3);
   */
  randomValue(amount) {
    const values = this.values();
    return values
      .sort(() => Math.random() - Math.random())
      .slice(0, Math.abs(amount));
  }
}
