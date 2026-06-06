export const afterHoursMenu: ButtonMessage = {
  title: "Olá! Você está no atendimento da QoS 📞☁️",
  description:
    "Agradecemos seu contato! 👋\n\nNo momento, nosso time está atendendo apenas emergências por telefone, mas responderemos sua mensagem no próximo expediente. 🗓️\n\nSelecione uma opção abaixo para nos deixar um recado! ✨",
  buttons: [
    {
      type: "reply",
      displayText: "Suporte Técnico",
      id: "option_support",
    },
    {
      type: "reply",
      displayText: "Outros Assuntos",
      id: "option_others",
    },
  ],
};
