import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  jsonBodySchema,
  parseBodyJson,
  registerAccountedTool,
  zStr,
} from "./helpers";

export function registerOrdersTools(server: McpServer): void {
  registerAccountedTool(
    server,
    "orders_order_get",
    "Orders > Order: get order by orderId (OMS admin). GET /api/oms/pvt/orders/{orderId}. Use this when GraphQL cannot fetch merchant orders by id.",
    { orderId: zStr.describe("Order ID, e.g. 1234567890123-01.") },
    (client, { orderId }) =>
      client.get(`/api/oms/pvt/orders/${encodeURIComponent(orderId as string)}`)
  );

  registerAccountedTool(
    server,
    "orders_order_list",
    "Orders > Order: list orders. GET /api/oms/pvt/orders",
    {
      page: z.number().int().optional().describe("Page number."),
      per_page: z.number().int().optional().describe("Page size."),
      q: z.string().optional().describe("Search query."),
      f_status: z.string().optional().describe("Status filter."),
    },
    (client, args) =>
      client.get("/api/oms/pvt/orders", {
        page: args.page as number | undefined,
        per_page: args.per_page as number | undefined,
        q: args.q as string | undefined,
        f_status: args.f_status as string | undefined,
      })
  );

  registerAccountedTool(
    server,
    "orders_order_cancel",
    "Orders > Order: cancel order. POST /api/oms/pvt/orders/{orderId}/cancel",
    {
      orderId: zStr.describe("Order ID."),
      reason: z.string().optional().describe("Cancellation reason."),
    },
    (client, { orderId, reason }) =>
      client.post(
        `/api/oms/pvt/orders/${encodeURIComponent(orderId as string)}/cancel`,
        reason ? { reason } : {}
      )
  );

  registerAccountedTool(
    server,
    "orders_order_start_handling",
    "Orders > Order: start handling. POST /api/oms/pvt/orders/{orderId}/start-handling",
    { orderId: zStr.describe("Order ID.") },
    (client, { orderId }) =>
      client.post(
        `/api/oms/pvt/orders/${encodeURIComponent(orderId as string)}/start-handling`
      )
  );

  registerAccountedTool(
    server,
    "orders_feed_get",
    "Orders > Feed: retrieve feed items. GET /api/orders/feed",
    {
      maxlot: z.number().int().optional().describe("Max items to retrieve."),
    },
    (client, { maxlot }) =>
      client.get("/api/orders/feed", {
        maxlot: maxlot as number | undefined,
      })
  );

  registerAccountedTool(
    server,
    "orders_feed_commit",
    "Orders > Feed: commit feed handles. POST /api/orders/feed",
    {
      handles: z
        .string()
        .describe('JSON array string of feed handles, e.g. ["h1","h2"].'),
    },
    (client, { handles }) => {
      const parsed = JSON.parse(handles as string) as unknown;
      if (!Array.isArray(parsed)) {
        throw new Error("handles must be a JSON array string.");
      }
      return client.post("/api/orders/feed", parsed);
    }
  );

  registerAccountedTool(
    server,
    "orders_feed_config",
    "Orders > Feed: get feed configuration. GET /api/orders/feed/config",
    {},
    (client) => client.get("/api/orders/feed/config")
  );

  registerAccountedTool(
    server,
    "orders_invoice_create",
    "Orders > Invoice: notify invoice. POST /api/oms/pvt/orders/{orderId}/invoice",
    {
      orderId: zStr.describe("Order ID."),
      ...jsonBodySchema("Invoice payload."),
    },
    (client, { orderId, bodyJson }) =>
      client.post(
        `/api/oms/pvt/orders/${encodeURIComponent(orderId as string)}/invoice`,
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "orders_conversation_get",
    "Orders > Conversation: get conversation messages. GET /api/oms/pvt/orders/{orderId}/conversation-message",
    { orderId: zStr.describe("Order ID.") },
    (client, { orderId }) =>
      client.get(
        `/api/oms/pvt/orders/${encodeURIComponent(orderId as string)}/conversation-message`
      )
  );
}
