//Markov Node Custom Element
var MarkovNode = joint.dia.Element.extend({

    markup: '<g class="rotatable"><g class="scalable"><rect class="card"/><image/></g><text class="name"/><text class="emission_values"/><text class="emission_probabilities"/></g>',

    defaults: joint.util.deepSupplement({

        type: 'hmm.MarkovNode',
        size: { width: 180, height: 70 },
        attrs: {

            rect: { width: 170, height: 60 },

            '.card': {
                fill: '#FFFFFF', stroke: '#000000', 'stroke-width': 2,
                'pointer-events': 'visiblePainted', rx: 10, ry: 10
            },

            '.name': {
                'font-weight': 'bold',
                ref: '.card',
                'ref-x': 0.1, 'ref-y': 0.1,
                'font-family': 'Courier New', 'font-size': 14,
                'text-anchor': 'begin'
            },

            '.emission_values': {
                //'text-decoration': 'underline',
                ref: '.card',
                'ref-x': 0.1, 'ref-y': 0.3,
                'font-family': 'Courier New', 'font-size': 14,
                'text-anchor': 'begin'
            },

            '.emission_probabilities': {
                //'text-decoration': 'underline',
                ref: '.card',
                'ref-x': 0.6, 'ref-y': 0.3,
                'font-family': 'Courier New', 'font-size': 14,
                'text-anchor': 'begin'
            },
        }
    }, joint.dia.Element.prototype.defaults)
});

//Hello World
var graph = new joint.dia.Graph;

//Main View
var paper = new joint.dia.Paper({
    el: $('#myholder'),
    width: 1000,
    height: 800,
    model: graph,
    gridSize: 1
});

var current_state_num = 0
var current_x = 100, current_y = 100

//Add a node to the scene
function add_markov_node() {
    var state_name = 'State ' + current_state_num
    current_state_num += 1

    //Create Node
    var node = new MarkovNode({
        position: {x: current_x, y: current_y},
        size: {width: 100, height: 200},
        attrs: {
            '.card': { fill: '#F1C40F', stroke: 'gray' },
            '.name': { text: state_name },
            '.emission_values': { text: 'A\nC\nG\nT' },
            '.emission_probabilities': { text: '0.4\n0.1\n0.4\n0.1'},
        }
    })

    //Create Self transition
    var link = new joint.dia.Link({
        source: { id: node.id },
        target: { id: node.id }
    })
    link.set('vertices', [
        { x: current_x + 50, y: current_y },
        { x: current_x + 50, y: current_y - 50 },
        { x: current_x + 50, y: current_y - 50 },
    ])
    node.self_transition_link = link

    //Add Node and Link to Graph
    graph.addCells([node, link])

    //spawn next node a little down and right
    current_x += 10
    current_y += 10

    return node
}

//Behaviour for drop-linking
paper.on('cell:pointerup', function(cellView, evt, x, y) {

    // Find the first element below that is not a link nor the dragged element itself.
    var elementBelow = graph.get('cells').find(function(cell) {
        if (cell instanceof joint.dia.Link) return false; // Not interested in links.
        if (cell.id === cellView.model.id) return false; // The same element as the dropped one.
        if (cell.getBBox().containsPoint(g.point(x, y))) {
            return true;
        }
        return false;
    });
    
    // If the two elements are connected already, don't
    // connect them again (this is application specific though).
    if (elementBelow && !_.contains(graph.getNeighbors(elementBelow), cellView.model)) {
        
        graph.addCell(new joint.dia.Link({
            source: { id: cellView.model.id }, target: { id: elementBelow.id },
            attrs: { '.marker-source': { d: 'M 10 0 L 0 5 L 10 10 z' } }
        }));
        // Move the element a bit to the RIGHT side.
        cellView.model.translate(200, 0);
    }
});    