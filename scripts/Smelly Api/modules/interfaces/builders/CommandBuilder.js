export class CommandBuilder {
  constructor() {
    this._registrationInformation = [];
  }
  /**
   * Register a command with a callback
   * @param {registerInformation} register An object of information needed to register the custom command
   * @param {(data: BeforeChatEvent, args: Array<string>) => void} callback Code you want to execute when the command is executed
   * @example import { Server } from "../../Minecraft";
   *  Server.commands.register({ name: 'ping' }, (data, args) => {
   *  Server.broadcast('Pong!', data.sender.nameTag);
   * });
   */
  register(register, callback) {
    this._registrationInformation.push({
      tags: register.tags ?? [], // Required tags to run command
      name: register.name.toLowerCase(), // name of command
      aliases: register.aliases // other names that could run the command
        ? register.aliases.map((v) => v.toLowerCase())
        : null,
      description: register.description ?? "",
      usage: register.usage ?? ["<>"],
      example: register.example ?? null,
      callback,
    });
  }
  /**
   * Get all the registered informations
   * @returns {Array<storedRegisterInformation>}
   * @example getAllRegistration();
   */
  getAllRegistation() {
    return this._registrationInformation;
  }
}
export const CommandBuild = new CommandBuilder();
