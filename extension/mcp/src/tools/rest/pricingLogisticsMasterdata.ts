import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  jsonBodySchema,
  parseBodyJson,
  registerAccountedTool,
  zStr,
} from "./helpers";

export function registerPricingLogisticsMasterDataTools(
  server: McpServer
): void {
  // Pricing
  registerAccountedTool(
    server,
    "pricing_price_get",
    "Pricing > Price: get SKU price. GET /api/pricing/prices/{itemId}",
    { itemId: zStr.describe("SKU / item ID.") },
    (client, { itemId }) =>
      client.get(`/api/pricing/prices/${encodeURIComponent(itemId as string)}`)
  );

  registerAccountedTool(
    server,
    "pricing_price_create_or_update",
    "Pricing > Price: create or update SKU price. PUT /api/pricing/prices/{itemId}",
    {
      itemId: zStr.describe("SKU / item ID."),
      ...jsonBodySchema("Price payload (basePrice, listPrice, etc.)."),
    },
    (client, { itemId, bodyJson }) =>
      client.put(
        `/api/pricing/prices/${encodeURIComponent(itemId as string)}`,
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "pricing_price_delete",
    "Pricing > Price: delete SKU price. DELETE /api/pricing/prices/{itemId}",
    { itemId: zStr.describe("SKU / item ID.") },
    (client, { itemId }) =>
      client.delete(
        `/api/pricing/prices/${encodeURIComponent(itemId as string)}`
      )
  );

  registerAccountedTool(
    server,
    "pricing_price_get_computed",
    "Pricing > Price: get computed price. GET /api/pricing/prices/{itemId}/computed/{salesChannel?}",
    {
      itemId: zStr.describe("SKU / item ID."),
      salesChannel: z.string().optional().describe("Sales channel ID."),
    },
    (client, { itemId, salesChannel }) => {
      const sc = salesChannel
        ? `/${encodeURIComponent(salesChannel as string)}`
        : "";
      return client.get(
        `/api/pricing/prices/${encodeURIComponent(itemId as string)}/computed${sc}`
      );
    }
  );

  registerAccountedTool(
    server,
    "pricing_price_table_list",
    "Pricing > PriceTable: list tables via prices metadata / tables path used by account. GET /api/pricing/tables (or pipeline tables).",
    {},
    (client) => client.get("/api/pricing/pipeline/tables")
  );

  registerAccountedTool(
    server,
    "pricing_simulation_simulate",
    "Pricing > Simulation: B2B price simulation. POST body via Price Simulations API when configured.",
    jsonBodySchema("Simulation payload."),
    (client, { bodyJson }) =>
      client.post(
        "/api/pricing-simulation/simulation",
        parseBodyJson(bodyJson as string)
      )
  );

  // Logistics
  registerAccountedTool(
    server,
    "logistics_inventory_get_by_sku",
    "Logistics > Inventory: get inventory by SKU. GET /api/logistics/pvt/inventory/skus/{skuId}",
    { skuId: zStr.describe("SKU ID.") },
    (client, { skuId }) =>
      client.get(
        `/api/logistics/pvt/inventory/skus/${encodeURIComponent(skuId as string)}`
      )
  );

  registerAccountedTool(
    server,
    "logistics_inventory_update",
    "Logistics > Inventory: update inventory. PUT /api/logistics/pvt/inventory/skus/{skuId}/warehouses/{warehouseId}",
    {
      skuId: zStr.describe("SKU ID."),
      warehouseId: zStr.describe("Warehouse ID."),
      ...jsonBodySchema("Inventory payload (quantity, unlimitedQuantity, etc.)."),
    },
    (client, { skuId, warehouseId, bodyJson }) =>
      client.put(
        `/api/logistics/pvt/inventory/skus/${encodeURIComponent(skuId as string)}/warehouses/${encodeURIComponent(warehouseId as string)}`,
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "logistics_warehouse_list",
    "Logistics > Warehouse: list warehouses. GET /api/logistics/pvt/configuration/warehouses",
    {},
    (client) => client.get("/api/logistics/pvt/configuration/warehouses")
  );

  registerAccountedTool(
    server,
    "logistics_warehouse_get",
    "Logistics > Warehouse: get warehouse. GET /api/logistics/pvt/configuration/warehouses/{warehouseId}",
    { warehouseId: zStr.describe("Warehouse ID.") },
    (client, { warehouseId }) =>
      client.get(
        `/api/logistics/pvt/configuration/warehouses/${encodeURIComponent(warehouseId as string)}`
      )
  );

  registerAccountedTool(
    server,
    "logistics_warehouse_create",
    "Logistics > Warehouse: create warehouse. POST /api/logistics/pvt/configuration/warehouses",
    jsonBodySchema(),
    (client, { bodyJson }) =>
      client.post(
        "/api/logistics/pvt/configuration/warehouses",
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "logistics_dock_list",
    "Logistics > Dock: list docks. GET /api/logistics/pvt/configuration/docks",
    {},
    (client) => client.get("/api/logistics/pvt/configuration/docks")
  );

  registerAccountedTool(
    server,
    "logistics_dock_get",
    "Logistics > Dock: get dock. GET /api/logistics/pvt/configuration/docks/{dockId}",
    { dockId: zStr.describe("Dock ID.") },
    (client, { dockId }) =>
      client.get(
        `/api/logistics/pvt/configuration/docks/${encodeURIComponent(dockId as string)}`
      )
  );

  registerAccountedTool(
    server,
    "logistics_pickup_point_list",
    "Logistics > PickupPoint: list pickup points. GET /api/logistics/pvt/configuration/pickuppoints",
    {},
    (client) => client.get("/api/logistics/pvt/configuration/pickuppoints")
  );

  registerAccountedTool(
    server,
    "logistics_pickup_point_get",
    "Logistics > PickupPoint: get pickup point. GET /api/logistics/pvt/configuration/pickuppoints/{pickupPointId}",
    { pickupPointId: zStr.describe("Pickup point ID.") },
    (client, { pickupPointId }) =>
      client.get(
        `/api/logistics/pvt/configuration/pickuppoints/${encodeURIComponent(pickupPointId as string)}`
      )
  );

  registerAccountedTool(
    server,
    "logistics_shipping_get_freight_values",
    "Logistics > Shipping: simulate freight. POST /api/fulfillment/pvt/orderForms/simulation",
    jsonBodySchema("Simulation payload (items, postalCode, country)."),
    (client, { bodyJson }) =>
      client.post(
        "/api/fulfillment/pvt/orderForms/simulation",
        parseBodyJson(bodyJson as string)
      )
  );

  // Master Data v2
  registerAccountedTool(
    server,
    "masterdata_document_search",
    "Master Data > Document: search documents. GET /api/dataentities/{dataEntity}/search",
    {
      dataEntity: zStr.describe("Data entity acronym, e.g. CL."),
      _fields: z.string().optional().describe("Comma-separated fields."),
      _where: z.string().optional().describe("Where clause."),
      _sort: z.string().optional().describe("Sort expression."),
      _size: z.number().int().optional().describe("Page size."),
    },
    (client, args) =>
      client.get(
        `/api/dataentities/${encodeURIComponent(args.dataEntity as string)}/search`,
        {
          _fields: args._fields as string | undefined,
          _where: args._where as string | undefined,
          _sort: args._sort as string | undefined,
          _size: args._size as number | undefined,
        }
      )
  );

  registerAccountedTool(
    server,
    "masterdata_document_get",
    "Master Data > Document: get by id. GET /api/dataentities/{dataEntity}/documents/{id}",
    {
      dataEntity: zStr.describe("Data entity acronym."),
      id: zStr.describe("Document ID."),
      _fields: z.string().optional().describe("Fields to return."),
    },
    (client, { dataEntity, id, _fields }) =>
      client.get(
        `/api/dataentities/${encodeURIComponent(dataEntity as string)}/documents/${encodeURIComponent(id as string)}`,
        { _fields: _fields as string | undefined }
      )
  );

  registerAccountedTool(
    server,
    "masterdata_document_create",
    "Master Data > Document: create. POST /api/dataentities/{dataEntity}/documents",
    {
      dataEntity: zStr.describe("Data entity acronym."),
      ...jsonBodySchema(),
    },
    (client, { dataEntity, bodyJson }) =>
      client.post(
        `/api/dataentities/${encodeURIComponent(dataEntity as string)}/documents`,
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "masterdata_document_update",
    "Master Data > Document: update (PATCH). PATCH /api/dataentities/{dataEntity}/documents/{id}",
    {
      dataEntity: zStr.describe("Data entity acronym."),
      id: zStr.describe("Document ID."),
      ...jsonBodySchema(),
    },
    (client, { dataEntity, id, bodyJson }) =>
      client.patch(
        `/api/dataentities/${encodeURIComponent(dataEntity as string)}/documents/${encodeURIComponent(id as string)}`,
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "masterdata_document_delete",
    "Master Data > Document: delete. DELETE /api/dataentities/{dataEntity}/documents/{id}",
    {
      dataEntity: zStr.describe("Data entity acronym."),
      id: zStr.describe("Document ID."),
    },
    (client, { dataEntity, id }) =>
      client.delete(
        `/api/dataentities/${encodeURIComponent(dataEntity as string)}/documents/${encodeURIComponent(id as string)}`
      )
  );

  registerAccountedTool(
    server,
    "masterdata_schema_get",
    "Master Data > Schema: get schema. GET /api/dataentities/{dataEntity}/schemas/{schemaName}",
    {
      dataEntity: zStr.describe("Data entity acronym."),
      schemaName: zStr.describe("Schema name."),
    },
    (client, { dataEntity, schemaName }) =>
      client.get(
        `/api/dataentities/${encodeURIComponent(dataEntity as string)}/schemas/${encodeURIComponent(schemaName as string)}`
      )
  );

  registerAccountedTool(
    server,
    "masterdata_schema_create",
    "Master Data > Schema: create/update schema. PUT /api/dataentities/{dataEntity}/schemas/{schemaName}",
    {
      dataEntity: zStr.describe("Data entity acronym."),
      schemaName: zStr.describe("Schema name."),
      ...jsonBodySchema("JSON Schema body."),
    },
    (client, { dataEntity, schemaName, bodyJson }) =>
      client.put(
        `/api/dataentities/${encodeURIComponent(dataEntity as string)}/schemas/${encodeURIComponent(schemaName as string)}`,
        parseBodyJson(bodyJson as string)
      )
  );
}
