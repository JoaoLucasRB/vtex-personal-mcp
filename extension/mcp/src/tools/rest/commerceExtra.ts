import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  jsonBodySchema,
  parseBodyJson,
  registerAccountedTool,
  zStr,
} from "./helpers";

export function registerCommerceExtraTools(server: McpServer): void {
  // Promotions
  registerAccountedTool(
    server,
    "promotions_promotion_list",
    "Promotions > Promotion: list promotions. GET /api/rnb/pvt/benefits/calculatorconfiguration",
    {},
    (client) => client.get("/api/rnb/pvt/benefits/calculatorconfiguration")
  );

  registerAccountedTool(
    server,
    "promotions_promotion_get",
    "Promotions > Promotion: get by id. GET /api/rnb/pvt/calculatorconfiguration/{idCalculatorConfiguration}",
    { idCalculatorConfiguration: zStr.describe("Promotion / calculator config ID.") },
    (client, { idCalculatorConfiguration }) =>
      client.get(
        `/api/rnb/pvt/calculatorconfiguration/${encodeURIComponent(idCalculatorConfiguration as string)}`
      )
  );

  registerAccountedTool(
    server,
    "promotions_promotion_create",
    "Promotions > Promotion: create. POST /api/rnb/pvt/calculatorconfiguration",
    jsonBodySchema(),
    (client, { bodyJson }) =>
      client.post(
        "/api/rnb/pvt/calculatorconfiguration",
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "promotions_promotion_update",
    "Promotions > Promotion: update. POST /api/rnb/pvt/calculatorconfiguration (with id in body)",
    jsonBodySchema(),
    (client, { bodyJson }) =>
      client.post(
        "/api/rnb/pvt/calculatorconfiguration",
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "promotions_coupon_create",
    "Promotions > Coupon: create coupon. POST /api/rnb/pvt/coupon",
    jsonBodySchema(),
    (client, { bodyJson }) =>
      client.post("/api/rnb/pvt/coupon", parseBodyJson(bodyJson as string))
  );

  registerAccountedTool(
    server,
    "promotions_coupon_get",
    "Promotions > Coupon: get coupon. GET /api/rnb/pvt/coupon/{couponCode}",
    { couponCode: zStr.describe("Coupon code.") },
    (client, { couponCode }) =>
      client.get(
        `/api/rnb/pvt/coupon/${encodeURIComponent(couponCode as string)}`
      )
  );

  registerAccountedTool(
    server,
    "promotions_coupon_archive",
    "Promotions > Coupon: archive coupon. POST /api/rnb/pvt/archive/coupon/{couponCode}",
    { couponCode: zStr.describe("Coupon code.") },
    (client, { couponCode }) =>
      client.post(
        `/api/rnb/pvt/archive/coupon/${encodeURIComponent(couponCode as string)}`
      )
  );

  registerAccountedTool(
    server,
    "promotions_tax_list",
    "Promotions > Tax: list tax configurations. GET /api/rnb/pvt/taxconfigurations",
    {},
    (client) => client.get("/api/rnb/pvt/taxconfigurations")
  );

  registerAccountedTool(
    server,
    "promotions_tax_create",
    "Promotions > Tax: create tax configuration. POST /api/rnb/pvt/taxconfigurations",
    jsonBodySchema(),
    (client, { bodyJson }) =>
      client.post(
        "/api/rnb/pvt/taxconfigurations",
        parseBodyJson(bodyJson as string)
      )
  );

  // Payments Gateway
  registerAccountedTool(
    server,
    "payments_transaction_get",
    "Payments > Transaction: get transaction. GET /api/pvt/transactions/{transactionId}",
    { transactionId: zStr.describe("Transaction ID.") },
    (client, { transactionId }) =>
      client.get(
        `/api/pvt/transactions/${encodeURIComponent(transactionId as string)}`
      )
  );

  registerAccountedTool(
    server,
    "payments_transaction_cancel",
    "Payments > Transaction: cancel. POST /api/pvt/transactions/{transactionId}/cancellation-requests",
    {
      transactionId: zStr.describe("Transaction ID."),
      ...jsonBodySchema("Cancellation payload."),
    },
    (client, { transactionId, bodyJson }) =>
      client.post(
        `/api/pvt/transactions/${encodeURIComponent(transactionId as string)}/cancellation-requests`,
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "payments_transaction_settle",
    "Payments > Transaction: settle. POST /api/pvt/transactions/{transactionId}/settlement-requests",
    {
      transactionId: zStr.describe("Transaction ID."),
      ...jsonBodySchema("Settlement payload."),
    },
    (client, { transactionId, bodyJson }) =>
      client.post(
        `/api/pvt/transactions/${encodeURIComponent(transactionId as string)}/settlement-requests`,
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "payments_payment_get",
    "Payments > Payment: get payment. GET /api/pvt/transactions/{transactionId}/payments/{paymentId}",
    {
      transactionId: zStr.describe("Transaction ID."),
      paymentId: zStr.describe("Payment ID."),
    },
    (client, { transactionId, paymentId }) =>
      client.get(
        `/api/pvt/transactions/${encodeURIComponent(transactionId as string)}/payments/${encodeURIComponent(paymentId as string)}`
      )
  );

  registerAccountedTool(
    server,
    "payments_policy_list",
    "Payments > Policy: list payment policies. GET /api/payments/pvt/rules",
    {},
    (client) => client.get("/api/payments/pvt/rules")
  );

  registerAccountedTool(
    server,
    "payments_policy_get",
    "Payments > Policy: get payment policy. GET /api/payments/pvt/rules/{ruleId}",
    { ruleId: zStr.describe("Policy / rule ID.") },
    (client, { ruleId }) =>
      client.get(
        `/api/payments/pvt/rules/${encodeURIComponent(ruleId as string)}`
      )
  );

  registerAccountedTool(
    server,
    "payments_policy_create",
    "Payments > Policy: create payment policy. POST /api/payments/pvt/rules",
    jsonBodySchema(),
    (client, { bodyJson }) =>
      client.post("/api/payments/pvt/rules", parseBodyJson(bodyJson as string))
  );

  // Gift cards
  registerAccountedTool(
    server,
    "giftcards_card_search",
    "Giftcards > Card: search gift cards. GET /api/giftcards/_search",
    {
      email: z.string().optional().describe("Filter by email."),
    },
    (client, { email }) =>
      client.get("/api/giftcards/_search", {
        email: email as string | undefined,
      })
  );

  registerAccountedTool(
    server,
    "giftcards_card_get",
    "Giftcards > Card: get gift card. GET /api/giftcards/{giftCardId}",
    { giftCardId: zStr.describe("Gift card ID.") },
    (client, { giftCardId }) =>
      client.get(
        `/api/giftcards/${encodeURIComponent(giftCardId as string)}`
      )
  );

  registerAccountedTool(
    server,
    "giftcards_card_create",
    "Giftcards > Card: create gift card. POST /api/giftcards",
    jsonBodySchema(),
    (client, { bodyJson }) =>
      client.post("/api/giftcards", parseBodyJson(bodyJson as string))
  );

  registerAccountedTool(
    server,
    "giftcards_hub_list_providers",
    "Giftcards > Hub: list providers. GET /api/giftcardproviders",
    {},
    (client) => client.get("/api/giftcardproviders")
  );

  registerAccountedTool(
    server,
    "giftcards_hub_get_card",
    "Giftcards > Hub: get card from provider. GET /api/giftcardproviders/{provider}/giftcards/{id}",
    {
      provider: zStr.describe("Provider ID."),
      id: zStr.describe("Gift card ID."),
    },
    (client, { provider, id }) =>
      client.get(
        `/api/giftcardproviders/${encodeURIComponent(provider as string)}/giftcards/${encodeURIComponent(id as string)}`
      )
  );
}
