
/** Markov Node class
  * contains details about a markov model node
  */
function MarkovNode(id) {
	this.id = id
	this.emission_probabilities = {}
	this.transitions = []
}

MarkovNode.prototype.add_emission = function(emit_value, probability) {
	this.emission_probabilities[emit_value] = probability
}

MarkovNode.prototype.add_transition = function(transition) {
	this.transitions.push(transition)
}

//Verify Probabilities sum to one
MarkovNode.prototype.verify = function() {
	//emission probabilities
	var prob = 0.0
	for(var key in this.emission_probabilities) {
		prob += this.emission_probabilities[key]
	}
	if(prob != 1.0) {
		return false
	}
	//transition probabilities
	prob = 0.0
	for(var i = 0; i < this.transitions.length; i++) {
		var transition = this.transitions[i]
		prob += transition.probability
	}
	if(prob != 1.0) {
		return false
	}
	return true
}

//A Markov Transition from one node to another
function MarkovTransition(source_node, destination_node, probability) {
	this.source = source_node
	this.dest = destination_node
	this.probability = probability
}

