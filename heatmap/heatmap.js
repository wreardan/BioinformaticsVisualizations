//http://stackoverflow.com/questions/20792445/calculate-rgb-value-for-a-range-of-values-to-create-heat-map
var colors_rgb = [
	[0, 0, 200],
	[0, 0, 64],
	[255, 255, 255],
	[64, 0, 0],
	[200, 0, 0]
]
function convert_to_rgb(minval, maxval, val, colors) {
	var result = {'r': 0, 'g': 0, 'b': 0}
	
	var max_index = colors.length-1
	var v = Number(val-minval) / Number(maxval-minval) * max_index
	var i1 = Math.floor(v)
	var i2 = Math.min(Math.floor(v)+1, max_index)
	if (i2 >= colors.length || i1 >= colors.length) {
		console.log('bad index: i1: %d, i2: %d, value: %d', i1, i2, val)
		return result
	}
	//(r1, g1, b1), (r2, g2, b2) = colors[i1], colors[i2]
	var c1 = colors[i1]
	var c2 = colors[i2]
	var f = v - i1
	//rgb = int(r1 + f*(r2-r1)), int(g1 + f*(g2-g1)), int(b1 + f*(b2-b1))
	result.r = Math.floor(c1[0] + f*(c2[0] - c1[0]))
	result.g = Math.floor(c1[1] + f*(c2[1] - c1[1]))
	result.b = Math.floor(c1[2] + f*(c2[2] - c1[2]))

	return result
}

function convert_rgb_to_fillstyle(color) {
	var fill = 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')'
	return fill
}

//draw matrix to canvas
function draw_matrix(matrix) {
	//get canvas and context elements from the DOM
	var canvas = document.getElementById('canvas')
	var context = canvas.getContext('2d')

	//set drawing parameters
	var sampling_interval = 6
	var width = 20
	
	//loop through matrix rows and columns
	for(var row = 0; row < matrix.length; row += sampling_interval) {
		for(var col = 0; col < matrix[row].length; col++) {
			//get value from matrix
			var value = matrix[row][col]
			//calculate color based on value
			if(value < -50) {
				context.fillStyle = 'rgb(0,0,0)'
			}
			else {
				var color = convert_to_rgb(-4.5, 4.5, value, colors_rgb)
				context.fillStyle = convert_rgb_to_fillstyle(color)
			}
			
			//draw heatmap rectangle
			context.fillRect(col * width, row/sampling_interval, width, 1)
		}
	}
}

//load a matrix from a datafile
function load_matrix(filename, callback) {
	var delimiter = '\t'
	var datatype = Number

	var request = new XMLHttpRequest()

	//setup request handler
	request.onload = function() {
		var matrix = []
		//split file into lines
		var data = this.responseText
		var lines = data.split('\n')
		//split lines into columns
		for(var i = 0; i < lines.length; i++) {
			var line = lines[i]
			var columns = line.split(delimiter)
			//set matrix row
			var row = []
			for(var j = 0; j < columns.length; j++) {
				var value = datatype(columns[j])
				row.push(value)
			}
			matrix.push(row)
		}
		callback(matrix)
	}
	request.open('get', filename, true)
	request.send()
}

function main() {
	var filename = './data/marked_MiniBatchKMeans.txt'
	load_matrix(filename, draw_matrix)
}