import {
    ActionFormData,
    ModalFormData,
    MessageFormData,
  } from "mojang-minecraft-ui";

export function base(slots, error) {
    const form = new ActionFormData()
    form.title("Battle Menu")
    form.body(`Please Select a Pokemon to battle\n§c${error}`)
}
