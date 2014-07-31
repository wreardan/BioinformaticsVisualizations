//Utility Methods


//Alignment Algoirthm class
//a and b are sequence strings
function Alignment(a, b) {
	//save sequences
	this.a = a
	this.width = a.length + 1
	this.b = b
	this.height = b.length + 1

	//scoring parameters
	this.match = 1
	this.mismatch = -1
	this.gap_penalty = -2
	this.tiebreaker = 'match'

	//Stepping Mechanism
	this.step_num = 0
	this.done = false
	this.current_backpointer = null
	this.optimal_alignment = []

	//Local align?
	this.local_align = false

	//the mighty matrix
	this.matrix = null

	//backpointer map, use position in list as index
	//example: index = [1,2]; backpointers[index] = [0,1];
	this.backpointers = {}

	this.build_matrix()
}

//reset the parameters of the model
Alignment.prototype.reset = function(a, b, gap_penalty, match, mismatch, local_align, tiebreaker) {
	//Reset Parameters
	this.a = a
	this.width = a.length + 1
	this.b = b
	this.height = b.length + 1
	this.match = match
	this.mismatch = mismatch
	this.gap_penalty = gap_penalty
	this.local_align = local_align
	this.tiebreaker = tiebreaker

	//Reset State
	this.step_num = 0
	this.done = false
	this.current_backpointer = null
	this.optimal_alignment = []
	this.backpointers = {}
	this.build_matrix()
}

//Build an empty matrix
Alignment.prototype.build_matrix = function() {
	this.matrix = []
	for(var y = 0; y < this.height; y++) {
		var row = new Array(this.width)
		this.matrix.push(row)
	}
}

//Step through the algorithm
Alignment.prototype.step = function() {
	//Here lies the algorithm complexity:
	//Width and Height are N+1 and M+1 respectively
	var init_size = this.width + this.height - 1
	var algorithm_size = (this.width - 1) * (this.height - 1)
	var backtrace_size = Math.max(this.width, this.height)
	//Initialization
	if(this.step_num < init_size) {
		this.initialization_step(this.step_num)
	} 
	//Algorithm
	else if(this.step_num < init_size + algorithm_size) {
		this.algorithm_step(this.step_num - init_size)
	}
	//Back-Trace
	else if(!this.done) {
		this.backtrace_step(this.step_num - init_size - algorithm_size)
	}
	else {
		return
	}
	this.step_num += 1
}

//The Initialization portion of the algorithm
Alignment.prototype.initialization_step = function(step) {
	var from, to
	//first cell
	if(step == 0) {
		//setup equation display
		if(this.local_align) {
			document.getElementById('local_equation').style.display = ''
			document.getElementById('global_equation').style.display = 'none'
		}
		else {
			document.getElementById('local_equation').style.display = 'none'
			document.getElementById('global_equation').style.display = ''
		}
		//Set [0][0]
		this.matrix[0][0] = 0
		return //no backpointer for 0,0
	}
	//horizontal init
	else if(step < this.width) {
		if(this.local_align) {
			this.matrix[0][step] = 0
		}
		else {
			this.matrix[0][step] = step * this.gap_penalty
		}
		from = [step,0]
		to = [step-1,0]
	}
	//vertical init
	else {
		var y = step - this.width + 1
		if(this.local_align) {
			this.matrix[y][0] = 0
		}
		else {
			this.matrix[y][0] = y * this.gap_penalty
		}
		from = [0,y]
		to = [0,y-1]
	}
	if(!this.local_align) {
		this.backpointers[from] = to
	}
}

//score two positions
Alignment.prototype.score = function(x, y) {
	var a = this.a.charAt(x-1)
	var b = this.b.charAt(y-1)
	return a == b ? this.match : this.mismatch
}

//The main algorithm DP step
Alignment.prototype.algorithm_step = function(step) {
	//compute x,y values from step
	var w = this.width - 1
	var y = Math.floor(step / w) + 1
	var x = step % w + 1

	//compute recurrence
	var match = this.matrix[y-1][x-1] + this.score(x, y)
	var up = this.matrix[y-1][x] + this.gap_penalty
	var left = this.matrix[y][x-1] + this.gap_penalty

	//compute best
	var entries = [match, up, left]
	if(this.local_align) {
		entries.push(0)
	}
	var best = Math.max.apply(null, entries)
	this.matrix[y][x] = best

	//add backpointer
	var from = [x,y]

	//Prefer Matches
	if(this.tiebreaker == 'match') {
		if(match >= best) {
			var to = [x-1,y-1]
			this.backpointers[from] = to
		}
		else if(up >= best) {
			var to = [x,y-1]
			this.backpointers[from] = to
		}
		else if(left >= best) {
			var to = [x-1,y]
			this.backpointers[from] = to
		}
	}
	//Prefer Left
	else if(this.tiebreaker == 'left') {
		if(left >= best) {
			var to = [x-1,y]
			this.backpointers[from] = to
		}
		else if(up >= best) {
			var to = [x,y-1]
			this.backpointers[from] = to
		}
		else if(match >= best) {
			var to = [x-1,y-1]
			this.backpointers[from] = to
		}
	}
	//Prefer Right
	else if(this.tiebreaker == 'right') {
		if(left >= best) {
			var to = [x-1,y]
			this.backpointers[from] = to
		}
		else if(up >= best) {
			var to = [x,y-1]
			this.backpointers[from] = to
		}
		else if(match >= best) {
			var to = [x-1,y-1]
			this.backpointers[from] = to
		}
	}
	else {
		console.log('Alignment.algorithm_step() invalid tiebreaker type "%s"', this.tiebreaker)
	}
}

Alignment.prototype.find_maximal = function() {
	var max = -10000000
	var max_x, max_y
	for(var y = 0; y < this.height; y++) {
		for(var x = 0; x < this.width; x++) {
			var value = this.matrix[y][x]
			if(value > max) {
				max_x = x
				max_y = y
				max = value
			}
		}
	}
	if(max_x && max_y) {
		return [max_x, max_y]
	} else {
		throw('no max found or invalid coordinates detected')
	}
}

//Backtrace to yield the optimal alignment
Alignment.prototype.backtrace_step = function(step) {
	//initialize
	if(!this.current_backpointer) {
		if(this.local_align) {
			//todo: find maximal element, set this as backpointer\
			this.current_backpointer = this.find_maximal()
		}
		else {
			//start at the bottom right of the matrix
			this.current_backpointer = [this.width-1, this.height-1]
		}
	}

	//add current node to optimal path
	this.optimal_alignment.push(this.current_backpointer)



	//global termination - break when we hit 0,0
	var bp = this.current_backpointer
	if(bp[0] == 0 && bp[1] == 0) {
		this.done = true
		return
	}

	//traceback
	bp = this.backpointers[bp]

	//local termination - break when no backpointers left
	if(!this.current_backpointer) {
		if(this.local_align) {
			this.done = true
			return
		}
	}

	this.current_backpointer = bp
}

//Draw the Alignment to a canvas context
Alignment.prototype.draw = function(canvas, context) {
	var width = canvas.width
	var height = canvas.height

	var cell_width = width / (this.width + 1)
	var cell_height = height / (this.height + 1)

	//draw the grid
	this.draw_grid(canvas, context, cell_width, cell_height)

	//draw backpointers
	this.draw_backpointers(canvas, context, cell_width, cell_height)

	//draw sequence letters
	this.draw_sequences(canvas, context, cell_width, cell_height)

	//Setup Text properties
	context.font = '32px Verdana'
	context.fillStyle = 'rgb(0,0,0)'

	//draw the matrix values
	for(var y = 0; y < this.height; y++) {
		for(var x = 0; x < this.width; x++) {
			var value = this.matrix[y][x]
			if(typeof(value) == 'number') {
				var tx = (x + 1.2) * cell_width
				var ty = (y + 1.5) * cell_height
				context.fillText(value.toString(), tx, ty)
			}
		}
	}
}

//Draw a grid of lines to display a 'matrix' to a Canvas
Alignment.prototype.draw_grid = function(canvas, context, w, h) {
	context.beginPath()
	context.strokeStyle = '#101010'
	context.lineWidth = 10
	//Draw horizontal lines
	for(var y = 0; y < this.height + 2; y += 1) {
		var cy = y * h
		context.moveTo(0, cy)
		context.lineTo(canvas.width-1, cy)
	}

	//Draw vertical lines
	for(var x = 0; x < this.width + 2; x += 1) {
		var cx = x * w
		context.moveTo(cx, 0)
		context.lineTo(cx, canvas.height-1)
	}
	context.stroke()
}

//Draw sequences A and B to a Canvas
Alignment.prototype.draw_sequences = function(canvas, context, w, h) {
	//Setup Text properties
	context.font = '32px Verdana'
	context.fillStyle = 'rgb(0,0,0)'

	//Draw Sequence A
	for(var i = 0; i < this.a.length; i++) {
		var letter = this.a.charAt(i)
		var x = (i + 2.2) * w
		var y = (0.5) * h
		context.fillText(letter, x, y)
	}

	//Draw Sequence B
	for(var i = 0; i < this.b.length; i++) {
		var letter = this.b.charAt(i)
		var x = (0.5) * w
		var y = (i + 2.5) * h
		context.fillText(letter, x, y)
	}
}

//Draw backpointers to a Canvas
Alignment.prototype.draw_backpointers = function(canvas, context, w, h) {
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

//called when submit button is clicked
function reset_alignment() {
	//Get parameters from Form
	var x = document.getElementById('x').value
	var y = document.getElementById('y').value

	//Scoring parameters (gap_penalty is negated for use in alignment)
	var gap_penalty = -1 * Number(document.getElementById('gap_penalty').value)
	var match = Number(document.getElementById('match').value)
	var mismatch = Number(document.getElementById('mismatch').value)

	var local_align = document.getElementById('local_align').checked

	//Tiebreaker
	var tiebreaker = document.getElementById('tiebreaker').value

	//Reset
	alignment.reset(x, y, gap_penalty, match, mismatch, local_align, tiebreaker)

	//Clear CANVAS
	context.clearRect(0,0,canvas.width,canvas.height)
}

//Setup math jax for equation drawing
function config_math_jax() {
	MathJax.Hub.Config({
		config: ["MMLorHTML.js"],
		jax: ["input/TeX","input/MathML","input/AsciiMath","output/HTML-CSS","output/NativeMML"],
		extensions: ["tex2jax.js","mml2jax.js","asciimath2jax.js","MathMenu.js","MathZoom.js"],
		TeX: {
			extensions: ["AMSmath.js","AMSsymbols.js","noErrors.js","noUndefined.js"]
		}
	})
}

//draw loop
function draw() {
	alignment.step()
	alignment.draw(canvas, context)
}

var alignment
var canvas, context
//called on document load (body.onload)
function main() {
	canvas = document.getElementById('canvas')
	context = canvas.getContext('2d')

	//global alignment slides
	//var a = 'AGC'
	//var b = 'AAAC'
	//local alignment slides
	var a = 'AAGA'
	var b = 'TTAAG'
	alignment = new Alignment(a, b)

	setInterval(draw, 300)

	//setup MathJax
	config_math_jax()
}