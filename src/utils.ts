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

export const getDealers = async (options?: {
  baseUrl?: string;
  locale?: string;
  coords?: { lat?: number; lng?: number; rad?: number };
  type?: "stores" | "vets" | "vetsOnline" | "storesOnline" | "shelters";
}): Promise<Dealers> => {
  const defaultOptions = {
    baseUrl: "https://www.hillspet.co.nz/services/hills",
    locale: "en_nz",
    coords: {
      lat: -40.900557,
      lng: 174.885971,
      rad: 20,
    },
    type: "stores",
  };

  const paths = {
    vets: "/dealers/findVets.json",
    vetsOnline: "/dealers/findOnlineVets.json",
    stores: "/dealers/findPetStores.json",
    storesOnline: "/dealers/findOnlineRetailers.json",
    shelters: "/shelters/findShelters.json",
  };

  const url = `${options?.baseUrl ?? defaultOptions.baseUrl}${
    paths[options?.type ?? "stores"]
  }?locale=${options?.locale ?? defaultOptions.locale}&lat=${
    options?.coords?.lat ?? defaultOptions.coords.lat
  }&lng=${options?.coords?.lng ?? defaultOptions.coords.lng}&rad=${
    options?.coords?.rad ?? defaultOptions.coords.rad
  }`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("💥 Fetch Error Details:", error);
    return { dealers: [] };
  }
};
