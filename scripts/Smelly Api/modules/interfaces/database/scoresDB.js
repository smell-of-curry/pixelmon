import { world } from "mojang-minecraft";
import * as SA from "../../../index.js";

function textToBinary(text) {
  return text
    .split("")
    .map((char) => {
      return char.charCodeAt(0).toString(2);
    })
    .join(" ");
}

function binaryToText(binary) {
  return binary
    .split(" ")
    .map((char) => {
      return String.fromCharCode(parseInt(char, 2));
    })
    .join("");
}

export class Database {
  constructor(table) {
    try {
      SA.build.chat.runCommand("scoreboard objectives add database dummy");
      SA.build.chat.runCommand("scoreboard players set global database 1");
    } catch (e) {}

    try {
      this.table = table;
      this.insert = {};
      this.createTable();
    } catch (error) {
      console.warn(`${error} : ${error.stack}`);
    }
  }

  getTable() {
    try {
      let data = SA.build.chat.runCommand(`scoreboard players list`);
      if (!data?.statusMessage) return;
      // This will return an array of players like "DBtablename|00000{110101010 10101010 010101}"
      const regex = new RegExp(`DB${this.table}\|\d{5}\{[0-1\s]+\}`, "g");
      let allBinary = data.statusMessage.match(regex) ?? [];

      // returns a sorted list of all databases
      let sortedPlayers = allBinary.sort(
        (a, b) =>
          parseInt(a.substring(3 + this.table.length, 8 + this.table.length)) -
          parseInt(b.substring(3 + this.table.length, 8 + this.table.length))
      );
      let content = sortedPlayers
        .map((ent) => binaryToText(ent.substring(8 + this.table.length)))
        .join("");
      return JSON.parse(content) ?? {};
    } catch (error) {
      console.warn(`${error} : ${error.stack}`);
    }
  }

  saveTable(value) {
    try {
      value = JSON.stringify(value);
      let chunkSize = 32767 - 8 - this.tableName.length;
      let chunkCount = Math.ceil(value.length / chunkSize);
      if (this._entities.length < chunkCount) {
        for (let i = this._entities.length; i < chunkCount; i++) {
          let e = world
            .getDimension("overworld")
            .spawnEntity(ENTITY_IDENTIFIER, this.position);
          // this is an empty payload, if for some reason one or more of these are not assigned data they will not effect the output
          e.nameTag = "DB" + this.tableName + "|99999";
        }
      } else if (this._entities.length > chunkCount) {
        for (let i = this._entities.length - 1; i > chunkCount; i--) {
          this._entities[i].kill();
        }
      }
      for (let i = 0; i < chunkCount; i++) {
        let chunk = value.substr(i * chunkSize, chunkSize);
        SA.build.chat.runCommand(
          `scoreboard players set "DB${this.table}|${i
            .toString()
            .padStart(5, "0")}${textToBinary(chunk)}" database 0`
        );
      }
    } catch (error) {
      console.warn(`${error} : ${error.stack}`);
    }
  }

  all(sort) {
    try {
      let table = this.getTable();
      if (!table) return [];
      if (sort) table.data = table.data.sort(sort);
      return table.data;
    } catch (error) {
      console.warn(`${error} : ${error.stack}`);
    }
  }

  get(key) {
    try {
      if (!this.has(key)) return;
      let allValues = this.all();
      return allValues.filter((value) => value?.key?.includes(key))[0];
    } catch (error) {
      console.warn(`${error} : ${error.stack}`);
    }
  }

  keys() {
    try {
      let allValues = this.all();
      return allValues.filter((value) => value?.key?.includes(key))[0];
    } catch (error) {
      console.warn(`${error} : ${error.stack}`);
    }
  }

  has(key) {
    try {
      let allValues = this.all();
      return allValues.some((value) => value?.key?.includes(key));
    } catch (error) {
      console.warn(`${error} : ${error.stack}`);
    }
  }

  hasAny(key) {
    try {
      let allValues = this.all();
      let keys = [...key];
      return allValues.some((value) => keys.some((k) => value.key.includes(k)));
    } catch (error) {
      console.warn(`${error} : ${error.stack}`);
    }
  }

  hasAll(key) {
    try {
      let allValues = this.all();
      let keys = [...key];
      return keys.every((k) => this.has(k));
    } catch (error) {
      console.warn(`${error} : ${error.stack}`);
    }
  }

  set(key, value) {
    try {
      if (this.has(key)) return;
      this.update(key, value);
      let Table = this.getTable();
      Table.data.push({
        key: typeof key == "string" ? [key] : [...key],
        value,
      });
      this.updateTable(Table);
    } catch (error) {
      console.warn(`${error} : ${error.stack}`);
    }
  }

  remove(key) {
    try {
      if (!this.has(key)) return;
      let value = this.get(key);
      let table = this.getTable();

      let index = table.data.indexOf(value);
      table.data.splice(index, 1);

      this.updateTable(table);
    } catch (error) {
      console.warn(`${error} : ${error.stack}`);
    }
  }

  update(key, value) {
    try {
      if (!this.has(key)) return;
      let keys = this.get(key).key;
      this.remove(key);
      this.set(keys, value);
    } catch (error) {
      console.warn(`${error} : ${error.stack}`);
    }
  }

  setMany(array) {
    try {
      array?.forEach((data) => {
        let key = data?.key;
        let value = data?.value;
        if (!key || !value) return;
        this.set(typeof key == "string" ? [key] : [...key], value);
      });
    } catch (error) {
      console.warn(`${error} : ${error.stack}`);
    }
  }

  removeMany(array) {
    try {
      array?.forEach((key) => {
        if (typeof key !== "string") return;
        this.remove(key);
      });
    } catch (error) {
      console.warn(`${error} : ${error.stack}`);
    }
  }
}
