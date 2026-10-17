import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const data = searchParams.get("data") || "ace:default";

    // Generate SVG string
    const svg = await QRCode.toString(data, {
      type: "svg",
      color: {
        dark: "#00F0FF",
        light: "#00000000", // transparent
      },
      margin: 1,
      width: 256,
    });

    return new Response(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error generating QR";
    return new Response(errorMsg, { status: 500 });
  }
}
