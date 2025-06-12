import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const PhDiagram = ({ cycleData, domeData }) => {
    const d3Container = useRef(null);
    
    useEffect(() => {
        if (!d3Container.current || d3Container.current.clientWidth === 0) {
            return;
        }

        const margin = { top: 20, right: 20, bottom: 50, left: 60 };
        const width = d3Container.current.clientWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        d3.select(d3Container.current).selectAll("*").remove();

        const svg = d3.select(d3Container.current)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        if (!domeData || !domeData.h || domeData.h.length === 0) {
            return;
        }

        const h_domain = d3.extent(domeData.h, d => d / 1000);
        const p_domain = d3.extent(domeData.p, d => d / 1000);

        if (h_domain.includes(undefined) || p_domain.includes(undefined) || h_domain.includes(null) || p_domain.includes(null)) {
            return;
        }

        const xScale = d3.scaleLinear().domain(h_domain).range([0, width]);
        const yScale = d3.scaleLog().domain(p_domain).range([height, 0]).clamp(true);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale));
        
        svg.append("text")
            .attr("class", "axis-label")
            .attr("y", height + 40)
            .attr("x", width / 2)
            .attr("text-anchor", "middle")
            .style("fill", "black")
            .text("Entalpía (h) [kJ/kg]");

        svg.append("g")
            .call(d3.axisLeft(yScale).ticks(5, ".0f"));

        svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", -45)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .style("fill", "black")
            .text("Presión (P) [kPa]");

        const domePoints = domeData.h.map((h, i) => ({ h: h, p: domeData.p[i] }));
        
        const domeLine = d3.line()
            .x(d => xScale(d.h / 1000))
            .y(d => yScale(d.p / 1000))
            .defined(d => d.h != null && d.p != null && d.p > 0);
        
        svg.append("path")
            .datum(domePoints)
            .attr("fill", "lightblue")
            .attr("fill-opacity", 0.3)
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", domeLine);
        
        if (cycleData && cycleData.length > 0) {
            const cycleLine = d3.line()
                .x(d => xScale(d.h / 1000))
                .y(d => yScale(d.p / 1000));

            svg.append("path")
                .datum([...cycleData, cycleData[0]])
                .attr("fill", "rgba(255, 0, 0, 0.3)")
                .attr("stroke", "red")
                .attr("stroke-width", 2)
                .attr("d", cycleLine);
            
            svg.selectAll("circle.cycle")
                .data(cycleData)
                .enter()
                .append("circle")
                .attr("class", "cycle")
                .attr("cx", d => xScale(d.h / 1000))
                .attr("cy", d => yScale(d.p / 1000))
                .attr("r", 5)
                .attr("fill", "darkred");
        }
    }, [cycleData, domeData]);

    return (
        <svg
            className="d3-component"
            ref={d3Container}
            style={{ width: '100%', height: '400px' }}
        />
    );
};

export default PhDiagram;