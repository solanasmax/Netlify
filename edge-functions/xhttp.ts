// netlify/edge-functions/xhttp.ts
export default async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const targetHost = "ti.titi2.sbs";        // دامنه پنل x-ui تو
  const targetPort = "443";
  const targetProtocol = "https";

  // هدف نهایی بک‌اند
  const targetUrl = `${targetProtocol}://${targetHost}:${targetPort}${url.pathname}${url.search}`;

  try {
    // هدرهای stealth برای شبیه‌سازی مرورگر واقعی (مهم برای سرعت و عبور DPI)
    const headers = new Headers(request.headers);
    
    headers.set("Host", targetHost);
    headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36");
    headers.delete("x-forwarded-for");
    headers.delete("x-real-ip");
    headers.set("Connection", "keep-alive");
    headers.set("Accept-Encoding", "gzip, deflate, br");

    // درخواست به بک‌اند Xray
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: "manual",
      // تنظیمات مهم برای سرعت و streaming در وب‌گردی
      keepalive: true,
    });

    // پاسخ را مستقیم برگردان (برای حفظ سرعت)
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    // هدرهای اضافی برای جلوگیری از کش شدن نامناسب
    newResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    
    return newResponse;

  } catch (error) {
    console.error("XHTTP Relay Error:", error);
    return new Response("Relay Error - Try again", { 
      status: 502,
      headers: { "Content-Type": "text/plain" }
    });
  }
};
