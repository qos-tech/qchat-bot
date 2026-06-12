# 010 - Multibot Health Check

Status: DONE

## Objetivo

Criar ferramentas para validar rapidamente a saúde operacional de um bot.

## Motivação

Agora a plataforma é multibot.

Precisamos identificar rapidamente:

- configuração inválida
- integração Evolution quebrada
- integração QChat quebrada
- menus inválidos
- mensagens inválidas

sem depender de testes manuais.

## Requisitos

### Script

Criar:

npm run bot:health -- <botId>

ou

npm run bot:health -- <companyId>:<whatsappId>

### Verificações

#### BotConfig

- existe
- ativo
- passa no BotConfigValidator

#### Evolution

Validar:

- apiUrl preenchida
- apiKey preenchida
- instance preenchida

Não é obrigatório chamar a API real nesta versão.

#### QChat

Validar:

- apiUrl preenchida
- apiToken preenchido

#### Menus

Validar:

- menus existentes
- referências de menu válidas
- referências de mensagens válidas

#### Resultado

Exemplo:

[OK] BotConfig válido
[OK] Evolution configurada
[OK] QChat configurado
[OK] Menus válidos
[OK] Mensagens válidas

STATUS: HEALTHY

ou

[ERROR] Menu "finance" inexistente
[ERROR] Message "support_confirmation" inexistente

STATUS: UNHEALTHY

### Código

Preferir reutilizar:

- BotConfigResolver
- BotConfigValidator
- BotSelector

Evitar duplicação.

## Critérios de aceite

- build passa
- possível validar qualquer bot
- falhas aparecem claramente
- não realiza alterações no banco
- não depende de APIs externas
