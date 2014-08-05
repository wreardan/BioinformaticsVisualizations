//Hidden Markov Model class
function HiddenMarkovModel() {
	//Model Information
	this.states = {}
	this.num_states = 0

	this.matrix = null
	this.sequence = ''

	//Info for stepping through the algorithm graphically
	this.algorithm = 'backward'
	this.step_num = 0

	this.backpointers = {}
	this.optimal_backpointers = []
	this.current_backpointer = null

	//for highlighting elements in the model
	this.highlighted_node = null
	this.sequence_index = null
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
		var to_id = parseInt(tokens[1])
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
	//Set sequence
	if(sequence) this.sequence = sequence

	//Build Matrix
	var rows = this.sequence.length + 2
	var columns = this.num_states
	this.matrix = new Matrix(columns, rows, null)

	//Get State Labels
	var x_labels = []
	for(var i = 0; i < this.num_states; i++) {
		x_labels.push(i)
	}

	//Set labels
	this.matrix.set_labels(x_labels, sequence)

	//Reset State
	this.step_num = 0
	this.backpointers = {}
	this.optimal_backpointers = []
	this.current_backpointer = null
}

//Add a new Node to the model (called from gui)
HiddenMarkovModel.prototype.add_node = function() {
	//Modify old End Node
	var end_state = this.states[this.num_states-1]
	var new_end_state_id = this.num_states
	//Modify old End Node transitions
	for(var i = 0; i < this.num_states; i++) {
		var state = this.states[i]
		if(state.transitions[end_state.id]) {
			//swap transition probability to new state
			var prob = state.transitions[end_state.id]
			delete state.transitions[end_state.id]
			state.transitions[new_end_state_id] = prob
		}
	}
	//Update ID and position
	end_state.id = new_end_state_id
	end_state.default_position()
	this.states[new_end_state_id] = end_state
	//Create Node with id n-1, old end state id
	var id = this.num_states-1
	var state = new MarkovNode(id)
	this.states[id] = state
	//Update number of states
	this.num_states += 1

	//Add default emissions with equal probability
	var emissions = ['A','C','G','T']
	var prob = 1.0 / emissions.length
	for(var i = 0; i < emissions.length; i++) {
		state.add_emission(emissions[i], prob)
	}
}

//Check the state against the model for overlapping states
HiddenMarkovModel.prototype.overlaps = function(node) {
	for(var i = 0; i < this.num_states; i++) {
		var state = this.states[i]
		if(state != node) {
			if(node.overlaps(state)) {
				return state
			}
		}
	}
	return null
}

//Resize the canvas to fit the entire model
HiddenMarkovModel.prototype.resize_canvas = function(canvas) {
	//Find maximal width and height
	var width = 0
	var height = 0
	for(var i = 0; i < this.num_states; i++) {
		var state = this.states[i]
		var x = state.x + state.w + 50
		var y = state.y + state.h + 50
		if(x > width) {
			width = x
		}
		if(y > height) {
			height = y
		}
	}

	//Resize canvas (only if bigger)
	if(width > canvas.width) {
		canvas.width = width
	}
	if(height > canvas.height) {
		canvas.height = height
	}
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
	//Draw Backpointers
	this.draw_backpointers(dp_canvas, dp_context)
}

//Returns which node has been clicked on or null
HiddenMarkovModel.prototype.collision = function(x, y) {
	for(var i = 0; i < this.num_states; i++) {
		var state = this.states[i]
		if(state.collision(x, y)) {
			return state
		}
	}
	return null
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

	if(max_p > 0.0) {
		var bp_index = backpointer + ',' + (y-1)
		var index = state_id + ',' + y
		this.backpointers[index] = bp_index

		//console.log('%s -> %s (%f)', index, bp_index, max_p)
	}

	this.matrix[y][state_id] = max_p
	return max_p
}

//Convert a csv string into a list of ints
function string_to_list(string) {
	var tokens = string.split(',')
	var result = []
	for(var i = 0; i < tokens.length; i++) {
		var num = parseInt(tokens[i])
		result.push(num)
	}
	return result
}

//Draw the backpointers that have been computed so far
HiddenMarkovModel.prototype.draw_backpointers = function(canvas, context) {
	var w = this.matrix.cell_width
	var h = this.matrix.cell_height
	//Draw All Backpointers
	context.beginPath()
	context.strokeStyle = '#c01010'
	for(var index in this.backpointers) {
		var index_tokens = index.split(',')
		var x = parseInt(index_tokens[0])
		var y = parseInt(index_tokens[1])
		var cx = (x + 1.5) * w
		var cy = (y + 1.5) * h
		context.moveTo(cx, cy)

		var bp_index = this.backpointers[index]
		var bp_tokens = bp_index.split(',')
		var bx = parseInt(bp_tokens[0])
		var by = parseInt(bp_tokens[1])
		var cbx = (bx + 1.5) * w
		var cby = (by + 1.5) * h
		context.lineTo(cbx, cby)
	}
	context.stroke()

	//Draw optimal backpointers
	context.beginPath()
	context.strokeStyle = '#10c010'
	//Draw first 
	if(this.optimal_backpointers.length > 1) {
		var coord = string_to_list(this.optimal_backpointers[0])
		var x = (coord[0] + 1.5) * w
		var y = (coord[1] + 1.5) * h
		context.moveTo(x, y)
	}
	//draw rest
	for(var i = 1; i < this.optimal_backpointers.length; i++) {
		var coord = string_to_list(this.optimal_backpointers[i])
		var bx = (coord[0] + 1.5) * w
		var by = (coord[1] + 1.5) * h
		context.lineTo(bx, by)
	}
	context.stroke()
}

//Draw backpointers to a Canvas
var delete_me_alignemnt_draw_backpointers = function(canvas, context, w, h) {
	//Draw all backpointers
	context.beginPath()
	context.strokeStyle = '#c01010'
	for(var from in this.backpointers) {
		//parse the from string back into x,y number values
		var tokens = from.split(',')
		var coords = [Number(tokens[0]), Number(tokens[1])]
		var x1 = (coords[0] + 1.5) * w
		var y1 = (coords[1] + 1.5) * h
		context.moveTo(x1, y1)

		var to = this.backpointers[from]
		var x2 = (to[0] + 1.5) * w
		var y2 = (to[1] + 1.5) * h
		context.lineTo(x2, y2)
	}
	context.stroke()

	//Draw optimal backpointers
	context.beginPath()
	context.strokeStyle = '#10c010'
	var from = this.optimal_alignment[0]
	for(var i = 1; i < this.optimal_alignment.length; i++) {
		var to = this.optimal_alignment[i]

		var x1 = (from[0] + 1.5) * w
		var y1 = (from[1] + 1.5) * h
		context.moveTo(x1, y1)

		var x2 = (to[0] + 1.5) * w
		var y2 = (to[1] + 1.5) * h
		context.lineTo(x2, y2)

		from = to
	}
	context.stroke()
}

//Trace Backpointers to recover most likely states
HiddenMarkovModel.prototype.viterbi_traceback = function(step) {
	if(step == 0) {
		var x = this.num_states - 1
		var y = this.sequence.length + 1
		this.current_backpointer =  x + ',' + y
	}

	this.optimal_backpointers.push(this.current_backpointer)

	this.current_backpointer = this.backpointers[this.current_backpointer]
}

HiddenMarkovModel.prototype.viterbi_step = function() {
	//Algorithm Complexity:
	var init_complexity = this.num_states + this.sequence.length + 2 - 1
	var recurrence_complexity = (this.num_states - 1) * (this.sequence.length + 1)
	var traceback_complexity = this.sequence.length + 2

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
	var y = this.sequence.length - Math.floor(step / w)
	var state_id = this.num_states - step % w - 2 //this is also the x coordinate
	var current_state = this.states[state_id]

	var probability = 0.0

	//skip start state for non-start of sequence
	if(y != 0 && state_id == 0) {
		this.matrix[y][state_id] = probability
		return
	}

	//Compute Recurrence
	for(var i = 0; i < this.num_states; i++) {
		var state = this.states[i]

		var transition_probability = current_state.transitions[i]
		
		var emission_probability = 1.0
		if(state.type != 'end') {
			var letter = this.sequence.charAt(y)
			emission_probability = state.emission_probabilities[letter]
		}

		var previous_probability = this.matrix[y+1][i]

		if(transition_probability && emission_probability) {
			//console.log('%f,%f,%f', transition_probability, emission_probability, previous_probability)
			probability += transition_probability * emission_probability * previous_probability
		}
	}

	this.matrix[y][state_id] = probability
}

//Far right column and bottom row are zeroed, except bottom right (1)
HiddenMarkovModel.prototype.backward_init = function(step) {
	//Start State Probability = 1
	if(step == 0) {
		this.matrix[this.sequence.length + 1][this.num_states-1] = 1
	}
	//Horizontal Init
	else if(step < this.num_states) {
		this.matrix[this.sequence.length + 1][step-1] = 0
	}
	//Vertical Init
	else {
		var y = step - this.num_states
		this.matrix[y][this.num_states-1] = 0
	}
}

HiddenMarkovModel.prototype.backward_step = function() {
	//Algorithm Complexity:
	var init_complexity = this.num_states + this.sequence.length + 2 - 1
	var recurrence_complexity = (this.num_states - 1) * (this.sequence.length + 1)

	if(this.step_num < init_complexity) {
		this.backward_init(this.step_num)
	}
	else if(this.step_num < init_complexity + recurrence_complexity) {
		this.backward_recurrence(this.step_num - init_complexity)
	} else {
		//do nothing if finished
	}
}

//Run Expectation Maximization algorithm
HiddenMarkovModel.prototype.forward_backward = function() {

}