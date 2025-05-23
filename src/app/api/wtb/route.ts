import type { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Función para manejar CORS
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*", // Permite cualquier origen
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400", // 24 horas en segundos
  };
}

// Manejador de OPTIONS para preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

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
  baseUrl = "https://www.hillspet.co.kr/services/hills",
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

  // Log detallado para producción
  console.log("🔍 Production Debug Info:", {
    url,
    environment: process.env.NODE_ENV,
    vercelRegion: process.env.VERCEL_REGION,
    timestamp: new Date().toISOString(),
  });

  try {
    // Timeout más corto para producción
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log("📡 Response Info:", {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      headers: {
        contentType: res.headers.get("content-type"),
        contentLength: res.headers.get("content-length"),
        server: res.headers.get("server"),
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ API Error Response:", {
        status: res.status,
        statusText: res.statusText,
        body: errorText.substring(0, 500), // Primeros 500 chars
      });
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    console.log("📄 Raw Response Length:", text.length);

    let json;
    try {
      json = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ JSON Parse Error:", parseError);
      console.log("📄 Raw Response Preview:", text.substring(0, 200));
      throw new Error("Invalid JSON response");
    }

    console.log("✅ Parsed Response:", {
      dealersCount: json.dealers?.length || 0,
      hasDealer: !!json.dealers,
      firstDealerName: json.dealers?.[0]?.name || "N/A",
    });

    return json;
  } catch (error) {
    console.error("💥 Fetch Error Details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      isAbortError: error instanceof Error && error.name === "AbortError",
      isTimeoutError:
        error instanceof Error && error.message.includes("timeout"),
    });

    // Retornar estructura vacía pero válida
    return { dealers: [] };
  }
};

// Tu función GET con CORS habilitado directamente
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  console.log("🚀 API Route Start:", {
    url: request.url,
    method: request.method,
    userAgent: request.headers.get("user-agent"),
    environment: process.env.NODE_ENV,
    vercelRegion: process.env.VERCEL_REGION,
    timestamp: new Date().toISOString(),
  });

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
      lat: lat ? Number.parseInt(lat) : 35.907757,
      lng: lng ? Number.parseInt(lng) : 127.766922,
      rad: rad ? Number.parseInt(rad) : 20,
    },
    type: success ? type : "stores",
  };

  try {
    const data = await getDealers(
      baseUrl ?? "https://www.hillspet.co.kr/services/hills",
      options
    );

    const duration = Date.now() - startTime;

    console.log("📤 API Route Success:", {
      dealersCount: data.dealers?.length || 0,
      duration: `${duration}ms`,
      success: true,
    });

    // Retorna la respuesta con headers CORS
    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error("💥 API Route Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      duration: `${duration}ms`,
      success: false,
    });

    return new Response(JSON.stringify({ error: "Failed to fetch dealers" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(),
      },
    });
  }
}
