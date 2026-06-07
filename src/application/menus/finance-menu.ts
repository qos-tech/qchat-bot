// src/application/menus/finance-menu.ts

import type { ButtonMessage } from "../../domain/messaging/button-message.js";

export const financeMenu: ButtonMessage = {
  title: "Assuntos Financeiros 🧾",
  description: "Selecione uma das opções abaixo:",
  buttons: [
    { type: "reply", displayText: "2ª via NF", id: "fin_nf" },
    { type: "reply", displayText: "2ª via Boleto", id: "fin_invoice" },
    { type: "reply", displayText: "Outros", id: "fin_others" },
  ],
};
