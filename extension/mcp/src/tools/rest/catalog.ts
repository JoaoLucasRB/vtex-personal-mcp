import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { VtexClient } from "../../client";
import { errorText, runWithAccount, textResult } from "../../tooling";
import {
  jsonBodySchema,
  parseBodyJson,
  registerAccountedTool,
  zNum,
  zStr,
} from "./helpers";

const skuSelectionModeSchema = z.enum(["SPECIFICATION", "LIST", "COMBO"]);

const categoryPayloadSchema = z.object({
  Name: z.string().describe("Category name."),
  FatherCategoryId: z
    .number()
    .int()
    .nullable()
    .optional()
    .describe("Parent category ID. Use null for a root category."),
  Title: z.string().describe("HTML title tag text for the category page."),
  Description: z
    .string()
    .describe("Meta description text for the category page."),
  Keywords: z.string().describe("Substitute/search keywords for the category."),
  IsActive: z.boolean().describe("Whether the category page is available."),
  ShowInStoreFront: z
    .boolean()
    .describe("Whether the category appears in store menus."),
  ShowBrandFilter: z
    .boolean()
    .describe("Whether the category page shows a brand filter."),
  ActiveStoreFrontLink: z
    .boolean()
    .describe("Whether the category link is active in the storefront."),
  GlobalCategoryId: z
    .number()
    .int()
    .describe("Google product taxonomy / global category ID."),
  StockKeepingUnitSelectionMode: skuSelectionModeSchema.describe(
    "SKU selection mode: SPECIFICATION, LIST, or COMBO."
  ),
  Id: z
    .number()
    .int()
    .optional()
    .nullable()
    .describe(
      "Optional custom category ID on create. Omit to let VTEX assign one."
    ),
  Score: z
    .number()
    .int()
    .optional()
    .nullable()
    .describe("Optional score used for category ordering."),
});

type CategoryPayload = z.infer<typeof categoryPayloadSchema>;

function categoryToApiBody(
  payload: CategoryPayload,
  includeId: boolean
): Record<string, unknown> {
  const data: Record<string, unknown> = { ...payload };
  if (!includeId || data.Id === null || data.Id === undefined) {
    delete data.Id;
  }
  if (data.Score === null || data.Score === undefined) {
    delete data.Score;
  }
  if (data.FatherCategoryId === undefined) {
    data.FatherCategoryId = null;
  }
  return data;
}

async function createCategory(
  client: VtexClient,
  payload: CategoryPayload
): Promise<unknown> {
  return client.post(
    "/api/catalog/pvt/category",
    categoryToApiBody(payload, true)
  );
}

async function updateCategory(
  client: VtexClient,
  categoryId: number,
  payload: CategoryPayload
): Promise<unknown> {
  return client.put(
    `/api/catalog/pvt/category/${categoryId}`,
    categoryToApiBody(payload, false)
  );
}

/**
 * Catalog REST tools that GraphQL cannot cover (admin writes / admin brand list).
 * Category/product/SKU reads → use graphql_search_* / graphql_io_* instead.
 */
export function registerCatalogTools(server: McpServer): void {
  server.tool(
    "catalog_category_create",
    "Catalog > Category: create a category (REST gap — not available via Search/IO GraphQL). POST /api/catalog/pvt/category. For reads use graphql_io_query categories/category. Uses the open project account only.",
    {
      ...categoryPayloadSchema.shape,
    },
    async (args) => {
      try {
        const text = await runWithAccount((client) =>
          createCategory(client, args)
        );
        return textResult(text);
      } catch (error) {
        return textResult(errorText(error));
      }
    }
  );

  server.tool(
    "catalog_category_update",
    "Catalog > Category: update a category (REST gap). PUT /api/catalog/pvt/category/{categoryId}. For reads use graphql_io_query. Uses the open project account only.",
    {
      categoryId: z.number().int().describe("Category ID to update."),
      ...categoryPayloadSchema.omit({ Id: true }).shape,
    },
    async (args) => {
      try {
        const { categoryId, ...payload } = args;
        const text = await runWithAccount((client) =>
          updateCategory(client, categoryId, payload)
        );
        return textResult(text);
      } catch (error) {
        return textResult(errorText(error));
      }
    }
  );

  registerAccountedTool(
    server,
    "catalog_brand_list",
    "Catalog > Brand: list brands (admin). GET /api/catalog_system/pvt/brand/list",
    {},
    (client) => client.get("/api/catalog_system/pvt/brand/list")
  );

  registerAccountedTool(
    server,
    "catalog_brand_get",
    "Catalog > Brand: get brand by ID (admin). GET /api/catalog/pvt/brand/{brandId}",
    { brandId: zNum.describe("Brand ID.") },
    (client, { brandId }) =>
      client.get(`/api/catalog/pvt/brand/${brandId as number}`)
  );

  registerAccountedTool(
    server,
    "catalog_brand_create",
    "Catalog > Brand: create brand (REST gap). POST /api/catalog/pvt/brand",
    jsonBodySchema("Brand payload."),
    (client, { bodyJson }) =>
      client.post("/api/catalog/pvt/brand", parseBodyJson(bodyJson as string))
  );

  registerAccountedTool(
    server,
    "catalog_brand_update",
    "Catalog > Brand: update brand (REST gap). PUT /api/catalog/pvt/brand/{brandId}",
    {
      brandId: zNum.describe("Brand ID."),
      ...jsonBodySchema("Brand payload."),
    },
    (client, { brandId, bodyJson }) =>
      client.put(
        `/api/catalog/pvt/brand/${brandId as number}`,
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "catalog_product_create",
    "Catalog > Product: create product (REST gap — reads via graphql_search_query). POST /api/catalog/pvt/product",
    jsonBodySchema("Product payload."),
    (client, { bodyJson }) =>
      client.post("/api/catalog/pvt/product", parseBodyJson(bodyJson as string))
  );

  registerAccountedTool(
    server,
    "catalog_product_update",
    "Catalog > Product: update product (REST gap). PUT /api/catalog/pvt/product/{productId}",
    {
      productId: zNum.describe("Product ID."),
      ...jsonBodySchema("Product payload."),
    },
    (client, { productId, bodyJson }) =>
      client.put(
        `/api/catalog/pvt/product/${productId as number}`,
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "catalog_sku_get_by_ref_id",
    "Catalog > SKU: get SKU by RefId (admin lookup before writes). GET /api/catalog/pvt/stockkeepingunit?RefId=",
    { refId: zStr.describe("SKU RefId.") },
    (client, { refId }) =>
      client.get("/api/catalog/pvt/stockkeepingunit", {
        RefId: refId as string,
      })
  );

  registerAccountedTool(
    server,
    "catalog_sku_create",
    "Catalog > SKU: create SKU (REST gap). POST /api/catalog/pvt/stockkeepingunit",
    jsonBodySchema("SKU payload."),
    (client, { bodyJson }) =>
      client.post(
        "/api/catalog/pvt/stockkeepingunit",
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "catalog_specification_get_by_category",
    "Catalog > Specification: list fields by category (admin). GET /api/catalog_system/pub/specification/field/listByCategoryId/{categoryId}",
    { categoryId: zNum.describe("Category ID.") },
    (client, { categoryId }) =>
      client.get(
        `/api/catalog_system/pub/specification/field/listByCategoryId/${categoryId as number}`
      )
  );

  registerAccountedTool(
    server,
    "catalog_specification_create",
    "Catalog > Specification: create specification (REST gap). POST /api/catalog/pvt/specification",
    jsonBodySchema("Specification payload."),
    (client, { bodyJson }) =>
      client.post(
        "/api/catalog/pvt/specification",
        parseBodyJson(bodyJson as string)
      )
  );

  registerAccountedTool(
    server,
    "catalog_seller_portal_product_create",
    "Catalog Seller Portal > Product: create product (REST write gap). POST /api/catalog-seller-portal/products",
    jsonBodySchema(),
    (client, { bodyJson }) =>
      client.post(
        "/api/catalog-seller-portal/products",
        parseBodyJson(bodyJson as string)
      )
  );
}
