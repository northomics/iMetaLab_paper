const viewCirclePackingChart = {
    init: function() {
        // State
        this.svg = d3.select("#chart-display");
        this.svg.selectAll("*").remove();       // reset main visualization chart

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
        // rendering is only called once

        // Setup:
        const { root, pack } = ctrlMain.getHierarchical(),
            { width, height } = ctrlMain.getDim();

        const chart = this.svg.append("g")
                .attr("class", "chart")
                .attr("transform", `translate(${width / 2}, ${height / 2})`),
            tooltip = d3.select(".viz-tooltip"),
            tooltipDuration = 200;
            
        const format = d3.format(".4g"),
            colorNode = d3.scaleSequential([0, 8], d3.interpolatePuBu);
        let focus = root;

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
        
        // Generate layout
        root.sum(d => d.value)
            .sort((a, b) => b.value - a.value);
        pack(root);

        this.svg.on("click", () => zoom(root));
        const node = chart.selectAll("circle")
            .data(root.descendants().slice(1).filter(d => d.value))
            .join("circle")
                .attr("class", "node")
                .attr("fill", d => colorNode(d.height))
                .attr("opacity", d => d.depth * 0.6)
                .attr("cursor", "pointer")
                .attr("pointer-events", d => !d.children ? "none" : null)
                .on("mouseover", function() {
                    tooltip.transition()
                        .duration(tooltipDuration)
                        .style("opacity", .9);
                    d3.select(this).attr("stroke", "#000");
                })
                .on("mousemove", function(d) {
                    let height = tooltip.node().clientHeight;
                    let width = tooltip.node().clientWidth;
                    let childrenCount = d.children ? d.children.length : 0;
                    tooltip.html(`<strong>Taxon</strong>: ${d.data.taxon} (${d.data.rank})<br>
                                  <strong>Subtaxa</strong>: ${childrenCount}<br>
                                  <strong>MS Intensity</strong>: ${format(d.data.value)}` + (d.parent ?
                                    `<br><br><i class="fas fa-chart-pie"></i> ${d3.format(".1%")(d.data.avgProportion)} of ${d.parent.data.taxon}` :
                                    ``)
                                )
                        .style("left", (d3.event.pageX - width) + "px")
                        .style("top", (d3.event.pageY - height) + "px");
                })
                .on("mouseout", function() {
                    tooltip.transition()
                        .duration(tooltipDuration)
                        .style("opacity", 0);
                    d3.select(this).attr("stroke", null);
                })
                .on("click", d => {
                    let compareSubtaxaProportions = this.menu[1].children[1].action;
                    compareSubtaxaProportions(d);

                    focus !== d && (zoom(d), d3.event.stopPropagation());
                })
                .on("contextmenu", d3.contextMenu(this.menu));

        const label = chart.append("g")
            .style("font", "14px sans-serif")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
        .selectAll("text")
        .data(root.descendants().filter(d => d.value))
        .join("text")
            .attr('class', 'node-label')
            .style("fill-opacity", d => d.parent === root ? 1 : 0)
            .style("display", d => d.parent === root ? "inline" : "none")
            .text(d => d.id.substring(d.id.lastIndexOf("@") + 1));

        zoomTo([root.x, root.y, root.r * 2]);

        function zoomTo(v) {
            const k = height / v[2];

            view = v;

            label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            node.attr("r", d => d.r * k);
        }

        function zoom(d) {
            const focus0 = focus;

            focus = d;

            const transition = chart.transition()
                .duration(d3.event.altKey ? 7500 : 750)
                .tween("zoom", d => {
                    const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                    return t => zoomTo(i(t));
                });

            label
                .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
                .transition(transition)
                    .style("fill-opacity", d => d.parent === focus ? 1 : 0)
                    .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
                    .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
        }
    }
}