import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  jsonBodySchema,
  parseBodyJson,
  registerAccountedTool,
  zStr,
} from "./helpers";

export function registerPlatformExtraTools(server: McpServer): void {
  // License Manager
  registerAccountedTool(
    server,
    "license_user_list",
    "License > User: list users. GET /api/license-manager/users",
    {},
    (client) => client.get("/api/license-manager/users")
  );

  registerAccountedTool(
    server,
    "license_user_get",
    "License > User: get user. GET /api/license-manager/users/{userId}",
    { userId: zStr },
    (client, { userId }) =>
      client.get(
        `/api/license-manager/users/${encodeURIComponent(userId as string)}`
      )
  );

  registerAccountedTool(
    server,
    "license_role_list",
    "License > Role: list roles. GET /api/license-manager/roles",
    {},
    (client) => client.get("/api/license-manager/roles")
  );

  registerAccountedTool(
    server,
    "license_app_key_list",
    "License > AppKey: list app keys. GET /api/license-manager/site/apikeys",
    {},
    (client) => client.get("/api/license-manager/site/apikeys")
  );

  registerAccountedTool(
    server,
    "license_app_key_create",
    "License > AppKey: create app key. POST /api/license-manager/site/apikeys",
    jsonBodySchema(),
    (client, { bodyJson }) =>
      client.post(
        "/api/license-manager/site/apikeys",
        parseBodyJson(bodyJson as string)
      )
  );

  // Profile System
  registerAccountedTool(
    server,
    "profile_profile_get",
    "Profile > Profile: get profile by email/document via PII profile API when enabled. GET /api/storage/profile-system/profiles/{profileId}",
    { profileId: zStr.describe("Profile ID.") },
    (client, { profileId }) =>
      client.get(
        `/api/storage/profile-system/profiles/${encodeURIComponent(profileId as string)}`
      )
  );

  registerAccountedTool(
    server,
    "profile_profile_upsert",
    "Profile > Profile: create/update profile. PUT /api/storage/profile-system/profiles/{profileId}",
    { profileId: zStr, ...jsonBodySchema() },
    (client, { profileId, bodyJson }) =>
      client.put(
        `/api/storage/profile-system/profiles/${encodeURIComponent(profileId as string)}`,
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "profile_address_list",
    "Profile > Address: list addresses for profile. GET /api/storage/profile-system/profiles/{profileId}/addresses",
    { profileId: zStr },
    (client, { profileId }) =>
      client.get(
        `/api/storage/profile-system/profiles/${encodeURIComponent(profileId as string)}/addresses`
      )
  );

  registerAccountedTool(
    server,
    "profile_address_upsert",
    "Profile > Address: upsert address. PUT /api/storage/profile-system/profiles/{profileId}/addresses/{addressName}",
    {
      profileId: zStr,
      addressName: zStr,
      ...jsonBodySchema(),
    },
    (client, { profileId, addressName, bodyJson }) =>
      client.put(
        `/api/storage/profile-system/profiles/${encodeURIComponent(profileId as string)}/addresses/${encodeURIComponent(addressName as string)}`,
        parseBodyJson(bodyJson as string)
      )
  );

  // Reviews
  registerAccountedTool(
    server,
    "reviews_review_list",
    "Reviews > Review: list reviews. GET /reviews-and-ratings/api/reviews",
    {
      productId: z.string().optional(),
      from: z.number().int().optional(),
      to: z.number().int().optional(),
    },
    (client, args) =>
      client.get("/reviews-and-ratings/api/reviews", {
        product_id: args.productId as string | undefined,
        from: args.from as number | undefined,
        to: args.to as number | undefined,
      })
  );

  registerAccountedTool(
    server,
    "reviews_review_get",
    "Reviews > Review: get review. GET /reviews-and-ratings/api/reviews/{reviewId}",
    { reviewId: zStr },
    (client, { reviewId }) =>
      client.get(
        `/reviews-and-ratings/api/reviews/${encodeURIComponent(reviewId as string)}`
      )
  );

  registerAccountedTool(
    server,
    "reviews_review_create",
    "Reviews > Review: create review. POST /reviews-and-ratings/api/review",
    jsonBodySchema(),
    (client, { bodyJson }) =>
      client.post(
        "/reviews-and-ratings/api/review",
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "reviews_review_moderate",
    "Reviews > Review: moderate/approve. PATCH /reviews-and-ratings/api/reviews",
    jsonBodySchema("Moderation payload."),
    (client, { bodyJson }) =>
      client.patch(
        "/reviews-and-ratings/api/reviews",
        parseBodyJson(bodyJson as string)
      )
  );

  // Headless CMS
  registerAccountedTool(
    server,
    "cms_content_type_list",
    "CMS > ContentType: list content types. GET /api/cms/content-types",
    {},
    (client) => client.get("/api/cms/content-types")
  );

  registerAccountedTool(
    server,
    "cms_document_list",
    "CMS > Document: list documents. GET /api/cms/documents",
    {
      contentType: z.string().optional(),
    },
    (client, { contentType }) =>
      client.get("/api/cms/documents", {
        contentType: contentType as string | undefined,
      })
  );

  registerAccountedTool(
    server,
    "cms_document_get",
    "CMS > Document: get document. GET /api/cms/documents/{documentId}",
    { documentId: zStr },
    (client, { documentId }) =>
      client.get(
        `/api/cms/documents/${encodeURIComponent(documentId as string)}`
      )
  );

  registerAccountedTool(
    server,
    "cms_document_create",
    "CMS > Document: create document. POST /api/cms/documents",
    jsonBodySchema(),
    (client, { bodyJson }) =>
      client.post("/api/cms/documents", parseBodyJson(bodyJson as string))
  );

  registerAccountedTool(
    server,
    "cms_document_publish",
    "CMS > Document: publish document. POST /api/cms/documents/{documentId}/publish",
    { documentId: zStr },
    (client, { documentId }) =>
      client.post(
        `/api/cms/documents/${encodeURIComponent(documentId as string)}/publish`
      )
  );

  // Audience
  registerAccountedTool(
    server,
    "audience_audience_fetch",
    "Audience > Audience: fetch audience. POST /api/audience-manager/pvt/audience",
    jsonBodySchema("Audience lookup payload."),
    (client, { bodyJson }) =>
      client.post(
        "/api/audience-manager/pvt/audience",
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "audience_audience_get_price_table_mapping",
    "Audience > Audience: get price table mapping. GET /api/price-table-mapper/pvt/mapping/{audienceId}",
    { audienceId: zStr },
    (client, { audienceId }) =>
      client.get(
        `/api/price-table-mapper/pvt/mapping/${encodeURIComponent(audienceId as string)}`
      )
  );

  registerAccountedTool(
    server,
    "audience_audience_set_mapping",
    "Audience > Audience: set price table mapping. PUT /api/price-table-mapper/pvt/mapping/{audienceId}",
    { audienceId: zStr, ...jsonBodySchema() },
    (client, { audienceId, bodyJson }) =>
      client.put(
        `/api/price-table-mapper/pvt/mapping/${encodeURIComponent(audienceId as string)}`,
        parseBodyJson(bodyJson as string)
      )
  );

  // Pick and Pack
  registerAccountedTool(
    server,
    "pick_and_pack_order_list",
    "PickAndPack > Order: list orders. GET /orders (Pick and Pack host path — may require account-specific base; uses standard account host).",
    {},
    (client) => client.get("/api/pickandpack/orders")
  );

  registerAccountedTool(
    server,
    "pick_and_pack_order_get",
    "PickAndPack > Order: get order. GET /api/pickandpack/orders/{orderId}",
    { orderId: zStr },
    (client, { orderId }) =>
      client.get(
        `/api/pickandpack/orders/${encodeURIComponent(orderId as string)}`
      )
  );

  registerAccountedTool(
    server,
    "pick_and_pack_order_assign",
    "PickAndPack > Order: assign order. POST /api/pickandpack/orders/{orderId}/assign",
    { orderId: zStr, ...jsonBodySchema() },
    (client, { orderId, bodyJson }) =>
      client.post(
        `/api/pickandpack/orders/${encodeURIComponent(orderId as string)}/assign`,
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "pick_and_pack_order_change_create",
    "PickAndPack > OrderChange: create change. POST /api/pickandpack/orders/{orderId}/changes",
    { orderId: zStr, ...jsonBodySchema() },
    (client, { orderId, bodyJson }) =>
      client.post(
        `/api/pickandpack/orders/${encodeURIComponent(orderId as string)}/changes`,
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "pick_and_pack_order_change_get",
    "PickAndPack > OrderChange: get change. GET /api/pickandpack/orders/{orderId}/changes/{changeId}",
    { orderId: zStr, changeId: zStr },
    (client, { orderId, changeId }) =>
      client.get(
        `/api/pickandpack/orders/${encodeURIComponent(orderId as string)}/changes/${encodeURIComponent(changeId as string)}`
      )
  );

  // Delivery promise
  registerAccountedTool(
    server,
    "delivery_promise_notification_send",
    "DeliveryPromise > Notification: send notification. POST /api/delivery-promise/notifications",
    jsonBodySchema(),
    (client, { bodyJson }) =>
      client.post(
        "/api/delivery-promise/notifications",
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "delivery_promise_suggestion_list",
    "DeliveryPromise > Suggestion: list suggestions. GET /api/delivery-promise/suggestions",
    {},
    (client) => client.get("/api/delivery-promise/suggestions")
  );

  registerAccountedTool(
    server,
    "delivery_promise_suggestion_create",
    "DeliveryPromise > Suggestion: create suggestion. POST /api/delivery-promise/suggestions",
    jsonBodySchema(),
    (client, { bodyJson }) =>
      client.post(
        "/api/delivery-promise/suggestions",
        parseBodyJson(bodyJson as string)
      )
  );

  // Shipping network
  registerAccountedTool(
    server,
    "shipping_network_shipment_create",
    "ShippingNetwork > Shipment: create shipment. POST /api/shipping-network/shipments",
    jsonBodySchema(),
    (client, { bodyJson }) =>
      client.post(
        "/api/shipping-network/shipments",
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "shipping_network_shipment_get",
    "ShippingNetwork > Shipment: get shipment. GET /api/shipping-network/shipments/{shipmentId}",
    { shipmentId: zStr },
    (client, { shipmentId }) =>
      client.get(
        `/api/shipping-network/shipments/${encodeURIComponent(shipmentId as string)}`
      )
  );

  registerAccountedTool(
    server,
    "shipping_network_shipment_list",
    "ShippingNetwork > Shipment: list shipments. GET /api/shipping-network/shipments",
    {},
    (client) => client.get("/api/shipping-network/shipments")
  );

  registerAccountedTool(
    server,
    "shipping_network_shipment_cancel",
    "ShippingNetwork > Shipment: cancel shipment. POST /api/shipping-network/shipments/{shipmentId}/cancel",
    { shipmentId: zStr },
    (client, { shipmentId }) =>
      client.post(
        `/api/shipping-network/shipments/${encodeURIComponent(shipmentId as string)}/cancel`
      )
  );
}
