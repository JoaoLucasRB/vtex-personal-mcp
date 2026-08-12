import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  jsonBodySchema,
  parseBodyJson,
  registerAccountedTool,
  zStr,
} from "./helpers";

export function registerB2bAndMiscTools(server: McpServer): void {
  // B2B organizations (admin REST via IO apps / b2b APIs — common org endpoints)
  registerAccountedTool(
    server,
    "b2b_organization_get",
    "B2B > Organization: get organization by id. GET /api/dataentities/organizations/documents/{id} (Master Data) — prefer GraphQL io for storefront; this covers admin document access.",
    { id: zStr.describe("Organization document ID.") },
    (client, { id }) =>
      client.get(
        `/api/dataentities/organizations/documents/${encodeURIComponent(id as string)}`
      )
  );

  registerAccountedTool(
    server,
    "b2b_organization_list",
    "B2B > Organization: search organizations. GET /api/dataentities/organizations/search",
    {
      _where: z.string().optional(),
      _fields: z.string().optional(),
      _size: z.number().int().optional(),
    },
    (client, args) =>
      client.get("/api/dataentities/organizations/search", {
        _where: args._where as string | undefined,
        _fields: args._fields as string | undefined,
        _size: args._size as number | undefined,
      })
  );

  registerAccountedTool(
    server,
    "b2b_organization_create",
    "B2B > Organization: create organization document. POST /api/dataentities/organizations/documents",
    jsonBodySchema(),
    (client, { bodyJson }) =>
      client.post(
        "/api/dataentities/organizations/documents",
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "b2b_buyer_list",
    "B2B > Buyer: list buyers / org users via Master Data entity when used. GET /api/dataentities/users/search",
    {
      _where: z.string().optional(),
      _fields: z.string().optional(),
    },
    (client, args) =>
      client.get("/api/dataentities/users/search", {
        _where: args._where as string | undefined,
        _fields: args._fields as string | undefined,
      })
  );

  registerAccountedTool(
    server,
    "b2b_buyer_get",
    "B2B > Buyer: get buyer document. GET /api/dataentities/users/documents/{id}",
    { id: zStr.describe("User document ID.") },
    (client, { id }) =>
      client.get(
        `/api/dataentities/users/documents/${encodeURIComponent(id as string)}`
      )
  );

  registerAccountedTool(
    server,
    "b2b_buyer_create",
    "B2B > Buyer: create buyer document. POST /api/dataentities/users/documents",
    jsonBodySchema(),
    (client, { bodyJson }) =>
      client.post(
        "/api/dataentities/users/documents",
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "b2b_address_list",
    "B2B > Address: list cost center / address docs. GET /api/dataentities/addresses/search",
    { _where: z.string().optional(), _fields: z.string().optional() },
    (client, args) =>
      client.get("/api/dataentities/addresses/search", {
        _where: args._where as string | undefined,
        _fields: args._fields as string | undefined,
      })
  );

  registerAccountedTool(
    server,
    "b2b_address_create",
    "B2B > Address: create address document. POST /api/dataentities/addresses/documents",
    jsonBodySchema(),
    (client, { bodyJson }) =>
      client.post(
        "/api/dataentities/addresses/documents",
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "b2b_budget_list",
    "B2B > Budget: list budgets. GET /api/budgets/{contextType}/{contextId}",
    {
      contextType: zStr.describe("Usually UNIT."),
      contextId: zStr.describe("Context / unit ID."),
    },
    (client, { contextType, contextId }) =>
      client.get(
        `/api/budgets/${encodeURIComponent(contextType as string)}/${encodeURIComponent(contextId as string)}`
      )
  );

  registerAccountedTool(
    server,
    "b2b_budget_create",
    "B2B > Budget: create budget. POST /api/budgets/{contextType}/{contextId}",
    {
      contextType: zStr.describe("Usually UNIT."),
      contextId: zStr.describe("Context / unit ID."),
      ...jsonBodySchema(),
    },
    (client, { contextType, contextId, bodyJson }) =>
      client.post(
        `/api/budgets/${encodeURIComponent(contextType as string)}/${encodeURIComponent(contextId as string)}`,
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "b2b_budget_get_allocations",
    "B2B > Budget: list allocations. GET /api/budgets/{contextType}/{contextId}/{budgetId}/allocations",
    {
      contextType: zStr,
      contextId: zStr,
      budgetId: zStr,
    },
    (client, { contextType, contextId, budgetId }) =>
      client.get(
        `/api/budgets/${encodeURIComponent(contextType as string)}/${encodeURIComponent(contextId as string)}/${encodeURIComponent(budgetId as string)}/allocations`
      )
  );

  registerAccountedTool(
    server,
    "b2b_buying_policy_list",
    "B2B > BuyingPolicy: list authorization dimensions. GET /{account}/authorization-dimensions",
    {},
    (client) =>
      client.get(`/${encodeURIComponent(client.account)}/authorization-dimensions`)
  );

  registerAccountedTool(
    server,
    "b2b_buying_policy_create",
    "B2B > BuyingPolicy: create authorization dimension. POST /{account}/authorization-dimensions",
    jsonBodySchema(),
    (client, { bodyJson }) =>
      client.post(
        `/${encodeURIComponent(client.account)}/authorization-dimensions`,
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "b2b_contract_list",
    "B2B > Contract: list contracts via data entity when present. GET /api/dataentities/contracts/search",
    { _where: z.string().optional() },
    (client, args) =>
      client.get("/api/dataentities/contracts/search", {
        _where: args._where as string | undefined,
      })
  );

  registerAccountedTool(
    server,
    "b2b_contract_get",
    "B2B > Contract: get contract document. GET /api/dataentities/contracts/documents/{id}",
    { id: zStr },
    (client, { id }) =>
      client.get(
        `/api/dataentities/contracts/documents/${encodeURIComponent(id as string)}`
      )
  );

  // Subscriptions
  registerAccountedTool(
    server,
    "subscriptions_subscription_list",
    "Subscriptions > Subscription: list. GET /api/rns/pub/subscriptions",
    {
      customerEmail: z.string().optional(),
    },
    (client, { customerEmail }) =>
      client.get("/api/rns/pub/subscriptions", {
        customerEmail: customerEmail as string | undefined,
      })
  );

  registerAccountedTool(
    server,
    "subscriptions_subscription_get",
    "Subscriptions > Subscription: get by id. GET /api/rns/pub/subscriptions/{id}",
    { id: zStr },
    (client, { id }) =>
      client.get(
        `/api/rns/pub/subscriptions/${encodeURIComponent(id as string)}`
      )
  );

  registerAccountedTool(
    server,
    "subscriptions_subscription_create",
    "Subscriptions > Subscription: create. POST /api/rns/pub/subscriptions",
    jsonBodySchema(),
    (client, { bodyJson }) =>
      client.post(
        "/api/rns/pub/subscriptions",
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "subscriptions_subscription_update",
    "Subscriptions > Subscription: update. PATCH /api/rns/pub/subscriptions/{id}",
    { id: zStr, ...jsonBodySchema() },
    (client, { id, bodyJson }) =>
      client.patch(
        `/api/rns/pub/subscriptions/${encodeURIComponent(id as string)}`,
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "subscriptions_subscription_cancel",
    "Subscriptions > Subscription: cancel. PATCH status via body or cancel endpoint. POST /api/rns/pub/subscriptions/{id}/cancel",
    { id: zStr },
    (client, { id }) =>
      client.post(
        `/api/rns/pub/subscriptions/${encodeURIComponent(id as string)}/cancel`
      )
  );

  // Marketplace / SKU bindings
  registerAccountedTool(
    server,
    "marketplace_seller_list",
    "Marketplace > Seller: list sellers. GET /api/seller-register/pvt/sellers",
    {},
    (client) => client.get("/api/seller-register/pvt/sellers")
  );

  registerAccountedTool(
    server,
    "marketplace_seller_get",
    "Marketplace > Seller: get seller. GET /api/seller-register/pvt/sellers/{sellerId}",
    { sellerId: zStr },
    (client, { sellerId }) =>
      client.get(
        `/api/seller-register/pvt/sellers/${encodeURIComponent(sellerId as string)}`
      )
  );

  registerAccountedTool(
    server,
    "marketplace_sku_binding_list",
    "Marketplace > SkuBinding: list bindings. GET /api/sku-binding/pvt/skubinding",
    { an: z.string().optional().describe("Seller account name.") },
    (client, { an }) =>
      client.get("/api/sku-binding/pvt/skubinding", {
        an: an as string | undefined,
      })
  );

  registerAccountedTool(
    server,
    "marketplace_sku_binding_create",
    "Marketplace > SkuBinding: create binding. POST /api/sku-binding/pvt/skubinding",
    jsonBodySchema(),
    (client, { bodyJson }) =>
      client.post(
        "/api/sku-binding/pvt/skubinding",
        parseBodyJson(bodyJson as string)
      )
  );

  // Customer credit
  registerAccountedTool(
    server,
    "customer_credit_account_get",
    "CustomerCredit > Account: get credit account. GET /api/creditcontrol/accounts/{creditAccountId}",
    { creditAccountId: zStr },
    (client, { creditAccountId }) =>
      client.get(
        `/api/creditcontrol/accounts/${encodeURIComponent(creditAccountId as string)}`
      )
  );

  registerAccountedTool(
    server,
    "customer_credit_account_create",
    "CustomerCredit > Account: create. POST /api/creditcontrol/accounts",
    jsonBodySchema(),
    (client, { bodyJson }) =>
      client.post(
        "/api/creditcontrol/accounts",
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "customer_credit_invoice_list",
    "CustomerCredit > Invoice: list invoices. GET /api/creditcontrol/accounts/{creditAccountId}/invoices",
    { creditAccountId: zStr },
    (client, { creditAccountId }) =>
      client.get(
        `/api/creditcontrol/accounts/${encodeURIComponent(creditAccountId as string)}/invoices`
      )
  );

  registerAccountedTool(
    server,
    "customer_credit_invoice_create",
    "CustomerCredit > Invoice: create invoice. POST /api/creditcontrol/accounts/{creditAccountId}/invoices",
    { creditAccountId: zStr, ...jsonBodySchema() },
    (client, { creditAccountId, bodyJson }) =>
      client.post(
        `/api/creditcontrol/accounts/${encodeURIComponent(creditAccountId as string)}/invoices`,
        parseBodyJson(bodyJson as string)
      )
  );
}
