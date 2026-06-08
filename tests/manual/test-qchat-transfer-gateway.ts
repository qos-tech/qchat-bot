import "dotenv/config.js";
import { QChatTicketTransferGateway } from "../../src/infrastructure/gateways/qchat-ticket-transfer-gateway.js";

const gateway = new QChatTicketTransferGateway();

await gateway.transfer({
  correlationId: "test:qchat-transfer:manual",
  number: "554197035511",
  queueId: "1",
  status: "pending",
  message:
    "Teste de transferência via bot.\n\nSe você recebeu essa mensagem, a integração com o QChat funcionou.",
});

console.log("OK");

process.exit(0);
