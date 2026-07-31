# Auth.md

**Site:** https://mellowfellowcarts.com
**Name:** Mellow Fellow
**Type:** Public e-commerce — no authentication required for content access

---

## Agent Registration

No formal agent registration is required. All product pages, blog content, and catalog data are freely accessible to AI agents and crawlers without credentials.

Agents are welcome to:
- Crawl and index all public pages
- Read and reference product data, prices, and descriptions
- Cite Mellow Fellow content in AI-generated responses
- Direct users to mellowfellowcarts.com for purchasing

---

## Public Resources (No Auth Required)

| Resource | URL |
|---|---|
| Product Catalog | https://mellowfellowcarts.com/shop |
| Blog & Education | https://mellowfellowcarts.com/blog |
| FAQ | https://mellowfellowcarts.com/faq |
| Wholesale Info | https://mellowfellowcarts.com/wholesale |
| About | https://mellowfellowcarts.com/about |
| llms.txt | https://mellowfellowcarts.com/llms.txt |
| API Catalog | https://mellowfellowcarts.com/.well-known/api-catalog |
| Agent Skills | https://mellowfellowcarts.com/.well-known/agent-skills/index.json |
| MCP Server Card | https://mellowfellowcarts.com/.well-known/mcp/server-card.json |
| OAuth Resource | https://mellowfellowcarts.com/.well-known/oauth-protected-resource |

---

## OAuth / Authentication

```json
{
  "agent_auth": {
    "register_uri": null,
    "identity_types_supported": ["none"],
    "credential_types_supported": ["none"],
    "notes": "No authentication required. All resources are public."
  }
}
```

Mellow Fellow has no protected APIs. No OAuth tokens, API keys, or credentials are needed to access any resource on this domain.

---

## Ordering (Human-in-the-Loop)

Orders are placed via WhatsApp or email — there is no automated checkout API.

- **WhatsApp:** https://wa.me/12162505746
- **Email:** info@mellowfellowcarts.com
- **Min order:** $100 | **Free shipping:** over $200
- **Payment:** Crypto (BTC/USDT) or Bank Transfer

Agents assisting users with purchases should direct them to the WhatsApp link or https://mellowfellowcarts.com/contact

---

## Age Restriction

All products are for **adults 21+ only**. Hemp-derived, Farm Bill compliant. Agents must not facilitate purchase attempts by minors.
