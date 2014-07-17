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
Matrix.prototype.slice_rows = function(rows) {
	debugger
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

function test() {
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

module.exports = Matrix
