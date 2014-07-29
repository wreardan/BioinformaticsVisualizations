//Hidden Markov Model class
function HiddenMarkovModel() {
	//Model Information
	this.states = {}
	this.num_states = 0

	this.matrix = null
	this.sequence = ''

	//Info for stepping through the algorithm graphically
	this.algorithm = 'forward'
	this.step_num = 0
}

/** Builds a model from emission and transition strings
  * Emissions Format:
  *   state_id emission_value emission_probability
  * Transitions Format:
  *   from_state_id to_state_id probability
  */
HiddenMarkovModel.prototype.build_model = function(emission_string, transition_string) {
	var num_states = 1
	//TODO: Create Start State
	var start_state = new MarkovNode(0)
	this.states[0] = start_state
	start_state.type = 'start'
	//Split emissions into lines
	var emission_lines = emission_string.split('\n')
	//Parse emissions
	for(var i = 0; i < emission_lines.length; i++) {
		//Split line into tokens on space
		var line = emission_lines[i]
		var tokens = line.split(' ')
		if(tokens.length < 3) {
			console.log('skipping bad line: "%s"', line)
			continue
		}

		//Parse
		var id = parseInt(tokens[0])
		var value = tokens[1]
		var p = parseFloat(tokens[2])

		var state
		state = this.states[id]
		//Create State if it does not exist
		if(!state) {
			state = new MarkovNode(id)
			this.states[id] = state
			num_states += 1
		}

		//Finally, add the emission
		state.add_emission(value, p)
	}
	//Split Transitions into lines
	var transition_lines = transition_string.split('\n')
	//Parse transitions
	for(var i = 0; i < transition_lines.length; i++) {
		//Split line into tokens on space
		var line = transition_lines[i]
		var tokens = line.split(' ')
		if(tokens.length < 3) {
			console.log('skipping bad line: "%s"', line)
			continue
		}

		//Parse
		var from_id = parseInt(tokens[0])
		var to_id = tokens[1]
		var p = parseFloat(tokens[2])

		//Create End_state or missing states?
		var to_state = this.states[to_id]
		if(!to_state) {
			to_state = new MarkovNode(to_id)
			this.states[to_id] = to_state
			to_state.type = 'end'
			num_states += 1
		}
		console.assert(to_state)

		//From State should already exist
		var state = this.states[from_id]
		if(!state) {
			debugger
		}
		console.assert(state)

		//Finally, add the transition
		state.add_transition(to_id, p)
	}
	//Verify the model is correct
	if(this.verify()) {
		console.log('HMM Model verified and correct')
	}
	else {
		console.log('HMM Model failed verfication')
	}
	this.num_states = num_states
}

//Reset the DP Matrix
HiddenMarkovModel.prototype.reset = function(sequence) {
	if(sequence) this.sequence = sequence
	var rows = this.sequence.length + 2
	var columns = this.num_states
	this.matrix = new Matrix(rows, columns, null)

	//Get State Labels
	var x_labels = []
	for(var i = 0; i < this.num_states; i++) {
		x_labels.push(i)
	}
	//Set labels
	this.matrix.set_labels(x_labels, sequence)
}

//Verify that Probabilities sum to 1.0 in the Model
HiddenMarkovModel.prototype.verify = function() {
	var verified = true
	for(var id in this.states) {
		var state = this.states[id]
		if(!state.verify()) {
			verified = false
		}
	}
	return verified
}

//Draw the model to an HTML5 Canvas Element
HiddenMarkovModel.prototype.draw = function(canvas, context, dp_canvas, dp_context) {
	//Draw all Nodes
	for(var id in this.states) {
		var state = this.states[id]
		state.draw(canvas, context, this.states)
	}
	//Draw DP Matrix
	this.matrix.draw(dp_canvas, dp_context)
}

//Execute a single step in the HMM Algorithm
HiddenMarkovModel.prototype.step = function() {
	if(this.algorithm == 'forward') {
		this.forward_step()
	}
	else if(this.algorithm == 'backward') {
		this.backward_step()
	}
	else if(this.algorithm == 'viterbi') {
		this.viterbi_step()
	}
	else if(this.algorithm == 'forward-backward') {
		this.forward_backward_step()
	}
	else {
		console.log('HMM.step(): invalid type: "%s"', this.algorithm)
	}
	this.step_num += 1
}

//Run the forward algorithm against the dataset
HiddenMarkovModel.prototype.init_step = function(step) {
	//Start State Probability = 1
	if(step == 0) {
		this.matrix[0][0] = 1
	}
	//Horizontal Init
	else if(step < this.num_states) {
		this.matrix[0][step] = 0
	}
	//Vertical Init
	else {
		var y = step - this.num_states + 1
		this.matrix[y][0] = 0
	}
}

HiddenMarkovModel.prototype.forward_recurrence = function(step) {
	//Compute X,Y values from step
	var w = this.num_states - 1
	var y = Math.floor(step / w) + 1
	var state_id = step % w + 1 //this is also the x coordinate
	var current_state = this.states[state_id]

	//initialize
	var probability = 0.0

	//Compute Recurrence
	for(var i = 0; i < this.num_states - 1; i++) { //-1 needed???
		var state = this.states[i]

		var transition_probability = state.transitions[state_id]
		
		var emission_probability = 1.0
		if(current_state.type != 'end') {
			var letter = this.sequence.charAt(y - 1)
			emission_probability = current_state.emission_probabilities[letter]
		}

		var previous_probability = this.matrix[y-1][i]

		if(transition_probability && emission_probability) {
			probability += transition_probability * emission_probability * previous_probability
		}
	}

	this.matrix[y][state_id] = probability
	return probability
}

HiddenMarkovModel.prototype.forward_step = function() {
	//Algorithm Complexity:
	var init_complexity = this.num_states + this.sequence.length + 2 - 1
	var recurrence_complexity = (this.num_states - 1) * (this.sequence.length + 1)

	//Initialization
	if(this.step_num < init_complexity) {
		this.init_step(this.step_num)
	}
	//Recurrence
	else if(this.step_num < init_complexity + recurrence_complexity) {
		this.forward_recurrence(this.step_num - init_complexity)
	}
	//Termination?
}

//Run the viterbi algorithm to find the most likely Path

HiddenMarkovModel.prototype.viterbi_recurrence = function(step) {
	//Compute X,Y values from step
	var w = this.num_states - 1
	var y = Math.floor(step / w) + 1
	var state_id = step % w + 1 //this is also the x coordinate
	var current_state = this.states[state_id]

	//initialize
	var max_p = 0.0
	var backpointer = null

	//Compute Recurrence
	for(var i = 0; i < this.num_states - 1; i++) { //-1 needed???
		var state = this.states[i]

		var transition_probability = state.transitions[state_id]
		
		var emission_probability = 1.0
		if(current_state.type != 'end') {
			var letter = this.sequence.charAt(y - 1)
			emission_probability = current_state.emission_probabilities[letter]
		}

		var previous_probability = this.matrix[y-1][i]

		if(transition_probability && emission_probability) {
			var p = transition_probability * emission_probability * previous_probability
			if(p > max_p) {
				max_p = p
				backpointer = i
			}
		}
	}

	console.log(max_p, backpointer, state_id, y)

	this.matrix[y][state_id] = max_p
	return max_p
}

//Trace Backpointers to recover most likely states
HiddenMarkovModel.prototype.viterbi_traceback = function(step) {

}

HiddenMarkovModel.prototype.viterbi_step = function() {
	//Algorithm Complexity:
	var init_complexity = this.num_states + this.sequence.length + 2 - 1
	var recurrence_complexity = (this.num_states - 1) * (this.sequence.length + 1)
	var traceback_complexity = Math.max(this.num_states, this.sequence.length)

	//Initialization
	if(this.step_num < init_complexity) {
		this.init_step(this.step_num)
	}
	//Recurrence
	else if(this.step_num < init_complexity + recurrence_complexity) {
		this.viterbi_recurrence(this.step_num - init_complexity)
	}
	//Traceback
	else if(this.step_num < init_complexity + recurrence_complexity + traceback_complexity) {
		this.viterbi_traceback(this.step_num - init_complexity - recurrence_complexity)
	}
	else {
		//do nothing when algorithm is completed
	}
}


//Run the backward algorithm
HiddenMarkovModel.prototype.backward_recurrence = function(step) {
	//Compute X,Y values from step
	var w = this.num_states - 1
	var y = Math.floor(step / w) + 1
	var state_id = step % w + 1 //this is also the x coordinate
	var current_state = this.states[state_id]
}

HiddenMarkovModel.prototype.backward_step = function() {

}

//Run Expectation Maximization algorithm
HiddenMarkovModel.prototype.forward_backward = function() {

}