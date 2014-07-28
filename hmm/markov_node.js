
/** Markov Node class
  * contains details about a markov model node
  */
function MarkovNode(id) {
	//model attributes
	this.id = id
	this.emission_probabilities = {}
	this.transitions = {}
	this.type = '' //set this to start or end for special nodes

	//gui attributes
	this.x = id/2 * 200 + 50
	this.x += id%2 * 100
	this.y = id%2 * 250 + 50
	this.w = 150
	this.h = 200
}

//Add (or change) an emission probability to this node
MarkovNode.prototype.add_emission = function(emit_value, probability) {
	this.emission_probabilities[emit_value] = probability
}

//Add (or change) a transition probability to this node
MarkovNode.prototype.add_transition = function(to_id, probability) {
	this.transitions[to_id] = probability
}

//Draw this Node to a Canvas
MarkovNode.prototype.draw = function(canvas, context, hmm_states) {
	var x = this.x
	var y = this.y

	//Setup Text properties
	context.font = '16px monospace'
	context.fillStyle = 'rgb(0,0,0)'

	//Draw Node
		//Draw Box
		context.strokeRect(x, y, this.w, this.h)
		//Draw State ID
		x += 65; y+= 30;

		context.fillText(this.id.toString(), x, y)
		//Draw Emission Probabilities
		x -= 45; y+= 30;
		for(var emit_value in this.emission_probabilities) {
			var p = this.emission_probabilities[emit_value]
			var value = emit_value + '  ' + p
			context.fillText(value, x, y)
			y += 30
		}

	//Draw Transitions
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
			var ty = to_state.y //+ to_state.h / 2
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


