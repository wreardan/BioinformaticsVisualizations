//Markov Model class
function HiddenMarkovModel() {
	this.states = []
}

//Add a node to the HMM
HiddenMarkovModel.prototype.add_emissions = function(filename) {
	//Read in File Data
		//Parse line by line: state_id emission_value probability
		//Add into model
}

//Add a node->node transition to the HMM
HiddenMarkovModel.prototype.add_transitions = function(filename) {
	//Read in File Data
		//Parse line by line: start_state transition_state probability
		//Add into model
}

//Run the forward algorithm against the dataset
HiddenMarkovModel.prototype.forward = function() {

}

//Run the backward algorithm
HiddenMarkovModel.prototype.backward = function() {

}

//Run Expectation Maximization algorithm
HiddenMarkovModel.prototype.forward_backward = function() {

}

//Run the viterbi algorithm to find the most likely Path
HiddenMarkovModel.prototype.viterbi = function() {

}