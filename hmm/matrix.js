//Matrix class to represent a 2d grid of data
function Matrix(columns, rows, default_value) {
	default_value = typeof default_value !== 'undefined' ? default_value : 0.0
	this.rows = rows
	this.columns = columns
	this.parent.constructor.call(this, rows)
	for(var i = 0; i < rows; i++) {
		this[i] = new Array(columns)
		for(var j = 0; j < columns; j++) {
			this[i][j] = default_value
		}
	}

	//Labels for x and y
	this.x_labels = []
	this.y_labels = []
}
Matrix.prototype = new Array()
Matrix.prototype.constructor = Matrix
Matrix.prototype.parent = Array.prototype

//Static Methods
Matrix.read_delimited = function(filename, delimiter) {
	//Read file in with JQuery
		//Split by line
		//Split line into delimiter
}

//Methods

//Returns a string representation of the Matrix
//with optional delimiter (tab default)
Matrix.prototype.toString = function(delimiter) {
	if(typeof(delimiter) === 'undefined') delimiter = '\t'
}

//Draw the Matrix to a Canvas Context
Matrix.prototype.draw = function(canvas, context) {
	var width = canvas.width
	var height = canvas.height

	this.cell_width = width / (this.columns + 1)
	this.cell_height = height / (this.rows + 1)

	this.draw_grid(canvas, context, this.cell_width, this.cell_height)

	this.draw_elements(canvas, context, this.cell_width, this.cell_height)

	this.draw_labels(canvas, context, this.cell_width, this.cell_height)
}

//Draw a grid of lines to display a 'matrix' to a Canvas
Matrix.prototype.draw_grid = function(canvas, context, w, h) {
	//Setup Context
	context.beginPath()
	context.strokeStyle = '#101010'
	context.lineWidth = 5
	//Compute max_x, max_y
	var max_x = (w+1) * (this.columns+1)
	var max_y = (h+1) * (this.rows+1)
	//Draw horizontal lines
	for(var y = 0; y < this.rows + 2; y += 1) {
		var cy = y * h
		context.moveTo(0, cy)
		context.lineTo(max_x, cy)
	}

	//Draw vertical lines
	for(var x = 0; x < this.columns + 2; x += 1) {
		var cx = x * w
		context.moveTo(cx, 0)
		context.lineTo(cx, max_y)
	}
	context.stroke()
}

//Draw the values of elements inside the matrix
Matrix.prototype.draw_elements = function(canvas, context, w, h) {
	//Setup Text properties
	context.font = '18px Verdana'
	context.fillStyle = 'rgb(0,0,0)'

	//draw the matrix values
	for(var y = 0; y < this.rows; y++) {
		for(var x = 0; x < this.columns; x++) {
			var value = this[y][x]
			if(typeof(value) == 'number') {
				var tx = (x + 1.1) * w
				var ty = (y + 1.6) * h
				var rounded = value.toFixed(4).toString()
				context.fillText(rounded, tx, ty)
			}
		}
	}
}

//Converts a string to a list
//i.e. convert_string_to_list('ABC') = ['A', 'B', 'C']
function convert_string_to_list(string_to_convert) {
	var result = []
	for(var i = 0; i < string_to_convert.length; i++) {
		result.push(string_to_convert.charAt(i))
	}
	return result
}

//Draw the vertical and horizontal labels for the Matrix
//i.e. row 0 and column 0
//inputs are two lists of strings which are the labels
//the inputs can also be strings, in which case it will use the characters
Matrix.prototype.draw_labels = function(canvas, context, w, h) {
	//Setup Text properties
	context.font = '18px Verdana'
	context.fillStyle = 'rgb(0,0,0)'

	//Draw X Labels
	for(var i = 0; i < this.x_labels.length; i++) {
		var label = this.x_labels[i]
		var x = (i + 1.2) * w
		var y = (0.5) * h
		context.fillText(label, x, y)
	}

	//Draw Y Labels
	for(var i = 0; i < this.y_labels.length; i++) {
		var label = this.y_labels[i]
		var x = (0.5) * w
		var y
		if(this.zero_based) {
			y = (i + 1.5) * h
		}
		else {
			y = (i + 2.5) * h
		}
		context.fillText(label, x, y)
	}
}

//Set the X and Y labels for the Matrix
Matrix.prototype.set_labels = function(x_labels, y_labels, zero_based) {
	this.zero_based = zero_based
	if(typeof(x_labels) == 'string') {
		this.x_labels = convert_string_to_list(x_labels)
	}
	else {
		this.x_labels = x_labels
	}

	if(typeof(y_labels) == 'string') {
		this.y_labels = convert_string_to_list(y_labels)
	}
	else {
		this.y_labels = y_labels
	}
}


//Slice a matrix's rows
Matrix.prototype.slice_rows = function(rows) {
	var m = new Matrix(this.columns, rows.length)
	var ri = 0
	for(var r = 0; r < this.rows; r++) {
		if(rows.indexOf(r) > -1) {
			m[ri] = this[r].slice(0)
			ri++
		}
	}
	return m
}

//Slice a matrix's columns
Matrix.prototype.slice_cols = function(columns) {
	var m = new Matrix(columns.length, this.rows)
	for(var r = 0; r < this.rows; r++) {
		var ci = 0
		for(var c = 0; c < this.columns; c++) {
			if(columns.indexOf(c) > -1) {
				m[r][ci] = this[r][c]
				ci++
			}
		}
	}
	return m
}

function test_slice() {
	var m = new Matrix(4, 3)
	m[0][0] = 1
	m[1][1] = 11
	var r = m.slice_rows([0,1])
	console.log(r)

	m[2][2] = 22
	m[2][3] = 30
	r = m.slice_cols([0,2,3])
	console.log(r)
}


//Node.JS
if(typeof(module) !== 'undefined') {
	module.exports = Matrix
}
