import { d as defineEventHandler, a as getQuery, s as sendError, c as createError } from '../../_/nitro.mjs';
import { XMLParser } from 'fast-xml-parser';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';

const rss = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e;
  const query = getQuery(event);
  const url = String((_a = query.url) != null ? _a : "");
  if (!url || !/^https?:\/\//i.test(url)) {
    return sendError(event, createError({ statusCode: 400, statusMessage: "Missing or invalid url parameter" }));
  }
  try {
    const raw = await $fetch(url, {
      responseType: "text",
      headers: { "User-Agent": "Vindicter/1.0 RSS Reader (+https://vindicter.xyz)", Accept: "application/rss+xml, application/xml, text/xml, */*" },
      timeout: 8e3
    });
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const parsed = parser.parse(raw);
    const channel = (_d = (_c = (_b = parsed == null ? void 0 : parsed.rss) == null ? void 0 : _b.channel) != null ? _c : parsed == null ? void 0 : parsed.feed) != null ? _d : null;
    if (!channel) return { items: [] };
    const rawItems = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];
    const atomItems = Array.isArray(channel.entry) ? channel.entry : channel.entry ? [channel.entry] : [];
    const items = [...rawItems, ...atomItems].map((item) => {
      var _a2, _b2, _c2, _d2, _e2, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
      return {
        title: String((_c2 = (_b2 = (_a2 = item.title) == null ? void 0 : _a2["#text"]) != null ? _b2 : item.title) != null ? _c2 : "").trim(),
        link: String((_i = (_h = (_g = (_e2 = (_d2 = item.link) == null ? void 0 : _d2["@_href"]) != null ? _e2 : item.link) != null ? _g : (_f = item.guid) == null ? void 0 : _f["#text"]) != null ? _h : item.guid) != null ? _i : "").trim(),
        description: String((_o = (_n = (_l = (_k = item.description) != null ? _k : (_j = item.summary) == null ? void 0 : _j["#text"]) != null ? _l : item.summary) != null ? _n : (_m = item.content) == null ? void 0 : _m["#text"]) != null ? _o : "").replace(/<[^>]*>/g, "").slice(0, 500).trim(),
        pubDate: (_r = (_q = (_p = item.pubDate) != null ? _p : item.published) != null ? _q : item.updated) != null ? _r : null
      };
    }).filter((i) => i.title && i.link).slice(0, 30);
    return { items };
  } catch (e) {
    return sendError(event, createError({ statusCode: 502, statusMessage: `Failed to fetch feed: ${(_e = e == null ? void 0 : e.message) != null ? _e : "unknown error"}` }));
  }
});

export { rss as default };
//# sourceMappingURL=rss.mjs.map
