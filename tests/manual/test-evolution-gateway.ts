import "dotenv/config.js";
import { EvolutionMessagingGateway } from "../../src/infrastructure/gateways/evolution-messaging-gateway.js";

const gateway = new EvolutionMessagingGateway();

await gateway.sendButtons({
  phone: "554197035511",
  payload: {
    title: "Teste QoS",
    description: "Selecione uma opção:",
    buttons: [
      {
        type: "reply",
        displayText: "Opção 1",
        id: "opt1",
      },
      {
        type: "reply",
        displayText: "Opção 2",
        id: "opt2",
      },
    ],
  },
});

console.log("OK");
