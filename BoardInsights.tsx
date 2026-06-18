/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { Card } from "../types";
import { BarChart, CheckCircle2, TrendingUp, X, Award, Info } from "lucide-react";
import * as d3 from "d3";

interface BoardInsightsProps {
  onClose: () => void;
}

interface DailyCompletion {
  date: string;
  fullDate: string;
  count: number;
  tasks: string[];
}

export default function BoardInsights({ onClose }: BoardInsightsProps) {
  const cards = useStore((state) => state.cards);
  const activeBoardId = useStore((state) => state.activeBoardId);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [dimensions, setDimensions] = useState({ width: 320, height: 245 });
  const [hoveredDay, setHoveredDay] = useState<DailyCompletion | null>(null);

  // Filter cards to only those belonging to the active board
  const activeCardsList = Object.values(cards).filter(
    (card) => card.boardId === activeBoardId && !card.isArchived
  );

  // Generate date labels & count completed tasks for the last 7 days
  const getPastWeekData = (cardsList: Card[]): DailyCompletion[] => {
    const result: DailyCompletion[] = [];
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayName = daysOfWeek[d.getDay()];
      const label = `${dayName} ${d.getDate()}`;
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dayKey = `${year}-${month}-${day}`;
      
      result.push({
        date: label,
        fullDate: dayKey,
        count: 0,
        tasks: []
      });
    }

    cardsList.forEach((card) => {
      if (card.completedAt) {
        const compDate = new Date(card.completedAt);
        const year = compDate.getFullYear();
        const month = String(compDate.getMonth() + 1).padStart(2, "0");
        const day = String(compDate.getDate()).padStart(2, "0");
        const cardDayKey = `${year}-${month}-${day}`;
        
        const dayData = result.find((r) => r.fullDate === cardDayKey);
        if (dayData) {
          dayData.count += 1;
          dayData.tasks.push(card.title);
        }
      }
    });

    return result;
  };

  const chartData = getPastWeekData(activeCardsList);
  const totalCompletedLastWeek = chartData.reduce((sum, item) => sum + item.count, 0);
  const maxCompleted = Math.max(...chartData.map((d) => d.count), 1);
  const mostProductiveDay = chartData.reduce(
    (max, item) => (item.count > max.count ? item : max),
    chartData[0]
  );

  // Observe container size to make D3 chart responsive
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      setDimensions({
        width: Math.max(width - 8, 250),
        height: 220
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Render D3 Graphic
  useEffect(() => {
    if (!svgRef.current || chartData.length === 0) return;

    // Clear previous elements
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 15, right: 10, bottom: 30, left: 25 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X scale
    const x = d3
      .scaleBand()
      .domain(chartData.map((d) => d.date))
      .range([0, width])
      .padding(0.25);

    // Y scale
    const yMarginMax = Math.ceil(maxCompleted * 1.15);
    const y = d3
      .scaleLinear()
      .domain([0, yMarginMax === 0 ? 5 : yMarginMax])
      .nice()
      .range([height, 0]);

    // Grid lines
    svg
      .append("g")
      .attr("className", "grid-lines opacity-10")
      .call(
        d3
          .axisLeft(y)
          .tickSize(-width)
          .tickFormat(() => "")
      )
      .call((g) => g.select(".domain").remove())
      .selectAll("line")
      .attr("stroke", "#ffffff");

    // X-Axis
    svg
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickSize(5))
      .call((g) => g.select(".domain").attr("stroke", "rgba(255, 255, 255, 0.2)"))
      .call((g) => g.selectAll("line").attr("stroke", "rgba(255, 255, 255, 0.2)"))
      .selectAll("text")
      .attr("fill", "rgba(255, 255, 255, 0.6)")
      .style("font-size", "9px")
      .style("font-family", "inherit")
      .style("font-weight", "600");

    // Y-Axis
    svg
      .append("g")
      .call(d3.axisLeft(y).ticks(Math.min(5, maxCompleted + 1)).tickFormat(d3.format("d")))
      .call((g) => g.select(".domain").attr("stroke", "rgba(255, 255, 255, 0.2)"))
      .call((g) => g.selectAll("line").attr("stroke", "rgba(255, 255, 255, 0.2)"))
      .selectAll("text")
      .attr("fill", "rgba(255, 255, 255, 0.6)")
      .style("font-size", "9px")
      .style("font-family", "inherit");

    // Defs for gradients
    const defs = svg.append("defs");
    const barGradient = defs
      .append("linearGradient")
      .attr("id", "bar-grad")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    barGradient.append("stop").attr("offset", "0%").attr("stop-color", "#1e3a8a"); // deep blue
    barGradient.append("stop").attr("offset", "100%").attr("stop-color", "#3b82f6"); // bright blue

    // Highlight gradient
    const highlightGrad = defs
      .append("linearGradient")
      .attr("id", "active-bar-grad")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    highlightGrad.append("stop").attr("offset", "0%").attr("stop-color", "#2563eb");
    highlightGrad.append("stop").attr("offset", "100%").attr("stop-color", "#60a5fa");

    // Render Bars
    const bars = svg
      .selectAll(".bar")
      .data(chartData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.date) || 0)
      .attr("width", x.bandwidth())
      .attr("y", height) // start at bottom for transition animation
      .attr("height", 0)
      .attr("fill", "url(#bar-grad)")
      .attr("stroke", "rgba(255, 255, 255, 0.1)")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .attr("fill", "url(#active-bar-grad)")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 1.5);
        setHoveredDay(d);
      })
      .on("mouseleave", function (event, d) {
        d3.select(this)
          .attr("fill", "url(#bar-grad)")
          .attr("stroke", "rgba(255, 255, 255, 0.1)")
          .attr("stroke-width", 1);
      });

    // Animate bars entrance
    bars
      .transition()
      .duration(350)
      .delay((d, i) => i * 30)
      .attr("y", (d) => y(d.count))
      .attr("height", (d) => height - y(d.count));

    // Numbers above bars
    svg
      .selectAll(".bar-label")
      .data(chartData)
      .enter()
      .append("text")
      .attr("class", "bar-label")
      .text((d) => (d.count > 0 ? d.count : ""))
      .attr("x", (d) => (x(d.date) || 0) + x.bandwidth() / 2)
      .attr("y", height)
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .style("font-size", "10px")
      .style("font-family", "inherit")
      .style("font-weight", "800")
      .style("pointer-events", "none")
      .transition()
      .duration(350)
      .delay((d, i) => i * 30)
      .attr("y", (d) => y(d.count) - 5);

  }, [chartData, dimensions, maxCompleted]);

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-[#0c0c0c] border-l border-white/10 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black">
        <div className="flex items-center gap-1.5">
          <BarChart className="w-4 h-4 text-blue-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-white">Board Insights</h3>
        </div>
        <button
          onClick={onClose}
          className="text-[10px] font-black uppercase tracking-wider text-white/40 hover:text-white border border-white/10 px-2 py-1"
        >
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {/* Core Stats Bento Block */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111111] border border-white/5 p-3.5 flex flex-col justify-between">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest font-mono">
              WEEKLY DELIVERED
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-blue-400">{totalCompletedLastWeek}</span>
              <span className="text-[10px] text-white/50 font-bold">tasks</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[8px] text-emerald-400 font-mono font-bold uppercase">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>LIVE PIPELINE</span>
            </div>
          </div>

          <div className="bg-[#111111] border border-white/5 p-3.5 flex flex-col justify-between">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest font-mono">
              PEAK VELOCITY
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl font-black text-white uppercase">{mostProductiveDay.count}</span>
              <span className="text-[8px] text-white/40 font-mono">ON {mostProductiveDay.date.split(" ")[0]}</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[8px] text-blue-400 font-mono font-bold uppercase">
              <TrendingUp className="w-2.5 h-2.5" />
              <span>ACTIVE PACE</span>
            </div>
          </div>
        </div>

        {/* Real-Time Chart Area */}
        <div className="bg-[#111111] border border-white/10 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-white/50 uppercase tracking-wider">
              // VELOCITY CHART (7D)
            </span>
            <span className="text-[8px] text-white/30 font-mono">D3 RENDERED</span>
          </div>
          
          <div ref={containerRef} className="w-full flex justify-center bg-black/40 py-2 border border-white/5 relative">
            <svg ref={svgRef}></svg>
          </div>

          <div className="flex items-center gap-1 text-[9px] text-white/40 uppercase font-bold leading-normal">
            <Info className="w-3 h-3 text-blue-500 flex-shrink-0" />
            <span>Hover or tap individual bars to display detailed task schedules below.</span>
          </div>
        </div>

        {/* Interactive List section */}
        <div className="bg-[#111111] border border-white/5 p-4 space-y-3">
          {hoveredDay ? (
            <>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">
                  {hoveredDay.date.toUpperCase()} • COMPLETED
                </span>
                <span className="text-[9px] bg-blue-600/30 text-blue-400 border border-blue-500/50 px-1.5 py-0.5 rounded-none font-mono font-black">
                  {hoveredDay.count} TASKS
                </span>
              </div>
              
              {hoveredDay.tasks.length === 0 ? (
                <p className="text-[10px] text-white/30 uppercase font-semibold py-2">
                  // No developmental checkpoints recorded on this shift.
                </p>
              ) : (
                <ul className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar">
                  {hoveredDay.tasks.map((task, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs bg-black p-2 border border-white/5">
                      <span className="text-blue-500 font-extrabold flex-shrink-0">✓</span>
                      <span className="text-white/80 font-black uppercase tracking-tight text-[10px]">
                        {task}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="text-center py-6 border border-dashed border-white/5 bg-black/40">
              <Award className="w-5 h-5 mx-auto text-white/25 stroke-[1.5] mb-2" />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block">
                HOVER BAR FOR DETAILS
              </span>
              <span className="text-[8px] text-white/30 lowercase mt-1 block">
                inspect daily delivered logs
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
