const viewSunburstChart = {
    init: function() {
        // State
        this.svg = d3.select("#chart-display");
        this.svg.selectAll("*").remove();
    },
    render: function() {
        // render only called once

        // Setup:
        const { root } = ctrlMain.getHierarchical(),
            { width, height } = ctrlMain.getDim(),
            radius = width / 12;

        const chart = this.svg.append("g")
            .attr("class", "chart")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);
            
        const format = d3.format(".4g"),
            color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, root.children.length + 1)),
            partition = d3.partition()
                .size([2 * Math.PI, root.height + 1]),
            arc = d3.arc()
                .startAngle(d => d.x0)
                .endAngle(d => d.x1)
                .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
                .padRadius(radius * 1.5)
                .innerRadius(d => d.y0 * radius)
                .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

        // Display name of sample viewed
        let sample = ctrlMain.getCurrentSample();
        this.svg.append("text")
            .attr("class", "current-sample")
            .attr("y", 20)
            .attr("x", 5)
            .style("font", "sans-serif")
            .style("font-size", "20px")
            .style("fill", "black")
            .style("opacity", 0.5)
            .text("Sample: " + (sample || "Averaged Values"));

        root.sum(d => {
                d.value = (d.rank === "Species" ? d.value : 0);
                return d.value;
            })
            .sort((a, b) => b.value - a.value);
        partition(root);
        root.each(d => d.current = d);

        const path = chart.append("g")
            .selectAll("path")
            .data(root.descendants().slice(1))
            .join("path")
                .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.id); })
                .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
                .attr("class", d => arcVisible(d.current) ? "visible-arc" : "not-visible-arc")
                .attr("d", d => arc(d.current));
      
        path.filter(d => d.children)
            .style("cursor", "pointer")
            .on("click", clicked);
      
        path.append("title")
            .text(d => {
                let sample = ctrlMain.getCurrentSample();
                let measuredIntensity = sample ? d.data.samples[sample] : d.data.avgIntensity;

                return `${d.id.replace(/@/g,"/")} \n` +
                    `MS Intensity (excludes unknown peptides): ${format(d.value)} \n` +
                    `MS Intensity (includes unknown peptides): ${format(measuredIntensity)} \n`;
            });
      
        const label = chart.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .style("user-select", "none")
        .selectAll("text")
        .data(root.descendants().slice(1))
        .join("text")
            .attr("dy", "0.35em")
            .attr("fill-opacity", d => +labelVisible(d.current))
            .attr("transform", d => labelTransform(d.current))
            .text(d => d.data.taxon);
      
        const parent = chart.append("circle")
            .datum(root)
            .attr("r", radius)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .on("click", clicked);

        // 2 Center labels:
        const taxonLabel = chart.append("text")
            .attr("class", "taxon-label")
            .attr("text-anchor", "middle")
            .attr("font-size", "20px")
            .attr("pointer-events", "none")
            .text(root.data.taxon);
        
        const propLabel = chart.append("text")
            .attr("class", "proportion-label")
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("pointer-events", "none")
            .attr("dy", "1.2em");
      
        function clicked(p) {
            parent.datum(p.parent || root);
            
            // Update center labels 
            taxonLabel.text(!p.parent ? root.data.taxon : `${ p.data.taxon }`);
            propLabel.text(!p.parent ? `` : `${ d3.format(".1%")(p.data.avgProportion)} of ${p.parent.data.taxon }`)

            root.each(d => d.target = {
                x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                y0: Math.max(0, d.y0 - p.depth),
                y1: Math.max(0, d.y1 - p.depth)
            });

            const t = chart.transition().duration(750);

            // Transition the data on all arcs, even the ones that aren’t visible,
            // so that if this transition is interrupted, entering arcs will start
            // the next transition from the desired position.
            path.transition(t)
                .tween("data", d => {
                    const i = d3.interpolate(d.current, d.target);
                    return t => d.current = i(t);
                })
            .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
            .attr("class", d => arcVisible(d.target) ? "visible-arc" : "not-visible-arc")
            .attrTween("d", d => () => arc(d.current));

            label.filter(function(d) {
                return +this.getAttribute("fill-opacity") || labelVisible(d.target);
            }).transition(t)
                .attr("fill-opacity", d => +labelVisible(d.target))
                .attrTween("transform", d => () => labelTransform(d.current));
        }
        
        function arcVisible(d) {
            return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
        }

        function labelVisible(d) {
            return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
        }

        function labelTransform(d) {
            const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
            const y = (d.y0 + d.y1) / 2 * radius;
            return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
        }
    }
}
