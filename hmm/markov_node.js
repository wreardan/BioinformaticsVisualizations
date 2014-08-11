var markov_node_delimiter = ' '
/** Markov Node class
  * contains details about a markov model node
  */
function MarkovNode(id) {
	//model attributes
	this.id = id
	this.emission_probabilities = {}
	this.transitions = {}
	this.type = '' //set this to start or end for special nodes

	//gui attributes - x,y,w,h
	this.default_position()

	//highlight status for node and emission
	this.highlight = false //includes highlighting of transitions
	this.highlight_emission = '' 
}

//Set default x,y coordinates for an id
MarkovNode.prototype.default_position = function() {
	//gui attributes
	this.x = this.id/2 * 200 + 50
	this.x += this.id%2 * 100
	this.y = this.id%2 * 250 + 50
	this.w = 150
	this.h = 200
}

//Return the emission probabilities string form seperated by newlines
MarkovNode.prototype.emission_strings = function() {
	var result = []
	for(var letter in this.emission_probabilities) {
		var prob = this.emission_probabilities[letter]
		var line = [letter, prob].join(markov_node_delimiter)
		result.push(line)
	}
	return result.join('\n')
}
//Parse emissions from a string seperated by newlines and commas
MarkovNode.prototype.parse_emissions = function(value) {
	var lines = value.split('\n')
	for(var i = 0; i < lines.length; i++) {
		var line = lines[i]
		var tokens = line.split(markov_node_delimiter)
		var letter = tokens[0]
		var prob = parseFloat(tokens[1])
		//(re)set emission probability
		if(prob > 0.0) {
			this.emission_probabilities[letter] = prob
		}
		//prob <= 0.0, delete
		else {
			delete this.emission_probabilities[letter]
		}
	}
}

//Return stringified transitions
MarkovNode.prototype.transition_strings = function() {
	var result = []
	for(var id in this.transitions) {
		var prob = this.transitions[id]
		var line = [id, prob].join(markov_node_delimiter)
		result.push(line)
	}
	return result.join('\n')
}
MarkovNode.prototype.parse_transitions = function(value) {
	var lines = value.split('\n')
	for(var i = 0; i < lines.length; i++) {
		var line = lines[i]
		var tokens = line.split(markov_node_delimiter)
		var to_state_id = parseInt(tokens[0])
		var prob = parseFloat(tokens[1])
		if(prob > 0.0) {
			this.transitions[to_state_id] = prob
		}
		else {
			delete this.transitions[to_state_id]
		}
	}
}

//http://stackoverflow.com/questions/306316/determine-if-two-rectangles-overlap-each-other
//Return true if two nodes overlap each other
MarkovNode.prototype.overlaps = function(other) {
	var x2 = this.x + this.w
	var y2 = this.y + this.h
	var ox2 = other.x + other.w
	var oy2 = other.y + other.h
	if(this.x <= ox2 && x2 >= other.x) {
		if(this.y <= oy2 && y2 >= other.y) {
			return true
		}
	}
	return false
}

//Return true if point is inside our rectangle
MarkovNode.prototype.collision = function(x, y) {
	if(x >= this.x && x <= this.x + this.w) {
		if(y >= this.y && y <= this.y + this.h) {
			return true
		}
	}
	return false
}

//Add (or change) an emission probability to this node
MarkovNode.prototype.add_emission = function(emit_value, probability) {
	this.emission_probabilities[emit_value] = probability
}

//Add (or change) a transition probability to this node
MarkovNode.prototype.add_transition = function(to_id, probability) {
	this.transitions[to_id] = probability
}

//Drag Node by deltax, deltay, but not less than zero x,y coordinates
MarkovNode.prototype.drag = function(dx, dy) {
	this.x += dx
	if(this.x < 0) {
		this.x = 0
	}

	this.y += dy
	if(this.y < 0) {
		this.y = 0
	}
}

//Draw this Node to a Canvas
MarkovNode.prototype.draw = function(canvas, context, hmm_states) {
	var x = this.x
	var y = this.y

	//Setup Text properties
	context.font = '32px monospace'
	context.fillStyle = 'rgb(200,0,0)'

	//Draw Node
		//Draw Box
		if(this.gui_selected) {
			context.strokeStyle = 'red'
		}
		else {
			context.strokeStyle = 'black'
		}
		context.strokeRect(x, y, this.w, this.h)
		//Draw State ID
		x += 65; y+= 40;

		context.fillText(this.id.toString(), x, y)

		//Draw start and end state Text instead of Emissions
		x -= 45; y+= 50;
		if(this.type) {
			context.font = '32px monospace'
			context.fillStyle = 'rgb(0,0,0)'
			context.fillText(this.type, x, y)
		}
		else {
			//Draw Emission Probabilities
			context.font = '16px monospace'
			context.fillStyle = 'rgb(0,0,0)'
	
			for(var emit_value in this.emission_probabilities) {
				var p = this.emission_probabilities[emit_value]
				var value = emit_value + '  ' + p
				context.fillText(value, x, y)
				y += 30
			}
		}

	//Draw Transitions
	context.font = '16px monospace'
	context.fillStyle = 'rgb(0,0,0)'
	for(var to_id in this.transitions) {
		var p = this.transitions[to_id]
		//Self transition
		if(this.id == to_id) {
			x = this.x + this.w / 2
			y = this.y
			drawArrow(context, x, y - 20, x, y)
			context.fillText(p.toString(), x - 20, y - 20)
		}
		else{
			//Non-self transition
			var to_state = hmm_states[to_id]
			console.assert(to_state)
			//Draw Line and Arrow: this -> to_state
			x = this.x + this.w
			y = this.y + this.h / 2
			var tx = to_state.x
			var ty = to_state.y + to_state.h / 2
			drawArrow(context, x, y, tx, ty)
	
			//Draw Probabilty
				//Find Mid-point
				var mx = (x + tx) / 2
				var my = (y + ty) / 2
				//Draw text
				context.fillText(p.toString(), mx - 20, my)
		}
	}
}

//Verify Probabilities sum to one
MarkovNode.prototype.verify = function() {
	if(!this.type) { //start/end states do not have emission probabilities
		//sum emission probabilities
		var prob = 0.0
		for(var emit_value in this.emission_probabilities) {
			prob += this.emission_probabilities[emit_value]
		}
		if(prob != 1.0) {
			console.log('MarkovNode.verify(%d): Emission probabilities do not sum to 1.0 (%f)', this.id, prob)
			return false
		}
	}
	//sum transition probabilities
	if(this.type != 'end'){ //end state does not have transitions
		prob = 0.0
		for(var to_id in this.transitions) {
			prob += this.transitions[to_id]
		}
		if(prob != 1.0) {
			console.log('MarkovNode.verify(%d): Transition probabilities do not sum to 1.0 (%f)', this.id, prob)
			return false
		}
	}
	return true
}


