

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

//Globals
var hmm
var canvas, context
var dp_canvas, dp_context

//called from body.onload
function main() {
	//Get Canvas and Context
	canvas = document.getElementById('canvas')
	context = canvas.getContext('2d')

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