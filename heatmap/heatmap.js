//http://stackoverflow.com/questions/20792445/calculate-rgb-value-for-a-range-of-values-to-create-heat-map
//ported from Python version
var colors_rgb = [
	[0, 0, 200],
	[0, 0, 64],
	[255, 255, 255],
	[64, 0, 0],
	[200, 0, 0]
]
//this function interpolates a value from a color range
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

//this functions converts an color (with .r .g .b values)
//to a context.fillStyle for canvas drawing
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
	var sampling_interval = Math.floor(matrix.length / canvas.height)
	var width = Math.floor(canvas.width / matrix[0].length)
	
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
				var color = convert_to_rgb(-10, 10, value, colors_rgb)
				context.fillStyle = convert_rgb_to_fillstyle(color)
			}
			
			//draw heatmap rectangle
			context.fillRect(col * width, row/sampling_interval, width, 1)
		}
	}
}

//load a matrix from a datafile then do callback(matrix)
function load_matrix(data) {
	//future parameters
	var delimiter = '\t'
	var datatype = Number

	//the resulting parsed matrix
	var matrix = []
	//split file into lines
	var lines = data.split('\n')
	//split lines into columns
	for(var i = 0; i < lines.length; i++) {
		var line = lines[i]
		var columns = line.split(delimiter)
		//set matrix row
		var row = []
		for(var j = 0; j < columns.length; j++) {
			var value = datatype(columns[j])
			if(isNaN(value)) {
				console.log('%s is not a number', columns[j])
			}
			else {
				row.push(value)
			}
		}
		matrix.push(row)
	}

	return matrix
}

//load a matrix from a filename, then call function
function load_matrix_file(filename, callback) {

	var request = new XMLHttpRequest()

	//setup request handler
	request.onload = function() {
		var data = this.responseText
		var matrix = load_matrix(data, callback)
		callback(matrix)
	}
	request.open('get', filename, true)
	request.send()

}

//Load clusters from a filename
function load_clusters(filename, callback) {
	var request = new XMLHttpRequest()

	request.onload = function() {
		var data = this.responseText

	}
}

//Called when file(s) are uploaded
function handle_file_selected(event) {
	var files = event.target.files
	var encoding = 'utf8'

	for(var i = 0; i < files.length; i++) {
		var file = files[i]
		//console.log('file.name: %s, file.size: %d', file.name, file.size)

		//http://blog.teamtreehouse.com/reading-files-using-the-html5-filereader-api
		var reader = new FileReader()
		reader.onload = function(e) {
			var text = reader.result
			//console.log('file.name: %s, file data size: %d', file.name, text.length)
			//load matrix from text
			var matrix = load_matrix(text)
			draw_matrix(matrix)
		}
		reader.readAsText(file, encoding)
	}
}

//called after document has been loaded
function main() {
	var filename = './data/marked_MiniBatchKMeans.txt'
	load_matrix_file(filename, draw_matrix)

	//setup event handler for file upload
	//http://www.html5rocks.com/en/tutorials/file/dndfiles/
	document.getElementById('files').addEventListener('change', handle_file_selected, false)

}