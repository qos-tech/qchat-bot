import type { ButtonMessage } from "../../domain/messaging/button-message.js";

export const mainMenu: ButtonMessage = {
  title: "Olá! Você está no atendimento da QoS 📞☁️",
  description:
    "Para agilizar seu atendimento, selecione uma das opções abaixo:",
  buttons: [
    { type: "reply", displayText: "Suporte Técnico", id: "option_support" },
    {
      type: "reply",
      displayText: "Assuntos Financeiros",
      id: "option_finance",
    },
    { type: "reply", displayText: "Outros Assuntos", id: "option_others" },
  ],
};
