import "dotenv/config";
import { createHandleIncomingMessageUseCase } from "../../src/bootstrap/create-handle-incoming-message-use-case.js";

const useCase = createHandleIncomingMessageUseCase();

console.log("UseCase criado com sucesso:");
console.log(useCase.constructor.name);

process.exit(0);
