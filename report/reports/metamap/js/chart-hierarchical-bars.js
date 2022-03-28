const viewHierarchicalBarChart = {
    init: function() {
        // State
        this.svg = d3.select("#chart-display");
        this.svg.selectAll("*").remove();       // reset main visualization chart

        const margin = {top: 30, right: 150, bottom: 0, left: 120},
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom,
            barHeight= 20;

        const xScale = d3.scaleLinear().range([0, width]),
            xAxis = d3.axisTop(xScale).tickFormat(d3.format(".4g")),
            color = d3.scaleOrdinal().range(["steelblue", "#ccc"]),
            duration = 750,
            delay = 25

        this.dim = { margin, width, height, barHeight };
        this.util = { xScale, xAxis, color, duration, delay };

        this.menu = [
            {
                title: d => "Selection: " + d.data.taxon
            },
            {
                title: "MS Intensity",
                children: [
                    {
                        title: "Compare sample intensities",
                        action: d => {
                            if (!d.data.samples) {
                                alert("No additional MS quantities for this dataset");  // change to modal
                                return;
                            }
                            const name = d.data.taxon;
                            viewMiniChart.renderSamples(name, Object.entries(d.data.samples));
                        }
                    },
                    {
                        title: "Compare subtaxa proportions",
                        action: d => {
                            if (!d.children) {
                                alert("No subtaxa to compare");
                                return;
                            }
                            const sample = ctrlMain.getCurrentSample();
                            viewMiniChart.renderSubtaxa(sample, d);
                        }
                    },
                ]
            },
        ];
    },
    render: function() {
        // Setup
        const chart = this.svg
                .append("g")
                .attr("class", "chart"),
            { menu } = this.menu,
            { margin, width, height, barHeight } = this.dim,
            { xScale, xAxis, color, duration, delay } = this.util,
            { root } = ctrlMain.getHierarchical();
        root.each((node) => node.value = node.data.value)
            .sort((a, b) => b.value - a.value);

        // For displaying name of sample viewed
        let sample = ctrlMain.getCurrentSample();
        this.svg.append("text")
            .attr("class", "current-sample")
            .attr("y", 20)
            .attr("x", margin.right)
            .style("font", "sans-serif")
            .style("font-size", "20px")
            .style("fill", "black")
            .style("opacity", 0.50)
            .text("Sample: " + (sample || "Averaged Values"));

        // For displaying rank and taxon
        chart.append("text")
            .attr("class", "rank-info")
            .attr("y", -5)
            .style("font", "sans-serif")
            .style("font-size", "20px")
            .style("fill", "black")
            .style("opacity", 0.75)

        // x-axis label
        chart.append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("y", -5)
            .attr("x", width / 2)
            .style("font", "sans-serif")
            .style("font-size", "10px")
            .style("fill", "black")
            .text("MS Intensity")
        
        chart.style("transform", `translate(${margin.right}px, ${margin.top + 20}px)`);

        chart.append("rect")
            .attr("class", "background")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "white")
            .on("click", up);

        chart.append("g")
            .attr("class", "x axis")
            .style("transform", `translate(0px, ${margin.top}px)`);

        chart.append("g")
            .attr("class", "y axis")
            .append("line")
            .attr("y1", "100%")
            .style("transform", `translate(0px, ${margin.top}px)`);

        xScale.domain([0, root.value]).nice();
        down(root, 0);

        function down(d, i) {
            if (!d.children || this.__transition__) return;
            var end = duration + d.children.length * delay;

            // Update the rank information
            const rank = d.data.rank,
                taxon = d.data.taxon;

            chart.select(".rank-info")
                .text(taxon === "cellular organisms" ? rank : `${rank}: ${taxon}`);

            // Mark any currently-displayed bars as exiting.
            var exit = chart.selectAll(".enter")
                .attr("class", "exit");

            // Entering nodes immediately obscure the clicked-on bar, so hide it.
            // p is the rect that was just clicked
            exit.selectAll("rect").filter((p) => p === d )
                .style("fill-opacity", 1e-6);

            // Enter the new bars for the clicked-on data.
            // Per above, entering bars are immediately visible.
            var enter = bar(d)
                .attr("transform", stack(i))
                .style("opacity", 1);

            // Have the text fade-in, even though the bars are visible.
            // Color the bars as parents; they will fade to children if appropriate.
            enter.select("text").style("fill-opacity", 1e-6)
            enter.select("rect").style("fill", color(true));

            // Update the x-scale domain.
            xScale.domain([0, d3.max(d.children, (d) => d.value)]).nice();

            // Update the x-axis.
            chart.selectAll(".x.axis").transition()
                .duration(duration)
                .call(xAxis);

            // Transition entering bars to their new position.
            var enterTransition = enter.transition()
                .duration(duration)
                .delay(function(d, i) { return i * delay; })
                .attr("transform", function(d, i) { return "translate(0," + barHeight * i * 1.2 + ")"; });

            // Transition entering text.
            enterTransition.select("text")
                .style("fill-opacity", 1);

            // Transition entering rects to the new x-scale.
            enterTransition.select("rect")
                .attr("width", function(d) { return xScale(d.value); })
                .style("fill", function(d) { return color(!!d.children); });

            // Transition exiting bars to fade out.
            var exitTransition = exit.transition()
                .duration(duration)
                .style("opacity", 1e-6)
                .remove();

            // Transition exiting bars to the new x-scale.
            exitTransition.selectAll("rect")
                .attr("width", function(d) { return xScale(d.value); });

            // Rebind the current node to the background.
            chart.select(".background")
                .datum(d)
                .transition()
                .duration(end);

            d.index = i;
        }
  
        function up(d) {
            if (!d.parent || this.__transition__) return;
            var end = duration + d.children.length * delay;

            // Update the rank information
            const rank = d.parent.data.rank,
                taxon = d.parent.data.taxon;

            chart.select(".rank-info")
                .text(taxon === "cellular organisms" ? rank : `${rank}: ${taxon}`);

            // Mark any currently-displayed bars as exiting.
            var exit = chart.selectAll(".enter")
                .attr("class", "exit");

            // Enter the new bars for the clicked-on data's parent.
            var enter = bar(d.parent)
                .attr("transform", function(d, i) { return "translate(0," + barHeight * i * 1.2 + ")"; })
                .style("opacity", 1e-6);

            // Color the bars as appropriate.
            // Exiting nodes will obscure the parent bar, so hide it.
            enter.select("rect")
                .style("fill", function(d) { return color(!!d.children); })
                .filter(function(p) { return p === d; })
                .style("fill-opacity", 1e-6);

            // Update the x-scale domain.
            xScale.domain([0, d3.max(d.parent.children, (d) => d.value)]).nice();

            // Update the x-axis.
            chart.selectAll(".x.axis").transition()
                .duration(duration)
                .call(xAxis);

            // Transition entering bars to fade in over the full duration.
            var enterTransition = enter.transition()
                .duration(end)
                .style("opacity", 1);

            // Transition entering rects to the new x-scale.
            // When the entering parent rect is done, make it visible!
            enterTransition.select("rect")
                .attr("width", function(d) { return xScale(d.value); })
                .each(function(p) { if (p === d) d3.select(this).style("fill-opacity", null); });

            // Transition exiting bars to the parent's position.
            var exitTransition = exit.selectAll("g").transition()
                .duration(duration)
                .delay(function(d, i) { return i * delay; })
                .attr("transform", stack(d.index));

            // Transition exiting text to fade out.
            exitTransition.select("text")
                .style("fill-opacity", 1e-6);

            // Transition exiting rects to the new scale and fade to parent color.
            exitTransition.select("rect")
                .attr("width", function(d) { return xScale(d.value); })
                .style("fill", color(true));

            // Remove exiting nodes when the last child has finished transitioning.
            exit.transition()
                .duration(end)
                .remove();

            // Rebind the current parent to the background.
            chart.select(".background")
                .datum(d.parent)
                .transition()
                .duration(end);
        }
        // Creates a set of bars for the given data node, at the specified index.
        function bar(d) {
            let data  = d.children.filter(d => d.value !== 0);

            var bar = chart.insert("g", ".y.axis")
                .attr("class", "enter")
                .attr("transform", "translate(0,5)")
                .selectAll("g")
                .data(data)
                .enter().append("g")
                .style("cursor", function(d) { return !d.children ? null : "pointer"; })
                .on("click", down)
                .on("contextmenu", d3.contextMenu(viewHierarchicalBarChart.menu));

            bar.append("text")
                .attr("x", -6)
                .attr("y", barHeight / 2)
                .attr("dy", ".35em")
                .style("transform", `translate(0px, ${margin.top}px)`)
                .style("text-anchor", "end")
                .style("font", "sans-serif")
                .style("font-size", "10px")
                .style("fill", "black")
                .text(function(d) {
                    let names = d.id.split("@"),
                        name = names[names.length - 1];
                    return name;
                });

            bar.append("rect")
                .attr("class", "bar")
                .style("transform", `translate(0px, ${margin.top}px)`)
                .attr("width", function(d) { return xScale(d.value); })
                .attr("height", barHeight);

            return bar;
        }

        // A stateful closure for stacking bars horizontally.
        function stack(i) {
            var x0 = 0;
            return function(d) {
                var tx = "translate(" + x0 + "," + barHeight * i * 1.2 + ")";
                return tx;
            };
        }
    }
}