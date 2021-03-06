//timeout value for each step in the algorithms
var step_timeout = 500

//callback for logging data to console
function log_data(data) {
	console.log(data)
}

//Load an HMM from files
function load_data(filename, callback) {
	var request = new XMLHttpRequest()
	request.onload = function() {
		var data = this.responseText
		callback(data)
	}
	request.open('get', filename, true)
	request.send()
}

//Step through the algorithm
function hmm_step() {

	hmm.step()

	//set timer to call again
	setTimeout(hmm_step, step_timeout)
}

//Draw loop
function draw() {
	//Clear the Model Canvas for drawing
	context.clearRect(0,0, canvas.width, canvas.height)

	//Clear DP Canvas
	dp_context.clearRect(0,0,canvas.width,canvas.height)

	//Resize then draw
	hmm.resize_canvas(canvas)
	hmm.draw(canvas, context, dp_canvas, dp_context)
	
	requestAnimationFrame(draw)
}

//Called on Button click, Reset the HMM with parameter values
function reset_hmm() {
	//Get sequence
	var sequence = document.getElementById('sequence').value

	//Reset HMM
	hmm.reset(sequence)

	//Get the algorithm type from the Radio Button
	if(document.getElementById('forward').checked) {
		hmm.algorithm = 'forward'
	}
	else if(document.getElementById('backward').checked) {
		hmm.algorithm = 'backward'
	}
	else if(document.getElementById('viterbi').checked) {
		hmm.algorithm = 'viterbi'
	}
	else if(document.getElementById('forward_backward').checked) {
		hmm.algorithm = 'forward_backward'

		//Reset Forward-Backward expected matrices flag
		hmm.expected_matrices_created = false

		//Get training sequences from text box
		var training_text = document.getElementById('training')
		var text = training_text.value
		var training_sequences = text.trim().split('\n')
		console.assert(training_sequences.length > 0)
		hmm.training_sequences = training_sequences
		hmm.training_sequence_index = 0
		hmm.current_forward_backward_step = 'forward'

		hmm.reset(training_sequences[0])
	}

	//Clear CANVAS
	dp_context.clearRect(0,0,canvas.width,canvas.height)
}

//Context Menu
var menu1 = [
	{'Edit Emissions': function(menu_item, menu) {console.log('edit')}},
	$.contextMenu.seperator,
	{'Change Node Type': function(menu_item, menu) {console.log('type')}},
	$.contextMenu.seperator,
	{'Delete Node': function(menu_item, menu) {console.log('delete')}},
]
$(function() {
	$('.cmenu1').contextMenu(menu1, {theme: 'vista'})
})

//Handle mouse input for manipulating the HMM
//These functions are attached to the Canvas element inside main()
//Drag over another state to create a Transition
var selected_state = null
var previous = {x: 0, y: 0}
//A utility function to return canvas-local coordinates
function canvas_local_position(canvas, event) {
	var position = {}
	position.x = event.pageX - canvas.offsetLeft
	position.y = event.pageY - canvas.offsetTop
	return position
}
function mousedown(event) {
	if(event.which != 1) return //only interested in left-clicks
	//Convert coordinates to canvas-local from event
	var p = canvas_local_position(canvas, event)
	var x = p.x
	var y = p.y

	//Check for collision
	selected_state = hmm.collision(x, y)
	if(selected_state) {
		//Set previous to current coordinate
		previous.x = x
		previous.y = y

		//Set selected status
		selected_state.gui_selected = true

		console.log('state %d selected', selected_state.id)

	}

	//prevent default
	event.preventDefault()
}
function mousemove(event) {
	if(event.which != 1) return //only interested in left-clicks
	if(selected_state) {
		//get x and y from event
		var p = canvas_local_position(canvas, event)
		var x = p.x
		var y = p.y
		//Calculate delta x and y
		var dx = x - previous.x
		var dy = y - previous.y
		//Set previous to current coordinate
		previous.x = x
		previous.y = y

		//Drag the selected state
		selected_state.drag(dx, dy)
	}
}
function mouseup(event) {
	if(event.which != 1) return //only interested in left-clicks
	//Release the selected State
	if(selected_state) {
		//Check for overlap and create transition
		var overlap = hmm.overlaps(selected_state)
		if(overlap) {
			//Create transition from overlap to this state
			overlap.add_transition(selected_state.id, 1.0)
			//Move to the right of the overlapping node
			selected_state.x = overlap.x + overlap.w + 50
			selected_state.y = overlap.y
		}


		//Deselect State
		selected_state.gui_selected = false
		selected_state = null

	}
}
var edit_state = null
//double click will select the node for editing
function doubleclick(event) {
	if(event.which != 1) return //only interested in left double-clicks

	//Convert coordinates to canvas-local from event
	var p = canvas_local_position(canvas, event)
	var x = p.x
	var y = p.y

	//Check for collision
	edit_state = hmm.collision(x, y)
	if(edit_state) {
		console.log('double click on state %d', edit_state.id)
		//Update text boxes
		$('#node_id').val(edit_state.id)
		$('#node_type').val(edit_state.type)
		$('#node_emissions').val(edit_state.emission_strings())
		$('#node_transitions').val(edit_state.transition_strings())
		//
	}

	event.preventDefault()
}
//this will save the current values in the node_editor
function save_node() {
	if(edit_state){
		var id = $('#node_id').val()
		var type = $('#node_type').val()
		var emission_strings = $('#node_emissions').val()
		edit_state.parse_emissions(emission_strings)
		var transition_strings = $('#node_transitions').val()
		edit_state.parse_transitions(transition_strings)
		console.log('id: %s\ntype: %s\nemissions:\n%s\ntransitions:\n%s', id, type, emission_strings, transition_strings)
	}
}


//Button to add a new state to the model
//Add a new node to the HMM
function hmm_add_node() {
	hmm.add_node()
}

//Globals
var hmm
var canvas, context
var dp_canvas, dp_context

//called from body.onload
function main() {
	//Get Canvas and Context
	canvas = document.getElementById('canvas')
	context = canvas.getContext('2d')

	//Add mouse event handlers
	canvas.onmousedown = mousedown
	canvas.onmouseup = mouseup
	canvas.onmousemove = mousemove
	canvas.ondblclick = doubleclick

	//Dynamic Programming Matrix Canvas
	dp_canvas = document.getElementById('dp_canvas')
	dp_context = dp_canvas.getContext('2d')

	//Load in Transition and Emission Probabilities
	load_data('results/emission_forward_backward.txt', function(emission_string) {
		//console.log('emissions:\n%s\n', emission_string)
		load_data('results/transition_forward_backward.txt', function(transition_string) {
			//console.log('transitions:\n%s\n', transition_string)
			//Build Model
			hmm = new HiddenMarkovModel()
			hmm.build_model(emission_string, transition_string)
			hmm.reset('TAGA')
			
			//Setup callback steps
			setTimeout(hmm_step, step_timeout)

			//Setup draw loop
			requestAnimationFrame(draw)
		})
	})

	//Setup Speed Range listener
	$('#speed').on('change mousemove', function() {
		step_timeout = $(this).val()
	})
}