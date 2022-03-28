let ctrlToolbar = {
    initCirclePackingChart: function() {
        // disable irrelevant buttons
        d3.selectAll(".zoom-button, .toggle-button, #color-palette, #toolbar-slider")
            .attr("disabled", true);

        // control fontsize
        d3.select("#font-up")
            .attr("disabled", null)
            .on("click", () => {
                let labels = d3.selectAll(".node-label"),
                    fontSize = parseInt(labels.style("font-size")),
                    maxFontSize = 20;
                if (fontSize < maxFontSize) {
                    labels.style("font-size", ++fontSize + "px")
                }
            });
        d3.select("#font-down")
            .attr("disabled", null)
            .on("click", () => {
                let labels = d3.selectAll(".node-label"),
                    fontSize = parseInt(labels.style("font-size")),
                    minFontSize = 9;
                if (fontSize > minFontSize) {
                    labels.style("font-size", --fontSize + "px")
                }
            });

        // set help button to target correct modal
        d3.select("#chart-help").attr("data-target", "#circle-packing-help-modal");
    },
    initTreemapChart: function () {
        // disable irrelevant buttons
        d3.selectAll("#color-palette")
            .attr("disabled", true);

        // control depth of depth of nodes/rectangles
        d3.select("#zoom-in")
            .attr("disabled", null)
            .attr("data-original-title", "Increase Depth")
            .on("click", () => {
                if (viewStaticTreemapChart.drawDepth < 8) {
                    viewStaticTreemapChart.drawDepth++;
                    viewStaticTreemapChart.render();
                }
            });
        d3.select("#zoom-out")
            .attr("disabled", null)
            .attr("data-original-title", "Decrease Depth")
            .on("click", () => {
                if (viewStaticTreemapChart.drawDepth > 0) {
                    viewStaticTreemapChart.drawDepth--;
                    viewStaticTreemapChart.render();
                }
            });

        // control fontsize
        d3.select("#font-up")
            .attr("disabled", null)
            .on("click", () => {
                let labels = d3.selectAll(".node-label"),
                    fontSize = parseInt(labels.style("font-size")),
                    maxFontSize = 20;
                if (fontSize < maxFontSize) {
                    ++fontSize;
                    viewStaticTreemapChart.labelSize = fontSize;
                    labels.style("font-size", fontSize + "px")
                }
            });
        d3.select("#font-down")
            .attr("disabled", null)
            .on("click", () => {
                let labels = d3.selectAll(".node-label"),
                    fontSize = parseInt(labels.style("font-size")),
                    minFontSize = 2;
                if (fontSize > minFontSize) {
                    --fontSize;
                    viewStaticTreemapChart.labelSize = fontSize;
                    labels.style("font-size", fontSize + "px")
                }
            });

        // toggle node labels
        d3.select("#toggle-node-labels")
            .attr("disabled", null)
            .on("click", () => {
                let labels = d3.selectAll(".node-label"),
                    display = labels.style("display");

                if (display === "block") {
                    labels.style("display", "none");
                    viewStaticTreemapChart.drawLabels = false;
                }
                else {
                    labels.style("display", "block");
                    viewStaticTreemapChart.drawLabels = true;
                }
            });

        d3.select("#toggle-node-circles")
            .attr("disabled", null)
            .attr("data-original-title", "Exclude/Include Unknown Peptide Intensity")
            .on("click", () => {
                viewStaticTreemapChart.excludeUnknownPeptides = ! viewStaticTreemapChart.excludeUnknownPeptides;
                viewStaticTreemapChart.render();
            })

        // set help button to target correct modal
        d3.select("#chart-help").attr("data-target", "#treemap-help-modal");

        // slider controls color based on taxonomic rank (kingdom, phylum, etc ...)
        const slider = d3.select("#toolbar-slider"),
            colorLabel = d3.select("#color-rank");

        slider
            .attr("disabled", null)
            .on("input", () => {
                const { color, taxonRanks } = ctrlMain.getHierarchical();
                const currentVal = parseInt(slider.valueOf()._groups[0][0].value);
                color.currentRank = taxonRanks[currentVal];
                colorLabel.text(color.currentRank);
                d3.selectAll(".node rect")
                    .transition().duration(200)
                    .style("fill", (d) => viewStaticTreemapChart.colorNode(d));
            });
    },
    initSunburstChart: function() {
        // disable all buttons
        d3.selectAll(".toolbar-button, #toolbar-slider")
            .attr("disabled", true);

        // set help button to target correct modal
        d3.select("#chart-help").attr("data-target", "#sunburst-help-modal");
    },
    initTreeChart: function() {
        // enable all buttons
        d3.selectAll(".toolbar-button, #toolbar-slider")
            .attr("disabled", null);

        // control zoom (+/-)
        const duration = 500;
        d3.select("#zoom-in")
            .attr("data-original-title", "Zoom In")
            .on("click", () => {
                viewZoom.zoom
                    .scaleBy(viewZoom.svg.transition().duration(duration), 1.3);
            });
        d3.select("#zoom-out")
            .attr("data-original-title", "Zoom Out")
            .on("click", () => {
                viewZoom.zoom
                    .scaleBy(viewZoom.svg.transition().duration(duration), 1 / 1.3);
            });

        // control fontsize
        d3.select("#font-up").on("click", () => {
            let labels = d3.selectAll(".node-label"),
                fontSize = parseInt(labels.style("font-size")),
                maxFontSize = 20;
            if (fontSize < maxFontSize) {
                labels.style("font-size", ++fontSize + "px")
            }
        });
        d3.select("#font-down").on("click", () => {
            let labels = d3.selectAll(".node-label"),
                fontSize = parseInt(labels.style("font-size")),
                minFontSize = 9;
            if (fontSize > minFontSize) {
                labels.style("font-size", --fontSize + "px")
            }
        });

        // toggle nodes and node-labels respectively
        d3.select("#toggle-node-circles").on("click", () => {
            d3.selectAll(".node")
                .classed("node-normalized", d3.selectAll(".node").classed("node-normalized") ? false : true);
            // toggle state
            viewTreeChart.nodeSizeNormalized = ! viewTreeChart.nodeSizeNormalized;
        });
        d3.select("#toggle-node-labels").on("click", () => {
            let labels = d3.selectAll(".node-label"),
                display = labels.style("display");
            
            if (display === "block") {
                labels.style("display", "none");
                viewTreeChart.drawLabels = false;
            } else {
                labels.style("display", "block");
                viewTreeChart.drawLabels = true;
            }
        });

        // set help button to target correct modal
        d3.select("#chart-help").attr("data-target", "#tree-help-modal");

        // enable palette
        this.initColorPalette();

        // slider controls color based on taxonomic rank (kingdom, phylum, etc ...)
        const slider = d3.select("#toolbar-slider"),
            colorLabel = d3.select("#color-rank");

        slider.on("input", () => {
            const { color, taxonRanks } = ctrlMain.getHierarchical();
            const currentVal = parseInt(slider.valueOf()._groups[0][0].value);
            color.currentRank = taxonRanks[currentVal];
            colorLabel.text(color.currentRank);
            d3.selectAll(".node circle")
                .transition().duration(200)
                .style("fill", (d) => d.customColor ? d.customColor : viewTreeChart.colorNode(d));
        });
    },
    initHierarchicalBarChart: function() {
        // disable all buttons
        d3.selectAll(".toolbar-button, #toolbar-slider")
            .attr("disabled", true);

        // set help button to target correct modal
        d3.select("#chart-help").attr("data-target", "#hierarchical-bars-help-modal");
    },
    initColorPalette: function() {
        d3.select("#color-palette")
            .attr("disabled", null)
            .on("click", () => {
                // Allow only one instance
                const selectionColorPicker = document.getElementById("color-panel");
                if (selectionColorPicker) { selectionColorPicker.remove(); }

                let palettePicker = document.getElementById("color-palette-panel");
                if (! palettePicker) {
                    palettePicker = jsPanel.create({
                        id: "color-palette-panel",
                        theme: "none",
                        headerTitle: 'Customize Color Palette',
                        dragit: { containment: 0 },
                        panelSize: "auto 320",
                        resizeit: false,
                        headerControls: {
                            maximize: "remove",
                            minimize: "remove"
                        },
                        callback: panel => {
                            panel.content.innerHTML = `
                                <div class="pr-2" style="display: flex;">
                                    <div>
                                        <form>
                                            <input type="text" readonly id="organisms-color" class="rank-color" value="#123456" />
                                            <label>Organisms</label> <br>
                                            <input type="text" readonly id="superkingdom-color" class="rank-color" value="#123456" />
                                            <label>Superkingdom</label> <br>
                                            <input type="text" readonly id="kingdom-color" class="rank-color" value="#123456" />
                                            <label>Kingdom</label> <br>
                                            <input type="text" readonly id="phylum-color" class="rank-color" value="#123456" />
                                            <label>Phylum</label> <br>
                                            <input type="text" readonly id="class-color" class="rank-color" value="#123456" />
                                            <label>Class</label> <br>
                                            <input type="text" readonly id="order-color" class="rank-color" value="#123456" />
                                            <label>Order</label> <br>
                                            <input type="text" readonly id="family-color" class="rank-color" value="#123456" />
                                            <label>Family</label> <br>
                                            <input type="text" readonly id="genus-color" class="rank-color" value="#123456" />
                                            <label>Genus</label> <br>
                                        <form>
                                    </div>
                                    <div>
                                        <div id="colorpicker"></div>
                                        <button type="submit" id="submit-rank-color" class="btn btn-outline-success btn-block" onsubmit="return false">Confirm Epic Selection</button>
                                        <button type="submit" id="reset-all-colors" class="btn btn-outline-danger btn-block" onsubmit="return false">Reset Colors</button>
                                    </div>
                                </div>
                            `
                        },
                    });
                    const { color: { taxonLevelColor, branchColor } } = ctrlMain.getHierarchical();
                    const colors = taxonLevelColor.range();
                    document.querySelectorAll('.rank-color').forEach((e,i) => {
                        let currentColor = colors[i];
                        d3.select(e)
                            .style("background-color", currentColor)
                            .attr("value", currentColor)
                            .on("click", () => {
                                $.farbtastic("#colorpicker").linkTo(color => {
                                    d3.select(`#${e.id}`)
                                        .style("background-color", color)
                                        .attr("value", color);
                                }).setColor(currentColor);
                            });
                    });

                    // init color picker at superkingdom level
                    $.farbtastic("#colorpicker").linkTo(color => {
                        d3.select("#organisms-color")
                            .style("background-color", color)
                            .attr("value", color);
                    });

                    // on submission
                    document.getElementById("submit-rank-color").addEventListener("click", () => {
                        let newColors = [];
                        document.querySelectorAll('.rank-color').forEach(e => { newColors.push(e.value) });
                        
                        taxonLevelColor.range(newColors);
                        viewTreeChart.recolorNodes(d3.selectAll(".node"));
                    });

                    // on reset
                    document.getElementById("reset-all-colors").addEventListener("click", () => {
                        const { color: { defaultTaxonColors, defaultBranchColors } } = ctrlMain.getHierarchical();
                        taxonLevelColor.range(defaultTaxonColors);
                        branchColor.range(defaultBranchColors);
                        d3.selectAll(".node").data().forEach(d => d.customColor = null);

                        viewTreeChart.recolorNodes(d3.selectAll(".node"));
                    });
                }
            });
    },
    initExport: function() {
        // Export buttons
        document.getElementById("convert-svg").addEventListener("click", () => {
            (function () {
                var e = document.createElement('script');
                e.setAttribute('src', 'https://nytimes.github.io/svg-crowbar/svg-crowbar.js');
                e.setAttribute('class', 'svg-crowbar'); 
                document.body.appendChild(e);
            })();
            
            // needed to remove all the created elements
            const exitButton = document.createElement("button")
            exitButton.className = "exit-export";
            document.body.prepend(exitButton);
            
            d3.select(".exit-export")
                .style("position", "absolute")
                .style("z-index", 9999)
                .classed("btn btn-md btn-info", true)
                .html("&times;")
                .on("click", function() {
                    const exportElems = document.querySelectorAll('.svg-crowbar');
                    exportElems.forEach(e => e.remove());
                    // finally remove this button
                    this.remove();
                });
        });

        document.getElementById("convert-png").addEventListener("click", () => {
            if (! document.querySelector("#chart-display g")) {
                alert("No chart to export!");
            }
            else {
                saveSvgAsPng(document.getElementById("chart-display"), "visualization.png");
            }
        })
    }
}

let viewSamples = {
    init: function() {
        this.menu = [    
            {
                title: "Remove",
                action: function (ele, d, i) {
                    ele.remove();                    
                }
            }
        ];
    },
    clearPrevious: function() {
        d3.select("#samples").selectAll("*").remove();
    },
    addSample: function(sampleName) {
        // Add to list and attach contextmenu
        let newSampleOption = document.createElement("option"),
            newSampleText = document.createTextNode(sampleName),
            sampleList = document.querySelector("#samples");

        newSampleOption.id = sampleName;
        newSampleOption.classList.add("sample-option");
        newSampleOption.appendChild(newSampleText);
        sampleList.appendChild(newSampleOption);
        d3.select(newSampleOption).on("contextmenu", d3.contextMenu(this.menu));
    },
    drawTable: function (data) {
        d3.select("#csv-display").style("display", "block");
        d3.select("#chart-display").style("display", "none");
        // Reset and generate the top row (col names)
        let cols = data.columns,
            topRow = document.createElement("tr"),
            tableHead = document.querySelector(".csv-data thead");
        while (tableHead.firstChild) {
            tableHead.removeChild(tableHead.firstChild);
        }
        let numCol = document.createElement("th"),
            numColText = document.createTextNode("#");
        numCol.appendChild(numColText);
        topRow.appendChild(numCol);
        cols.forEach((colName) => {
            let newCol = document.createElement("th"),
                newColText = document.createTextNode(colName);
            newCol.appendChild(newColText);
            newCol.scope = "col";
            topRow.appendChild(newCol);
        });
        tableHead.appendChild(topRow);
        
        // Reset and generate remaining rows (actual data)
        let tableBody = document.querySelector(".csv-data tbody");
        while (tableBody.firstChild) {
            tableBody.removeChild(tableBody.firstChild);
        }
        data.forEach((d, i) => {
            let newRow = document.createElement("tr");
            let numRow = document.createElement("th"),
                numRowText = document.createTextNode(i + 1);
            numRow.appendChild(numRowText);
            newRow.appendChild(numRow);
            cols.forEach((col) => {
                let newCell = document.createElement("td"),
                    newCellText = document.createTextNode(d[col]);
                newCell.appendChild(newCellText);
                newRow.appendChild(newCell);
            });
            tableBody.appendChild(newRow);
        });
    }
}

let viewMiniChart = {
    init: function(data) {
        this.svg = d3.select("#mini-chart");
        this.svg.selectAll("*").remove();
        const width = parseFloat(this.svg.style("width")),
            height = parseFloat(this.svg.style("height"));
        this.margin = {
            x: width * 0.15,
            y: height * 0.1
        }
        const { svg, margin } = this;
        this.chart = d3.select("#mini-chart").append("g")
            .style("transform", `translate(${margin.x}px, ${margin.y}px)`);
        
        // Radio buttons:
        this.absoluteOption = document.getElementById("abs-option");
        this.relativeOption = document.getElementById("relative-option");

        // Button to toggle bar/pie chart
        this.toggleChartType = document.querySelector("#toggle-mini-chart-type");
        this.toggleChartType.addEventListener("click", function() {
            let buttonIcon = document.querySelector("#toggle-mini-chart-type i");
            buttonIcon.classList.toggle("fa-chart-pie");
            buttonIcon.classList.toggle("fa-chart-bar");
        });
        
        // Set up scales
        this.xScale = d3.scaleLinear()
            .range([0, width - 2 * margin.x]);
        this.yScale = d3.scaleBand()
            .range([0, height - 2 * margin.y])
            .padding(0.5);

        let rootSampleValues = Object.entries(data[0].samples); // root guaranteed to be at index = 0
        this.scalesToSamples(rootSampleValues);

        // x-axis label
        svg.append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("y", height - 5)
            .attr("x", width / 2)
            .style("font", "sans-serif")
            .style("font-size", "10px")
            .style("fill", "black")
            .text("MS Intensity")

        // Draw axes
        svg.append("g")
            .attr("class", "x-axis")
            .style("transform", `translate(${margin.x}px,${height - margin.y}px)`)
            .call(this.xAxis);
        svg.append("g")
            .attr("class", "y-axis")
            .style("transform", `translate(${margin.x}px, ${margin.y}px)`)
            .call(this.yAxis);

        // initial render with root node (cellular organisms)
        let rootName = data[0].id;
        let rootData = Object.entries(data[0].samples);
        this.lastSample = { rootName, rootData };
        this.renderSamples(rootName, rootData);

        // if user clicks on radio button, render last data
        const renderLastSample = () => {
            let { name, data } = this.lastSample;
            this.renderSamples(name, data);
        }

        this.absoluteOption.addEventListener("change", renderLastSample);
        this.relativeOption.addEventListener("change", renderLastSample);
    },
    scalesToSamples: function(data) {
        // Helper function for this.renderSamples

        // data:
        // d[0] = sample name
        // d[1] = sample intensity (value)

        // find the max value (required for xScale)
        let values = [];
        data.forEach(d => values.push(d[1]));
        const maxVal = d3.max(values);
        
        this.samples = []
        data.forEach(d => this.samples.push(d[0]))

        this.xScale.domain([0, maxVal]);
        this.yScale.domain(this.samples);

        this.xAxis = d3.axisBottom(this.xScale)
            .tickFormat(d3.format(".4g"))
            .ticks(3);
        this.yAxis = d3.axisLeft(this.yScale);
    },
    scalesToSubtaxa: function(sample, data) {
        // Helper function for this.renderSubtaxa

        // rendering this data is always relative
        this.absoluteOption.disabled = true;
        this.relativeOption.disabled = true;
        this.relativeOption.checked = true;

        let values = [];
        if (sample) { data.forEach(d => values.push(d.samples[sample])); }
        else { data.forEach(d => values.push(d.avgIntensity)); }
        const maxVal = d3.max(values);
        const subtaxa = data.map(d => d.taxon);

        this.xScale.domain([0, maxVal]);
        this.yScale.domain(subtaxa);

        this.xAxis = d3.axisBottom(this.xScale)
            .tickFormat(d3.format(".4g"))
            .ticks(3);
        this.yAxis = d3.axisLeft(this.yScale);
    },
    renderSamples: function(name, data) {
        // data:
        // d[0] = sample name
        // d[1] = sample intensity (value)

        this.lastSample = { name, data }    // save this data if user clicks on radio button

        // enable radio buttons
        this.absoluteOption.disabled = false;
        this.relativeOption.disabled = false;

        if (this.absoluteOption.checked){
            // find max value of root
            let globalData = ctrlMain.getCurrentData();
            let rootSampleValues = Object.entries(globalData[0].samples);
            this.scalesToSamples(rootSampleValues);
        }
        else if (this.relativeOption.checked) { // not "else", because might add more options
            // find max value of current taxa
            this.scalesToSamples(data);
        }

        d3.select(".x-axis").call(this.xAxis);
        d3.select(".y-axis").call(this.yAxis);

        const { svg, chart, margin, xScale, yScale } = this,
            format = d3.format(".4g"),
            tooltip = d3.select(".viz-tooltip"),
            duration = 200;
        // Draw title
        svg.select(".mini-chart-title").remove()
        svg.append("text")
            .attr("class", "mini-chart-title")
            .text(name)
            .style("font", "sans-serif")
            .style("font-size", "14px")
            .attr("text-anchor", "middle")
            .attr("x", "50%")
            .attr("y", margin.y - 10);

        // Draw bar chart
        const bar = chart.selectAll(".bar").data(data, d => d[0]);
        const barsEnter = bar.enter().append("rect")
            .attr("class", "bar")
            .on("mouseover", function() {
                d3.select(this).transition()
                    .duration(duration)
                    .style("opacity", 0.5);
                tooltip.transition()
                    .duration(duration)
                    .style("opacity", 0.9);
            })
            .on("mousemove", function(d) {
                let height = tooltip.node().clientHeight;
                tooltip.html(`<strong>Sample</strong>: ${d[0]}<br><strong>MS Intensity</strong>: ${format(d[1])}`)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - height) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).transition()
                    .duration(duration)
                    .style("opacity", 1);
                tooltip.transition()
                    .duration(duration)
                    .style("opacity", 0);
            });
    
        const currentBar = bar.merge(barsEnter)
            .attr("height", yScale.bandwidth())
            .attr("y", (d, i) => yScale(this.samples[i]))
            .attr("fill", "#2a5599");
        
        currentBar.transition().duration(750)
            .attr("width", (d) => xScale(d[1]));

        bar.exit().remove();
    },
    renderSubtaxa: function(sample, parent) {
        // For comparing proportions of subtaxa of parent node
        const data = parent.children.map(d => d.data);

        this.scalesToSubtaxa(sample, data);
        d3.select(".x-axis").call(this.xAxis);
        d3.select(".y-axis").call(this.yAxis);

        const { svg, chart, margin, xScale, yScale } = this,
            format = d3.format(".4g"),
            tooltip = d3.select(".viz-tooltip"),
            duration = 200;

        // Draw title
        svg.select(".mini-chart-title").remove()
        svg.append("text")
            .attr("class", "mini-chart-title")
            .text(sample ? sample : "Average Intensity")
            .style("font", "sans-serif")
            .style("font-size", "14px")
            .attr("text-anchor", "middle")
            .attr("x", "50%")
            .attr("y", margin.y - 10);

        // Draw bar chart
        const bar = chart.selectAll(".bar").data(data, d => d.taxon);
        const barsEnter = bar.enter().append("rect")
            .attr("class", "bar")
            .on("mouseover", function(d) {
                d3.select(this).transition()
                    .duration(duration)
                    .style("opacity", 0.5);
                tooltip.transition()
                    .duration(duration)
                    .style("opacity", 0.9);

                // highlight the actual node on the main visualization
                let a = d3.selectAll(".node")
                    .filter(e => e.id === d.id)
                    .attr("stroke", "black");
            })
            .on("mousemove", function(d) {
                let height = tooltip.node().clientHeight;
                let proportion;
                if (sample) { proportion = d.samples[sample] / parent.data.samples[sample]; }
                else { proportion = d.avgIntensity / parent.data.avgIntensity; }
               
                tooltip.html(`<strong>Taxon</strong>: ${d.taxon} (${d.rank})<br><strong>MS Intensity</strong>: ${format(sample ? d.samples[sample] : d.avgIntensity)}<br><br>
                               <i class="fas fa-chart-pie"></i> \t${d3.format(".1%")(proportion)} of ${parent.data.taxon}`)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - height) + "px");
            })
            .on("mouseout", function(d) {
                d3.select(this).transition()
                    .duration(duration)
                    .style("opacity", 1);
                tooltip.transition()
                    .duration(duration)
                    .style("opacity", 0);

                // stop highlighting the actual node on the main visualization
                d3.selectAll(".node")
                    .filter(e => e.id === d.id)
                    .attr("stroke", "none");
            });

        let currentBar = bar.merge(barsEnter)
            .attr("height", yScale.bandwidth())
            .attr("y", d => yScale(d.taxon))
            .attr("fill", "#2a5599");
        
        currentBar.transition().duration(750)
            .attr("width", d => xScale(sample ? d.samples[sample] : d.avgIntensity))

        bar.exit().remove();
    }
}
