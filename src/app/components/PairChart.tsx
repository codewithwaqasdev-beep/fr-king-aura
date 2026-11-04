import { Activity } from "lucide-react";

interface PairChartProps {
  pair: string;
  market: "OTC Markets" | "Live Markets";
}

export function PairChart({ pair, market }: PairChartProps) {
  const cleanPair = pair.replace(/\s*\(OTC\)/i, "").replace("/", "").trim().toUpperCase();
  const symbol = `FX:${cleanPair}`;
  const searchParams = new URLSearchParams({
    symbol,
    interval: "1",
    theme: "dark",
    style: "1",
    timezone: "Etc/UTC",
    locale: "en",
    hidesidetoolbar: "1",
    hide_top_toolbar: "0",
    saveimage: "0",
    withdateranges: "0",
    backgroundColor: "#001719",
    toolbarbg: "001719",
  });
  const chartUrl = `https://s.tradingview.com/widgetembed/?${searchParams.toString()}`;
  const displayPair = pair.replace(/\s*\(OTC\)/i, "");

  return (
    <figure id="market-chart" className="pair-chart" aria-label={`${displayPair} live market chart`}>
      <figcaption className="pair-chart-header">
        <div className="pair-chart-identity">
          <span className="pair-chart-dot" />
          <strong>{displayPair}</strong>
          <span className="pair-chart-market">
            {market === "OTC Markets" ? "QUOTEX OTC" : "FOREX"}
          </span>
        </div>
      </figcaption>

      <div className="pair-chart-caption">
        <span>M1 · LIVE MARKET</span>
        <span>TRADINGVIEW</span>
      </div>

      <iframe
        key={symbol}
        className="pair-chart-live"
        src={chartUrl}
        title={`${displayPair} live chart`}
        loading="lazy"
        allowFullScreen
        referrerPolicy="origin"
      />

      <div className="pair-chart-footer">
        <span>
          <Activity size={11} className="inline mr-1 text-[#00D68F]" />
          LIVE CHART
        </span>
        <span>
          {market === "OTC Markets"
            ? "OTC uses regular market pricing"
            : "Real market data"}
        </span>
      </div>
    </figure>
  );
}
