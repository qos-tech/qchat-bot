import "dotenv/config";
import { PostgresConversationSessionRepository } from "../../src/infrastructure/repositories/postgres-conversation-session-repository.js";

const repo = new PostgresConversationSessionRepository();

const ticketId = "test-ticket-001";

await repo.save({
  provider: "qchat",
  ticketId,
  companyId: "1",
  whatsappId: "122",
  contactId: "84",
  phone: "5541999999999",
  stage: "awaiting_main_menu",
});

const created = await repo.findByTicketId(ticketId);

console.log("CREATED:");
console.log(created);

await repo.save({
  provider: "qchat",
  ticketId,
  companyId: "1",
  whatsappId: "122",
  contactId: "84",
  phone: "5541999999999",
  stage: "awaiting_finance_menu",
  intent: "finance",
});

const updated = await repo.findByTicketId(ticketId);

console.log("UPDATED:");
console.log(updated);

await repo.deleteByTicketId(ticketId);

const deleted = await repo.findByTicketId(ticketId);

console.log("DELETED:");
console.log(deleted);

process.exit(0);
