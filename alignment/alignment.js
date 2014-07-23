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

	//Stepping Mechanism
	this.step_num = 0

	//Local align?
	this.local_align = true

	//the mighty matrix
	this.matrix = null

	//backpointer map, use position in list as index
	//example: index = [1,2]; backpointers[index] = [0,1];
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
	else {
		this.backtrace_step(this.step_num - init_size - algorithm_size)
	}
	this.step_num += 1
}

//The Initialization portion of the algorithm
Alignment.prototype.initialization_step = function(step) {
	//first cell
	if(step == 0) {
		this.matrix[0][0] = 0
	}
	//horizontal init
	else if(step < this.width) {
		if(this.local_align) {
			this.matrix[0][step] = 0
		}
		else {
			this.matrix[0][step] = step * this.gap_penalty
		}
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

	//add backpointer(s)
	var from = [x,y]
	if(match >= best) {
		var to = [x-1,y-1]
		this.backpointers[from] = to
	}
	if(up >= best) {
		var to = [x,y-1]
		this.backpointers[from] = to
	}
	if(left >= best) {
		var to = [x-1,y]
		this.backpointers[from] = to
	}
}

//
Alignment.prototype.backtrace_step = function(step) {

}

//Draw the Alignment to a canvas context
Alignment.prototype.draw = function(canvas, context) {
	var width = canvas.width
	var height = canvas.height

	var cell_width = width / this.width
	var cell_height = height / this.height

	//draw the grid
	this.draw_grid(canvas, context, cell_width, cell_height)

	//Setup Text properties
	context.font = '32px Verdana'
	context.fillStyle = 'rgb(0,0,0)'

	//draw the matrix values
	for(var y = 0; y < this.height; y++) {
		for(var x = 0; x < this.width; x++) {
			var value = this.matrix[y][x]
			if(typeof(value) == 'number') {
				var tx = (x + 0.5) * cell_width
				var ty = (y + 0.5) * cell_height
				context.fillText(value.toString(), tx, ty)
			}
		}
	}
}

//Draw a grid of lines to display a 'matrix'
Alignment.prototype.draw_grid = function(canvas, context, w, h) {
	context.strokeStyle = '#101010'
	context.lineWidth = 10
	//Draw horizontal lines
	for(var y = 0; y <= this.height; y += 1) {
		var cy = y * h
		context.moveTo(0, cy)
		context.lineTo(canvas.width-1, cy)
	}

	//Draw vertical lines
	for(var x = 0; x <= this.width; x += 1) {
		var cx = x * w
		context.moveTo(cx, 0)
		context.lineTo(cx, canvas.height-1)
	}
	context.stroke()
}

//Draw sequences A and B
Alignment.prototype.draw_sequences = function() {

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

	setInterval(draw, 200)
}