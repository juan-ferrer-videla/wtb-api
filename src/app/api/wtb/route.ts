import { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-static";

export interface Dealers {
  dealers: Dealer[];
}

export interface Dealer {
  contactname: unknown;
  contactinfo: unknown;
  dealertype: string;
  skus: unknown;
  orderinformation: unknown;
  territorymanager: unknown;
  territoryid: unknown;
  tier: unknown;
  lowestPrice: unknown;
  smallestPackage: unknown;
  id: number;
  name: string;
  address1: string;
  address2: unknown;
  address3: unknown;
  city: unknown;
  state: unknown;
  postalcode: unknown;
  postalcodeext: unknown;
  country: string;
  phone?: string;
  url: unknown;
  distance: number;
  latindegrees: number;
  lngindegrees: number;
  latinradians: number;
  lnginradians: number;
  flags: unknown;
}

const getDealers = async (
  baseUrl: string = "https://www.hillspet.co.kr/services/hills",
  options: {
    locale: string;
    coords: { lat: number; lng: number; rad: number };
    type: "stores" | "vets" | "vetsOnline" | "storesOnline" | "shelters";
  } = {
    locale: "ko_kr",
    coords: {
      lat: 35.907757,
      lng: 127.766922,
      rad: 20,
    },
    type: "stores",
  }
): Promise<Dealers> => {
  const {
    locale,
    coords: { lat, lng, rad },
    type,
  } = options;

  const paths = {
    vets: "/dealers/findVets.json",
    vetsOnline: "/dealers/findOnlineVets.json",
    stores: "/dealers/findPetStores.json",
    storesOnline: "/dealers/findOnlineRetailers.json",
    shelters: "/shelters/findShelters.json",
  } satisfies Record<typeof options.type, string>;

  const url = `${baseUrl}${paths[type]}?locale=${locale}&lat=${lat}&lng=${lng}&rad=${rad}`;
  try {
    const res = await fetch(url);
    if (!res.ok)
      throw new Error(`Bad Response, status:${res.status}\n${res.statusText}`);
    const json = await res.json();
    return json;
  } catch (error) {
    console.error(error);
  }
  return { dealers: [] };
};

export async function GET(request: NextRequest) {
  const schema = z.union([
    z.literal("stores"),
    z.literal("vets"),
    z.literal("vetsOnline"),
    z.literal("storesOnline"),
    z.literal("shelters"),
  ]);
  const searchParams = request.nextUrl.searchParams;
  const locale = searchParams.get("locale");
  const rad = searchParams.get("rad");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const baseUrl = searchParams.get("baseUrl");
  const typeParam = searchParams.get("type");
  const { success, data: type } = schema.safeParse(typeParam);

  const options = {
    locale: locale ?? "ko_kr",
    coords: {
      lat: lat ? parseInt(lat) : 35.907757,
      lng: lng ? parseInt(lng) : 127.766922,
      rad: rad ? parseInt(rad) : 20,
    },
    type: success ? type : "stores",
  };
  const data = await getDealers(
    baseUrl ?? "https://www.hillspet.co.kr/services/hills",
    options
  );
  return Response.json({ data });
}
