const viewTreeChart = {
    init: function(type) {
        // State
        this.chartType = type;
        this.drawLabels = true;
        this.nodeSizeNormalized = false;
        this.updateDuration = 200;
        this.tooltipDuration = 200;

        // D3 functions
        this.format = d3.format(".4g");
        this.propToPixels = d3.scaleLinear()   // proportion of taxon to radius/stroke width in pixels
            .domain([0, 1])
            .range([3, 15]);
        this.t = d3.transition().duration(this.updateDuration);
        
        // DOM elems
        this.svg = d3.select("#chart-display");
        this.svg.selectAll("*").remove();       // reset main visualization chart

        this.chart = this.svg.append("g")
            .attr("id", "chart");

        this.links = this.chart.append("g")
            .attr("class", "links")

        this.nodes = this.chart.append("g")
            .attr("class", "nodes")

        this.tooltip = d3.select(".viz-tooltip");

        // Display name of the current sample viewed
        const sample = ctrlMain.getCurrentSample();
        this.svg.append("text")
            .attr("class", "current-sample")
            .attr("y", 20)
            .attr("x", 5)
            .style("font", "sans-serif")
            .style("font-size", "20px")
            .style("fill", "black")
            .style("opacity", 0.5)
            .text("Sample: " + (sample || "Averaged Values"));

        // Save root initial position (needed for updating chart)
        const { root, tree } = ctrlMain.getHierarchical();
        const { width, height } = ctrlMain.getDim();
        root.x0 = width / 6;
        root.y0 = 0;
        
        // Collapse all nodes on init
        // root.eachAfter(d => {
        //     if (d.children && d.depth > 0) {
        //         d._children = d.children;
        //         d.children = null;
        //     }
        // })

        // Determine initial chart position
        if (type === "radial-tree") {
            this.chart.attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");
        }
        else {
            this.chart.attr("transform", `translate(${ width * 0.08 }, ${ height * 0.05 })`);
            tree.size([height * 0.9, width * 0.8]);
        }

        // Context Menues
        this.menuSVG = [
            {
                title: "Clear selection",
                action: () => ctrlMain.clearCurrentSelection()
            }
        ];
        this.svg.on("contextmenu", d3.contextMenu(this.menuSVG));   // attach

        this.menuNode = [
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
            {
                title: "Toggle Nodes",
                children: [
                    {
                        title: "Collapse all other nodes",
                        action: function(d, i) {
                            // Make selected node visible
                            if (this.classList.contains("node-collapsed")) {
                                viewTreeChart.collapseNode(d, this);
                            }
                            // Collapse all other nodes
                            let depth = d.depth;
                            let id = d.id;
                            let otherNodes = d3.selectAll(".node").filter(d => d.depth === depth && d.id !== id);
        
                            otherNodes.nodes().forEach(node => {
                                if (! node.classList.contains("node-collapsed")) {
                                    viewTreeChart.collapseNode(node.__data__, node);
                                }
                            });
                            viewTreeChart.render(d);
                        }
                    },
                    {
                        title: "Expand child nodes",
                        action: function(d, i) {
                            // Get array of child DOM elements
                            const childNodeElems = d3.selectAll(".node").nodes().filter(ele => ele.__data__.parent === d);
                            // Make all nodes in array visible
                            if (childNodeElems.length === 0) {
                                viewTreeChart.collapseNode(d, this);
                            }
                            else {
                                childNodeElems.forEach(ele => {
                                    if (ele.classList.contains("node-collapsed")) {
                                        viewTreeChart.collapseNode(ele.__data__, ele);
                                    }
                                });
                            }
                            viewTreeChart.render(d);
                        }
                    },
                ]
            },
            {
                title: "Select Nodes",
                children: [
                    {
                        title: "Select this node (or ctrl+click)",
                        action: function(d, i) {
                            ctrlMain.addToCurrentSelection(this);
                        }
                    },
                    {
                        title: "Select direct subnodes",
                        action: function(d, i) {
                            if (!d.children) {
                                alert("No subnodes to select");
                                return;
                            }
                            const taxon = d.data.taxon;
                            const depth = d.depth;
                            const subnodes = d3.selectAll(".node")
                                .filter(d => ( d.data.id.indexOf(taxon) > -1 ) && ( d.depth === depth + 1 ));
                            
                            subnodes.nodes().forEach(node => { ctrlMain.addToCurrentSelection(node); })
                        }
                    },
                    {
                        title: "Select all subnodes",
                        action: function(d, i) {
                            if (!d.children) {
                                alert("No subnodes to select");
                                return;
                            }
                            const taxon = d.data.taxon;
                            const depth = d.depth;
                            const subnodes = d3.selectAll(".node")
                                .filter(d => ( d.data.id.indexOf(taxon) > -1 ) && ( d.depth > depth ));

                            subnodes.nodes().forEach(node => { ctrlMain.addToCurrentSelection(node); })
                        }
                    },
                    {
                        divider: true
                    },
                    {
                        title: "Clear selection",
                        action: () => ctrlMain.clearCurrentSelection()
                    }
                ]
            },
            {
                title: "Change Color",
                action: function(d, i) {
                    // Get nodes which color we want to change
                    const selectionArr = Array.from(ctrlMain.getCurrentSelection());
                    const nodeCircle = (selectionArr.length !== 0) ?
                                        d3.selectAll(selectionArr).selectAll("circle") :
                                        d3.select(this).select("circle");
                    const currentColor = d3.color(nodeCircle.style("fill")).hex();

                    // Allow only one instance of color panel
                    const existingPanel = document.getElementById("color-panel");
                    if (existingPanel) { existingPanel.remove(); }
                    const colorPalettePanel = document.getElementById("color-palette-panel");
                    if (colorPalettePanel) { colorPalettePanel.remove(); }
                    
                    // Create panel with color picker
                    jsPanel.create({
                        id: "color-panel",
                        theme: "none",
                        headerTitle: "Color",
                        dragit: { containment: 0 },
                        panelSize: "200 260",
                        resizeit: false,
                        headerControls: {
                            smallify: "remove",
                            maximize: "remove",
                            minimize: "remove"
                        },
                        position: {
                            my: "left-top",
                            at: "right-top",
                            of: nodeCircle.node()
                        },
                        callback: panel => {
                            panel.content.innerHTML = `<form><input type="text" id="color-val" name="color-val" value="#123456"/><form>
                                                        <div id="colorpicker"></div>`
                        },
                    });
                    // callback fires on color change
                    $.farbtastic("#colorpicker").setColor(currentColor).linkTo(color => {
                        d3.select("#color-val")
                            .style("background-color", color)
                            .attr("value", color);
                        
                        nodeCircle.style("fill", color);
                        nodeCircle.data().forEach(d => d.customColor = color);
                    });
                }
            }
        ];
    },
    render: function(source) {
        // Renders and updates either horizontal-tree or radial-tree

        // Get state
        let { chartType, drawLabels, nodeSizeNormalized } = this;
        let { updateDuration, tooltipDuration } = this;
        let { format, propToPixels, t } = this;
        let { svg, chart, nodes, links, tooltip } = this;

        // Re-calculate new tree layout
        let { root, tree } = ctrlMain.getHierarchical();
        root.sort((a, b) => b.data.value - a.data.value);
        root.each(d => {
            d.collapsedChild = false;
            d.r = (d.parent ? d.parent.r * d.data.avgProportion : 75);   // save radius of node
            d.r = (d.r < 3 ? 3 : d.r);  // minimum radius
        });
        tree(root);

        // Links section:
        let link = links.selectAll(".link")
            .data(root.descendants().slice(1), d => d.id);
        
        // Enter new links at parent's previous position
        let linkEnter = link.enter().append("path")
            .attr("class", "link")
            .attr("stroke-opacity", 0.4)
            .style("stroke-width", d => 2 * d.r)
            .attr("d", d => {
                const o = {x: source.x0, y: source.y0};
                return this.diagonal(o, o);
            });
        
        // Update links
        let linkUpdate = link.merge(linkEnter)
            .transition(t)
            .attr("d", d => this.diagonal(d, d.parent));

        // Exit links
        let linkExit = link.exit();

        linkExit.transition(t)
        .attr("d", d => {
            const o = {x: source.x, y: source.y};
            return this.diagonal(o, o);
        });
        
        // Nodes section:
        let node = nodes.selectAll(".node")
            .data(root.descendants(), d => d.id);

        let nodeEnter = node.enter().append("g")
            .classed("node", true)
            .attr("transform", function(d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on("mouseover", function(d) {
                tooltip.transition()
                    .duration(tooltipDuration)
                    .style("opacity", .9);
            })
            .on("mousemove", function(d) {
                let height = tooltip.node().clientHeight;
                let width = tooltip.node().clientWidth;
                let childrenCount = d.children ? d.children.length : d._children ? d._children.length : 0;
                    tooltip.html(`<strong>Taxon</strong>: ${d.data.taxon} (${d.data.rank})<br>
                                  <strong>Subtaxa</strong>: ${childrenCount}<br>
                                  <strong>MS Intensity</strong>: ${format(d.data.value)}` + (d.parent ?
                                    `<br><br><i class="fas fa-chart-pie"></i> ${d3.format(".1%")(d.data.avgProportion)} of ${d.parent.data.taxon} (average)` :
                                    ``)
                                )
                    .style("left", (d3.event.pageX - width) + "px")
                    .style("top", (d3.event.pageY - height) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition()
                    .duration(tooltipDuration)
                    .style("opacity", 0);
            })
            .on("click", function(d) {
                if (d3.event.ctrlKey) {
                    ctrlMain.toggleCurrentSelection(this);
                }
                else {
                    viewTreeChart.collapseNode(d, this);  // pass in data and this elem                
                    viewTreeChart.render(d);
                }
            })
            .on("contextmenu", d3.contextMenu(this.menuNode));

        nodeEnter.append("circle")
            .attr("r", 1e-6);

        nodeEnter.append("text")
            .attr("class", "node-label")
            .style("font", "sans-serif")
            .style("font-size", "10px")
            .style("fill", "black")
            .style("display", this.drawLabels ? "block" : "none")
            .text(d => d.data.taxon);

        // Update nodes
        let nodeUpdate = node.merge(nodeEnter)
            .classed("node-collapsed", d => d._children)
            .classed("node-normalized", nodeSizeNormalized);

        if (chartType === "radial-tree") {
            nodeUpdate.transition(t)
                .attr("transform", d => "translate(" + this.project(d.x, d.y) + ")")    // radial tree
                .attr("fill-opacity", 1);
        }
        else {
            nodeUpdate.transition(t)
                .attr("transform", d => "translate(" + d.y + "," + d.x + ")") // horizontal tree
                .attr("fill-opacity", 1);
        }

        nodeUpdate.select("circle").transition(t)
            .attr("r", d => d.r)
            .style("fill", d => d.customColor ? d.customColor : this.colorNode(d));

        let nodeLabel =  nodeUpdate.select("text");
        if (chartType === "radial-tree") {
            nodeLabel
                .attr("dy", ".31em")
                .attr("x", d => d.x < 180 === !d.children ? 6 : -6)
                .style("text-anchor", d => d.x < 180 === !d.children ? "start" : "end");
            // no rotation if not too cluttered 
            if (nodeUpdate.size() < 100) {
                nodeLabel.attr("transform", d => "rotate(0)");
            }
            else {
                nodeLabel.attr("transform", d => "rotate(" + (d.x < 180 ? d.x - 90 : d.x + 90) + ")");
            }
        }
        else {
            nodeLabel
                .attr("dy", 4)
                .attr("x", d => d.depth === 0 ? -90 : 6)
                .style("text-anchor", "start");
        }
        // Exit Notes
        let nodeExit = node.exit();

        nodeExit.transition(t)
            .attr("transform", d => "translate(" + source.y + "," + source.x + ")")
            .style("fill-opacity", 0)
            .remove();

        // reduce the node circles size to 0
        nodeExit.select("circle")
            .transition(t)
            .attr("r", 1e-6);

        // reduce the opacity of text labels
        nodeExit.select("text")
            .transition(t)
            .style("fill-opacity", 1e-6);

        // Stash the old positions for transition.
        root.eachBefore(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        // Reset zoom
        viewZoom.render(ctrlMain.getChartType());
        if (viewZoom.zoom) {
            svg.transition().duration(0).delay(updateDuration)
                .call(viewZoom.zoom.transform, d3.zoomIdentity);
        }
    },
    diagonal(s, d) {
        let path;
        if (this.chartType === "radial-tree") {
            path = "M" + this.project(s.x, s.y)  
            + "C" + this.project(s.x, (s.y + d.y) / 2)
            + " " + this.project(d.x, (s.y + d.y) / 2)
            + " " + this.project(d.x, d.y);
        }
        else {
            path = `M ${s.y} ${s.x}
                    C ${(s.y + d.y) / 2} ${s.x},
                        ${(s.y + d.y) / 2} ${d.x},
                        ${d.y} ${d.x}`
        }

        return path;
    },
    project: function(x, y) {
        // calculate node and link position For radial tree
        const angle = (x - 90) / 180 * Math.PI, radius = y;
        return [radius * Math.cos(angle), radius * Math.sin(angle)];
    },
    collapseNode: function(d, nodeElem) {
        if (d.children) {
            const parent = d.id;
            d.each(node => { if (node.id !== parent) node.collapsedChild = true; });
            d._children = d.children;
            d.children = null;
            nodeElem.classList.add("node-collapsed");
        }
        else {
            d.children = d._children;
            d._children = null;
            nodeElem.classList.remove("node-collapsed");
        }
    },
    recolorNodes: function(selection) {
        const { t } = this;
        selection.selectAll("circle")
            .transition(t)
            .style("fill", d => d.customColor ? d.customColor : this.colorNode(d));
    },
    colorNode: function(d) {
        const { taxonRanks, color: { currentRank, taxonLevelColor, branchColor } } = ctrlMain.getHierarchical();
        function invert (obj) {         // invert key-value pairs
            var inverted = {};
            for (var key in obj) {
                inverted[obj[key]] = +key;
            }
            return inverted;
        }
        const rankToNum = invert(taxonRanks); // key = taxon level, value = number (ascending)

        // color by taxonomic rank/level:
        let thisRank = d.data.rank;
        if (rankToNum[thisRank] < rankToNum[currentRank]) { return taxonLevelColor(thisRank); }
        
        // color by the specific taxon/branch:
        else {
            const thisTaxon = d.data.taxon;
            if (rankToNum[thisRank] === rankToNum[currentRank]) { return branchColor(thisTaxon); }
            else {
                let p = d;
                while(rankToNum[thisRank] > rankToNum[currentRank]) {
                    p = p.parent;
                    thisRank = p.data.rank;
                }
                return branchColor(p.data.taxon);
            }
        }
    }
}
