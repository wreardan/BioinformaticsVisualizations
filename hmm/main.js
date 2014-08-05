

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
	//Clear the Model Canvas for drawing
	context.clearRect(0,0, canvas.width, canvas.height)

	hmm.step()

	hmm.resize_canvas(canvas)
	hmm.draw(canvas, context, dp_canvas, dp_context)
}

//Called on Button click, Reset the HMM with parameter values
function reset_hmm() {
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

	//Get sequence
	var sequence = document.getElementById('sequence').value

	//Reset HMM
	hmm.reset(sequence)

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

	//Dynamic Programming Matrix Canvas
	dp_canvas = document.getElementById('dp_canvas')
	dp_context = dp_canvas.getContext('2d')

	//Load in Transition and Emission Probabilities
	load_data('results/emission2.txt', function(emission_string) {
		//console.log('emissions:\n%s\n', emission_string)
		load_data('results/transition2.txt', function(transition_string) {
			//console.log('transitions:\n%s\n', transition_string)
			//Build Model
			hmm = new HiddenMarkovModel()
			hmm.build_model(emission_string, transition_string)
			hmm.reset('TAGA')
			
			//Setup callback steps
			setInterval(hmm_step, 200)
		})
	})
}