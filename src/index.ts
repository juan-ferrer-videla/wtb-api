import { Hono } from "hono";
import { cors } from "hono/cors";
import { getDealers } from "./utils";
import { z } from "zod";

const app = new Hono();

const typeSchema = z
  .union([
    z.literal("stores"),
    z.literal("vets"),
    z.literal("vetsOnline"),
    z.literal("storesOnline"),
    z.literal("shelters"),
  ])
  .optional();

app.use("*", cors());
app.get("/", async (c) => {
  const locale = c.req.query("locale");
  const lat = c.req.query("lat");
  const lng = c.req.query("lng");
  const rad = c.req.query("rad");
  const { success, data: type } = typeSchema.safeParse(c.req.query("type"));
  const baseUrl = c.req.query("baseUrl");

  const dealers = await getDealers({
    baseUrl,
    locale,
    type: success ? type : undefined,
    coords: {
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
      rad: rad ? parseFloat(rad) : undefined,
    },
  });
  return c.json(dealers);
});

export default { port: 3000, fetch: app.fetch };
