// Configuration
const config = {
    width: 1100,
    height: 800,
    topicRadius: 20,
    documentRadius: 5,
    linkStrengthScale: d3.scaleLinear().range([0, 1])
};

// Create SVG
const svg = d3.select('#visualization')
    .append('svg')
    .attr('width', config.width)
    .attr('height', config.height);

// Create tooltip
const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

// Load and process data
async function loadData() {
    const data = await d3.json('./topic_modeling_results.json');
    return processData(data);
}

function processData(data) {
    const nodes = [
        ...data.topics.map(t => ({...t, type: 'topic'})),
        ...data.documents.map(d => ({...d, type: 'document'}))
    ];
    
    const links = [];
    data.documents.forEach(doc => {
        doc.topic_weights.forEach((weight, topicIdx) => {
            if (weight > 0.2) { // Initial threshold
                links.push({
                    source: topicIdx,
                    target: data.topics.length + doc.id,
                    weight: weight
                });
            }
        });
    });
    
    return { nodes, links };
}

function updateVisualization(data, threshold = 0.2) {
    // Filter links based on threshold
    const filteredLinks = data.links.filter(l => l.weight > threshold);
    
    // Create force simulation
    const simulation = d3.forceSimulation(data.nodes)
        .force('link', d3.forceLink(filteredLinks)
            .id(d => d.id)
            .strength(d => d.weight))
        .force('charge', d3.forceManyBody().strength(-100))
        .force('center', d3.forceCenter(config.width / 2, config.height / 2))
        .force('collision', d3.forceCollide().radius(d => 
            d.type === 'topic' ? config.topicRadius : config.documentRadius));

    // Draw links
    const link = svg.selectAll('.link')
        .data(filteredLinks)
        .join('line')
        .attr('class', 'link')
        .attr('stroke-width', d => d.weight * 2);

    // Draw nodes
    const node = svg.selectAll('.node')
        .data(data.nodes)
        .join('circle')
        .attr('class', d => `node node-${d.type}`)
        .attr('r', d => d.type === 'topic' ? config.topicRadius : config.documentRadius)
        .call(drag(simulation));

    // Add tooltips
    node.on('mouseover', (event, d) => {
        let content = d.type === 'topic' 
            ? `Thématique ${d.id + 1}<br>Mots clés: ${d.words.join(', ')}`
            : `Document: ${d.title}<br>Date: ${d.date}`;
            
        tooltip.transition()
            .duration(200)
            .style('opacity', .9);
        tooltip.html(content)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', () => {
        tooltip.transition()
            .duration(500)
            .style('opacity', 0);
    });

    // Update positions
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
    });
}

// Drag behavior
function drag(simulation) {
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }
    
    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }
    
    return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
}

// Initialize visualization
loadData().then(data => {
    updateVisualization(data);
    
    // Add threshold control
    d3.select('#threshold').on('input', function() {
        const value = this.value / 100;
        d3.select('#threshold-value').text(value.toFixed(2));
        updateVisualization(data, value);
    });
}); 