"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  Time,
} from "lightweight-charts";

interface TradingChartProps {
  symbol: string;
}

export default function TradingChart({ symbol }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [timeframe, setTimeframe] = useState<string>("1h");

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 600,
      layout: {
        background: { color: "#131829" },
        textColor: "#8b8fa3",
      },
      grid: {
        vertLines: { color: "#2a2f45" },
        horzLines: { color: "#2a2f45" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#2a2f45",
        tickMarkFormatter: (time: number) => {
          // Format in IST timezone using toLocaleString
          const date = new Date(time * 1000);
          return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        },
      },
      rightPriceScale: {
        mode: 0, // Normal mode works best for crypto
        autoScale: true,
        borderColor: "#2a2f45",
        scaleMargins: {
          top: 0.25, // 25% padding to handle spikes
          bottom: 0.25, // 25% padding
        },
        minimumWidth: 80,
        entireTextOnly: true,
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: "#758696",
          width: 1,
          style: 3,
          labelBackgroundColor: "#00d4aa",
        },
        horzLine: {
          color: "#758696",
          width: 1,
          style: 3,
          labelBackgroundColor: "#00d4aa",
        },
      },
      localization: {
        timeFormatter: (time: number) => {
          // Format time in IST for crosshair tooltip
          const date = new Date(time * 1000);
          return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        },
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#00d4aa",
      downColor: "#ff4976",
      borderVisible: false,
      wickUpColor: "#00d4aa",
      wickDownColor: "#ff4976",
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Fetch historical data
    fetchHistoricalData(symbol, timeframe, candlestickSeries);

    // Set up real-time updates every 3 seconds
    const updateInterval = setInterval(() => {
      fetchLatestCandle(symbol, timeframe, candlestickSeries);
    }, 3000);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(updateInterval);
      chart.remove();
    };
  }, [symbol, timeframe]);

  const fetchHistoricalData = async (
    sym: string,
    interval: string,
    series: ISeriesApi<"Candlestick">,
  ) => {
    try {
      // Map timeframe to Binance interval
      const intervalMap: Record<string, string> = {
        "1m": "1m",
        "5m": "5m",
        "1h": "1h",
        "1d": "1d",
        "1w": "1w",
      };

      const binanceInterval = intervalMap[interval] || "1h";
      const response = await fetch(
        `https://testnet.binance.vision/api/v3/klines?symbol=${sym}&interval=${binanceInterval}&limit=50`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch historical data");
      }

      const data = await response.json();
      let candles: CandlestickData[] = data.map((k: any[]) => ({
        time: (k[0] / 1000) as Time,
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
      }));

      // Validate and clean data using IQR (Interquartile Range) method
      if (candles.length > 0) {
        // Step 1: Validate OHLC relationships
        candles = candles.filter((c) => {
          const isValid =
            c.high >= c.open &&
            c.high >= c.close &&
            c.low <= c.open &&
            c.low <= c.close &&
            !isNaN(c.open) &&
            !isNaN(c.high) &&
            !isNaN(c.low) &&
            !isNaN(c.close);

          if (!isValid) {
            console.warn(`[Chart] Invalid candle data for ${sym}:`, c);
          }
          return isValid;
        });

        // Step 2: IQR-based outlier detection (more robust than median)
        const prices = candles
          .map((c) => (c.high + c.low) / 2)
          .sort((a, b) => a - b);

        if (prices.length >= 4) {
          // Calculate quartiles
          const q1Index = Math.floor(prices.length * 0.25);
          const q3Index = Math.floor(prices.length * 0.75);
          const q1 = prices[q1Index];
          const q3 = prices[q3Index];
          const iqr = q3 - q1;

          // IQR method: outliers are beyond 1.5 * IQR from quartiles
          const lowerBound = q1 - 1.5 * iqr;
          const upperBound = q3 + 1.5 * iqr;

          console.log(
            `[Chart] ${sym} price range: Q1=${q1.toFixed(2)}, Q3=${q3.toFixed(2)}, IQR=${iqr.toFixed(2)}`,
          );
          console.log(
            `[Chart] ${sym} outlier bounds: [${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}]`,
          );

          // Step 3: Clamp outliers instead of dropping them
          candles = candles.map((c) => {
            const avgPrice = (c.high + c.low) / 2;

            if (avgPrice < lowerBound || avgPrice > upperBound) {
              console.warn(`[Chart] Outlier detected for ${sym}:`, {
                time: new Date((c.time as number) * 1000).toISOString(),
                avgPrice: avgPrice.toFixed(2),
                bounds: `[${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}]`,
              });

              // Clamp to bounds instead of dropping
              const clampFactor =
                avgPrice > upperBound
                  ? upperBound / avgPrice
                  : lowerBound / avgPrice;

              return {
                ...c,
                high: c.high * clampFactor,
                low: c.low * clampFactor,
                open: c.open * clampFactor,
                close: c.close * clampFactor,
              };
            }

            return c;
          });
        }
      }

      // Log timestamp range for debugging
      if (candles.length > 0) {
        const firstCandle = candles[0];
        const lastCandle = candles[candles.length - 1];
        console.log(`[Chart] ${sym} data range: `, {
          first: new Date((firstCandle.time as number) * 1000).toISOString(),
          last: new Date((lastCandle.time as number) * 1000).toISOString(),
          count: candles.length,
        });
      }

      series.setData(candles);

      // Fit the chart to show all candles clearly
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
        // Scroll to show the latest (rightmost) candles
        chartRef.current.timeScale().scrollToRealTime();
      }
    } catch (error) {
      console.error("Error fetching historical data:", error);
    }
  };

  const fetchLatestCandle = async (
    sym: string,
    interval: string,
    series: ISeriesApi<"Candlestick">,
  ) => {
    try {
      const intervalMap: Record<string, string> = {
        "1m": "1m",
        "5m": "5m",
        "1h": "1h",
        "1d": "1d",
        "1w": "1w",
      };

      const binanceInterval = intervalMap[interval] || "1h";
      const response = await fetch(
        `https://testnet.binance.vision/api/v3/klines?symbol=${sym}&interval=${binanceInterval}&limit=1`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch latest candle");
      }

      const data = await response.json();
      if (data.length > 0) {
        const k = data[0];
        const candle: CandlestickData = {
          time: (k[0] / 1000) as Time,
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
        };
        series.update(candle);
      }
    } catch (error) {
      console.error("Error fetching latest candle:", error);
    }
  };

  const timeframes = [
    { label: "1m", value: "1m" },
    { label: "5m", value: "5m" },
    { label: "1h", value: "1h" },
    { label: "1d", value: "1d" },
    { label: "1w", value: "1w" },
  ];

  return (
    <div className="bg-bg-secondary rounded-lg border border-border-color p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-text-primary">{symbol}</h3>
        <div className="flex gap-2">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-3 py-1 rounded text-sm ${timeframe === tf.value
                ? "bg-accent-green text-bg-primary"
                : "bg-bg-tertiary text-text-secondary hover:bg-border-color"
                }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={chartContainerRef}
        className="w-full"
        style={{ height: "600px" }}
      />
    </div>
  );
}
