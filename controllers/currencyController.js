// Free IP geolocation → currency mapping
const COUNTRY_CURRENCY = {
  BD: "BDT", US: "USD", GB: "GBP", EU: "EUR", DE: "EUR", FR: "EUR",
  IN: "INR", AU: "AUD", CA: "CAD", JP: "JPY", CN: "CNY", SG: "SGD",
  AE: "AED", SA: "SAR", PK: "PKR", NG: "NGN", BR: "BRL", MX: "MXN",
};

export const detectCurrency = async (req, res) => {
  try {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
    const isLocal = ip === "127.0.0.1" || ip === "::1" || ip?.startsWith("192.168");
    if (isLocal) return res.json({ currency: "USD", country: "US" });

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`);
    const data = await response.json();
    const currency = COUNTRY_CURRENCY[data.countryCode] || "USD";
    res.json({ currency, country: data.countryCode });
  } catch {
    res.json({ currency: "USD", country: "US" });
  }
};
