// problem 2 on HW

// load data then boxplot
d3.csv("socialMedia.csv").then(function(data) {
    data.forEach(d => d.Likes = +d.Likes);

    const width = 600, height = 400;
    const margin = {top: 50, bottom: 50, left: 50, right: 50};

    const svgBox = d3.select("#boxplot")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("background", "lightyellow");
    
  // y scale for boxplot 
    const yScaleBox = d3.scaleLinear()
        .domain([0, 1000])
        .range([height - margin.bottom, margin.top]);
  
  // x scale for boxplot
    const xScaleBox = d3.scaleBand()
        .domain(Array.from(new Set(data.map(d => d.AgeGroup))))
        .range([margin.left, width - margin.right])
        .padding(0.3);
  
  // append x and y axis
    svgBox.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScaleBox));
    svgBox.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScaleBox));

    const groups = d3.groups(data, d => d.AgeGroup)
        .map(([AgeGroup, items]) => {
            const likes = items.map(d => d.Likes).sort(d3.ascending);
            return {
                AgeGroup,
                min: likes[0],
                q1: d3.quantile(likes, 0.25),
                median: d3.quantile(likes, 0.5),
                q3: d3.quantile(likes, 0.75),
                max: likes[likes.length - 1]
            };
        });
    // group by age group
    groups.forEach(g => {
        const x = xScaleBox(g.AgeGroup);
        const w = xScaleBox.bandwidth();

        svgBox.append("line")
            .attr("x1", x + w/2)
            .attr("x2", x + w/2)
            .attr("y1", yScaleBox(g.min))
            .attr("y2", yScaleBox(g.max))
            .attr("stroke", "black");

        svgBox.append("rect")
            .attr("x", x)
            .attr("y", yScaleBox(g.q3))
            .attr("width", w)
            .attr("height", yScaleBox(g.q1) - yScaleBox(g.q3))
            .attr("fill", "#0177b7")
            .attr("stroke", "black");

        svgBox.append("line")
            .attr("x1", x)
            .attr("x2", x + w)
            .attr("y1", yScaleBox(g.median))
            .attr("y2", yScaleBox(g.median))
            .attr("stroke", "white")
            .attr("stroke-width", 2);
    });
});

// grouped bar chart data and visualization
d3.csv("datacopy1.csv").then(function(data) {
    data.forEach(d => d.Likes = +d.Likes);

    const width = 600, height = 400;
    const margin = {top: 50, bottom: 50, left: 50, right: 50};

    const svgBar = d3.select('#barplot')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background', 'lightyellow');

    const groups = d3.flatGroup(data, d => d.Platform, d => d.PostType);

    const plotData = groups.map(([Platform, PostType, items]) => ({
        Platform,
        PostType,
        avgLikes: d3.mean(items, d => d.Likes)
    }));

    const platforms = Array.from(new Set(plotData.map(d => d.Platform)));
    const types = Array.from(new Set(plotData.map(d => d.PostType)));

    const x0 = d3.scaleBand()
        .domain(platforms)
        .range([margin.left, width - margin.right])
        .padding(0.2);
    const x1 = d3.scaleBand()
        .domain(types)
        .range([0, x0.bandwidth()])
        .padding(0.1);
    const yBar = d3.scaleLinear()
        .domain([0, d3.max(plotData, d => d.avgLikes)])
        .nice()
        .range([height - margin.bottom, margin.top + 50]);
    const color = d3.scaleOrdinal()
        .domain(types)
        .range(d3.schemeCategory10);

    svgBar.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x0));
    svgBar.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yBar));

    svgBar.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .text("Platform");
    svgBar.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .text("Average Likes");

    const barGroups = svgBar.selectAll('.barGroup')
        .data(platforms)
        .enter()
        .append('g')
        .attr("transform", d => `translate(${x0(d)},0)`);

    types.forEach(type => {
        barGroups.append("rect")
            .filter(d => plotData.find(pd => pd.Platform === d && pd.PostType === type))
            .attr("x", d => x1(type))
            .attr("y", d => {
                const found = plotData.find(pd => pd.Platform === d && pd.PostType === type);
                return found ? yBar(found.avgLikes) : yBar(0);
            })
            .attr("width", x1.bandwidth())
            .attr("height", d => {
                const found = plotData.find(pd => pd.Platform === d && pd.PostType === type);
                return found ? yBar(0) - yBar(found.avgLikes) : 0;
            })
            .attr("fill", color(type));
    });

    const legend = svgBar.append("g")
        .attr("transform", `translate(${width - 100},${margin.top})`);
    types.forEach((type, i) => {
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 20)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", color(type));
        legend.append("text")
            .attr("x", 20)
            .attr("y", i * 20 + 12)
            .text(type);
    });
});

// line plot data and visualization
d3.csv("datacopy2.csv").then(function(data) {
    const parseDate = d3.timeParse("%m/%d/%Y");
    data.forEach(d => {
        d.Likes = +d.Likes;
        d.Date = parseDate(d.Date.split(" ")[0]);
    });

    const width = 600, height = 400;
    const margin = {top: 50, bottom: 50, left: 50, right: 50};

    const svgLine = d3.select('#lineplot')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background', 'lightyellow');

    const grouped = d3.group(data, d => d.Date.getTime());

    const plotData = Array.from(grouped, ([date, vals]) => ({
        Date: new Date(+date),
        avgLikes: d3.mean(vals, d => d.Likes),
    })).sort((a, b) => a.Date - b.Date);

    const xLine = d3.scaleTime()
        .domain(d3.extent(plotData, d => d.Date))
        .range([margin.left, width - margin.right]);

    const yLine = d3.scaleLinear()
        .domain([0, d3.max(plotData, d => d.avgLikes)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    svgLine.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xLine))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svgLine.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(yLine));

    svgLine.append('text')
        .attr('x', width / 2)
        .attr('y', height - 5)
        .attr('text-anchor', 'middle')
        .text('Date');

    svgLine.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .text('Average Likes');

    const line = d3.line()
        .x(d => xLine(d.Date))
        .y(d => yLine(d.avgLikes))
        .curve(d3.curveNatural);

    svgLine.append('path')
        .datum(plotData)
        .attr('fill', 'none')
        .attr('stroke', '#0177b7')
        .attr('stroke-width', 2)
        .attr('d', line);
});
