// Global object that holds data/state relevant to all charts/visualizations:
let model = {
    dim: {
        width: parseInt(d3.select("#chart-display").style("width")),
        height: parseInt(d3.select("#chart-display").style("height"))
    },
    chartType: document.getElementById("chart-selection").value,
    currentData: null,  // Array of objects, loaded from csv
    currentSample: null,  // String, determined from user selection
    currentSelection: new Set(),  // Set of DOM elems corresponding to nodes, selected for further analysis (used by tree chart)
    identifiedTaxa: {
        "Cellular organisms": new Set(),
        "Superkingdom": new Set(),
        "Kingdom": new Set(),
        "Phylum": new Set(),
        "Class": new Set(),
        "Order": new Set(),
        "Family": new Set(),
        "Genus": new Set(),
        "Species": new Set()
    },
    hierarchical: {
        // d3 hierarchy layours:
        root: null,
        tree: null,
        treemap: null,
        pack: null,
        // Rank keys based on the number of "@" in the id of each data point
        taxonRanks: {
            0: "Cellular organisms",
            1: "Superkingdom",
            2: "Kingdom",   // bacteria and archaea skip kingdom
            3: "Phylum",
            4: "Class",
            5: "Order",
            6: "Family",
            7: "Genus",
            8: "Species"
        },
        color: {
            currentRank: "Kingdom",
            // Default colors (array):
            defaultTaxonColors: d3.schemePastel1,
            defaultBranchColors: d3.schemeSet3,
            // Color schemes for nodes:
            taxonLevelColor: d3.scaleOrdinal()
                .range(d3.schemePastel1),
            branchColor: d3.scaleOrdinal()
                .range(d3.schemeSet3)
        }
    },
}

let ctrlMain = {
    // ctrlMain: Responsible for file handling, building charts, and getting/setting data from model

    init: function() {
        viewSamples.init();

        this.onFileChange();
        this.onChartTypeChange();
        // Load data from global variable and sort by "@" count (so root node always at index = 0)
        let loadedData = JSON.parse(data);
        loadedData.sort((a,b) => {
            let aVal = a.id.split('@').length;
            let bVal = b.id.split('@').length;
            if (aVal < bVal) { return -1; }
            if (aVal > bVal) { return 1; }
            return 0;
        })
        console.log(loadedData)
        
        this.parseTaxonRank(loadedData);
        const areSamples = this.parseSamples(loadedData);
        if (areSamples) { this.callSamples(loadedData) };
        this.setCurrentData(loadedData);
        this.buildChart(this.getCurrentData());     // load the data immediately
    },

    // MAIN EVENT LISTENERS

    onFileChange: function() {
        const upload = document.querySelector("#file-upload");

        upload.addEventListener("change", (e) => {
            const file = e.target.files[0],
                fileTypeCSV = /csv.*/;

            if (file.name.match(fileTypeCSV)) {
                // parse the csv and set as current data
                const reader = new FileReader();
                reader.onload = () => {
                    const data = d3.csvParse(reader.result);    // array of objects
                    this.parseTaxonRank(data);
                    const areSamples = this.parseSamples(data);
                    if (areSamples) { this.callSamples(data); }
                    this.setCurrentData(data);
                    this.buildChart(this.getCurrentData());
                }
                reader.readAsText(file);
            }
            else {
                $("#warning-modal").modal()
            }
        });
    },
    onChartTypeChange: function() {
        const chartSelection = document.getElementById("chart-selection");
        chartSelection.addEventListener("change", () => {
            const type = chartSelection.value,
                data = this.getCurrentData();
            this.setChartType(type);
            if (data) {
                this.buildChart(data);
            }
        });
    },

    // METHODS FOR PARSING INPUT DATA && DATA FLOW

    parseTaxonRank: function(data) {
        // Accepts array of objects as data, parses for each individual taxon classification and its rank
        data = data.map(e => {
            let taxa = e.id.split("@"),
                taxon = taxa[taxa.length - 1];
            e.taxon = taxon;
            
            const { taxonRanks } = ctrlMain.getHierarchical();
            let countTaxa = taxa.length;
            let countSymbol = countTaxa - 1;  // count "@" symbol
            if (countTaxa > 2 && (taxa.indexOf("Bacteria") !== -1 || taxa.indexOf("Archaea") !== -1)) { // skip the kingdom rank
                e.rank = taxonRanks[ countSymbol + 1 ];
            }
            else {
                e.rank = taxonRanks[ countSymbol ];
            }
            // Add taxon to identified taxa (object of sets)
            model.identifiedTaxa[e.rank].add(e.taxon);
        });
    },
    parseSamples: function(data) {
        // Returns true if there is a sample column in the given csv
        // Accepts array of objects as data, parses for the individual samples and saves as a sub-object
        // In the csv, the column is usually formatted as such: "Intensity s1; Intensity s2; Intensity s3; ..."
        const col = Object.keys(data[0]).find(ele => ele.match(/;/));
        if(! col) { return false; }

        data = data.map(e => {
            e.value = +e.value;
            e.avgIntensity = e.value;   // the "value" column in the originial csv is the average MS intensity
            e.avgNormalizedIntensity = e.value > 0 ? Math.log10(e.value) * 10 : 0;    // log transform
            
            const sampleNames = col.split(";"),
                sampleIntensies = e[col].split(";").map(val => +val);
            delete e[col];
            e.samples = new Object();
            sampleNames.forEach((sample, i) => {
                sample = sample.replace(/intensity./ig, "").trim();
                e.samples[sample] = sampleIntensies[i];
            });
        });
        return true;
    },
    callSamples: function(data) {
        // Accepts array of objects as data, gets samples if they exist and calls the view to render them.
        if (! data[0].samples) { return; }
        const sampleNames = Object.keys(data[0].samples);
        viewSamples.clearPrevious();
        sampleNames.forEach((sample) => {
            viewSamples.addSample(sample);
        });
        // On sample selection, display the correct information in chart
        d3.select("#samples")
            .on("change", function() {     
                let sample = this.value;
                ctrlMain.setCurrentSample(sample);
                data.map((e) => {
                    e.value = e.samples[sample];
                    return e;
                });
                ctrlMain.buildChart(data);
            });
    },
    buildChart: function(data) {
        // Accepts array of objects (csv) as data
        // document.querySelector("#chart-display").style.display = "block";    // for removing tabular csv view
        // document.querySelector("#csv-display").style.display = "none";
        
        const type = this.getChartType();
        switch (type) {
            case "horizontal-tree":
            case "radial-tree":
                this.buildRoot(data);
                this.buildTree();

                const { root } = ctrlMain.getHierarchical();
                viewTreeChart.init(type);
                viewTreeChart.render(root);   // initial render with root as source
                ctrlToolbar.initTreeChart();
                viewMiniChart.init(data);
                break;
            case "hierarchical-bars":
                this.buildRoot(data);

                viewHierarchicalBarChart.init();
                viewHierarchicalBarChart.render();
                ctrlToolbar.initHierarchicalBarChart();
                viewMiniChart.init(data);
                break;
            case "static-treemap":
                this.buildRoot(data);
                this.buildTreemap();

                viewStaticTreemapChart.init();
                viewStaticTreemapChart.render();
                ctrlToolbar.initTreemapChart();
                viewMiniChart.init(data);
                break;
            case "circle-packing":
                this.buildRoot(data);
                this.buildPack();

                viewCirclePackingChart.init();
                viewCirclePackingChart.render();
                ctrlToolbar.initCirclePackingChart();
                viewMiniChart.init(data);
                break;
            case "sunburst":
                this.buildRoot(data);

                viewSunburstChart.init();
                viewSunburstChart.render();
                ctrlToolbar.initSunburstChart();
                viewMiniChart.init(data);
                break;
        }
        ctrlToolbar.initExport();   // export buttons
    },

    // D3 HIERARCHY AND LAYOUT GENERATORS

    buildRoot: function(data) {
        // Generate the root data structure
        let stratify = d3.stratify()
            .parentId(d => d.id.substring(0, d.id.lastIndexOf("@")));
        let root = stratify(data);

        // calculate proportion to parent node
        root.each(node => {
            if (node.parent) {
                const currentValue = node.data.avgIntensity;
                const parentValue = node.parent.data.avgIntensity;
                node.data.avgProportion = (parentValue === 0 ? 0 : currentValue / parentValue);
            }
        })

        model.hierarchical.root = root;
    },
    buildTree: function() {
        const tree = d3.tree()
            .size([360, 500])
            .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

        model.hierarchical.tree = tree;
    },
    buildTreemap: function() {
        const { width, height } = this.getDim();
        const treemap = d3.treemap()
            .size([width*0.99, height*0.9]);
        
        model.hierarchical.treemap = treemap;
    },
    buildPack: function() {
        const { width, height } = this.getDim();
        const pack = d3.pack()
            .size([width, height]);
        
        model.hierarchical.pack = pack;
    },

    // GETTERS AND SETTERS

    getDim: () => model.dim,
    getHierarchical: () => model.hierarchical,
    // methods for currentData:
    setCurrentData: (data) => model.currentData = data,
    getCurrentData: () => model.currentData,
    // methods for currentSample:
    setCurrentSample: (sample) => model.currentSample = sample,
    getCurrentSample: () => model.currentSample,
    // methods for chartType:
    setChartType: (type) => model.chartType = type,
    getChartType: () => model.chartType,
    // methods for currentSelection (e = DOM element):
    getCurrentSelection: () => model.currentSelection,
    addToCurrentSelection: (e) => {
        model.currentSelection.add(e);
        e.classList.add("node-selected");
    },
    removeFromCurrentSelection: (e) => {
        model.currentSelection.delete(e);
        e.classList.remove("node-selected");
    },
    clearCurrentSelection: () => {
        model.currentSelection.forEach(e => { ctrlMain.removeFromCurrentSelection(e); })
    },
    toggleCurrentSelection: (e) => {
        if (model.currentSelection.has(e)) { ctrlMain.removeFromCurrentSelection(e); }    // remove element if it exists
        else { ctrlMain.addToCurrentSelection(e); }                // or else add it
    },

    // feedback form

    submitFeedback: () => {
        let messageToUser = document.querySelector("#feedback-result"),
            name = document.querySelector("#feedback-name").value,
            organization = document.querySelector("#feedback-organization").value,
            comments = document.querySelector("#feedback-comments").value;

        if (comments === "") {
            messageToUser.textContent = "Form cannot be blank.";
        }
        else {
            let http = new XMLHttpRequest();
            http.open("POST", "/feedback", true);
            http.setRequestHeader("Content-type","application/x-www-form-urlencoded");
            let params = `name=${name}&` +
            `organization=${organization}&` + 
            `comments=${comments}`;
            http.send(params);
            messageToUser.textContent = "Submitted, thanks!";
        }
    }
}

ctrlMain.init();
