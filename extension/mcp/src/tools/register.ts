import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerAccountTools } from "./account";
import { registerGraphqlFaststoreTools } from "./graphql/faststore";
import {
  registerGraphqlIoTools,
  registerGraphqlSearchTools,
} from "./graphql/searchAndIo";
import { registerB2bAndMiscTools } from "./rest/b2bAndMisc";
import { registerCatalogTools } from "./rest/catalog";
import { registerCommerceExtraTools } from "./rest/commerceExtra";
import { registerOrdersTools } from "./rest/orders";
import { registerPlatformExtraTools } from "./rest/platformExtra";
import { registerPricingLogisticsMasterDataTools } from "./rest/pricingLogisticsMasterdata";

export function registerAll(server: McpServer): void {
  registerAccountTools(server);
  registerCatalogTools(server);
  registerOrdersTools(server);
  registerPricingLogisticsMasterDataTools(server);
  registerCommerceExtraTools(server);
  registerB2bAndMiscTools(server);
  registerPlatformExtraTools(server);
  registerGraphqlSearchTools(server);
  registerGraphqlIoTools(server);
  registerGraphqlFaststoreTools(server);
}
