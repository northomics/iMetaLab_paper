let viewZoom = {
    render: function(type) {
        this.svg = d3.select("#chart-display");
        this.zoom = d3.zoom()
                .scaleExtent([0.4, 10])
                .on("zoom", zoomed);
        const chart = d3.select("#chart");
    
        function zoomed() {
            const transform = d3.event.transform;

            // scale nodes
            chart.selectAll(".node").filter(d => !d.collapsedChild)
                .attr("transform", d => {
                    if (type === "radial-tree") {
                        return "translate(" + transform.apply(viewTreeChart.project(d.x, d.y)) + ")";
                    }
                    return "translate(" + transform.applyX(d.y) + "," + transform.applyY(d.x) + ")";
                });
            // scale links
            chart.selectAll(".link").filter(d => !d.collapsedChild)
                .attr("d", d => {
                    if (type === "radial-tree") {
                        return "M" + transform.apply(viewTreeChart.project(d.x, d.y))
                        + "C" + transform.apply(viewTreeChart.project(d.x, (d.y + d.parent.y) / 2))
                        + " " + transform.apply(viewTreeChart.project(d.parent.x, (d.y + d.parent.y) / 2))
                        + " " + transform.apply(viewTreeChart.project(d.parent.x, d.parent.y));
                    }
                    return "M" + transform.applyX(d.y) + "," + transform.applyY(d.x)
                        + "C" + (transform.applyX(d.y) + transform.applyX(d.parent.y)) / 2 + "," + transform.applyY(d.x)
                        + " " + (transform.applyX(d.y) + transform.applyX(d.parent.y)) / 2 + "," + transform.applyY(d.parent.x)
                        + " " + transform.applyX(d.parent.y) + "," + transform.applyY(d.parent.x);
                });
        }
        this.svg
            .call(this.zoom)
            .on("dblclick.zoom", null);
    }
}
