// Mellow Fellow — WebMCP Tool Definitions
// Exposes site actions to AI agents via the WebMCP API (navigator.modelContext)
// Spec: https://webmachinelearning.github.io/webmcp/

(function () {
  if (typeof navigator === 'undefined' || !navigator.modelContext) return;

  navigator.modelContext.provideContext({
    tools: [
      {
        name: "browse_products",
        description: "Browse Mellow Fellow hemp-derived products by category. Categories: disposables, cartridges, edibles, flower, concentrates, syringes, drinks.",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "Product category to browse",
              enum: ["disposables", "cartridges", "edibles", "flower", "concentrates", "syringes", "drinks"]
            }
          }
        },
        execute: async ({ category }) => {
          const base = "https://mellowfellowcarts.com/shop";
          const url = category ? `${base}/${category}` : base;
          window.location.href = url;
          return { url };
        }
      },
      {
        name: "order_via_whatsapp",
        description: "Initiate an order for Mellow Fellow products via WhatsApp. Minimum order $100. Accepts crypto (BTC/USDT) and bank transfer.",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Pre-filled order message to send via WhatsApp"
            }
          }
        },
        execute: async ({ message }) => {
          const base = "https://wa.me/12162505746";
          const url = message ? `${base}?text=${encodeURIComponent(message)}` : base;
          window.open(url, '_blank');
          return { url };
        }
      },
      {
        name: "get_wholesale_info",
        description: "Get wholesale pricing information. Tiers: 5+ units = 30% off, 10+ = 40% off, 25+ = 50% off retail.",
        inputSchema: { type: "object", properties: {} },
        execute: async () => {
          window.location.href = "https://mellowfellowcarts.com/wholesale";
          return {
            url: "https://mellowfellowcarts.com/wholesale",
            tiers: [
              { min_units: 5, discount: "30%" },
              { min_units: 10, discount: "40%" },
              { min_units: 25, discount: "50%" }
            ],
            min_order_usd: 100,
            free_shipping_threshold_usd: 200
          };
        }
      },
      {
        name: "search_products",
        description: "Search Mellow Fellow products by name, strain, or cannabinoid type (THCa, THCp, THCh, Delta-8, Delta-9, CBD, CBG).",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search term — product name, strain, blend name, or cannabinoid"
            }
          },
          required: ["query"]
        },
        execute: async ({ query }) => {
          window.location.href = `https://mellowfellowcarts.com/shop?s=${encodeURIComponent(query)}`;
          return { query, url: `https://mellowfellowcarts.com/shop?s=${encodeURIComponent(query)}` };
        }
      },
      {
        name: "read_education",
        description: "Access Mellow Fellow educational blog posts about cannabinoids, product guides, and hemp topics.",
        inputSchema: {
          type: "object",
          properties: {
            topic: {
              type: "string",
              description: "Topic to read about — e.g. THCa, live resin, delta-8, wellness"
            }
          }
        },
        execute: async ({ topic }) => {
          window.location.href = "https://mellowfellowcarts.com/blog";
          return { url: "https://mellowfellowcarts.com/blog", topic };
        }
      }
    ]
  });
})();
