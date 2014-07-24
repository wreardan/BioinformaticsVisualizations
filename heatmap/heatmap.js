//Globals
var matrix_max
var matrix_global
var color_scale_name = 'red_blue'

var color_scales = {
	'red_blue': [
		[250, 0, 0],
		[200, 0, 0],
		[150, 0, 0],
		[100, 0, 0],
		[255, 255, 255],
		[0, 0, 100],
		[0, 0, 150],
		[0, 0, 200],
		[0, 0, 250]
	],
	'red_green': [
		[250, 0, 0],
		[200, 0, 0],
		[150, 0, 0],
		[100, 0, 0],
		[255, 255, 255],
		[0, 100, 0],
		[0, 150, 0],
		[0, 200, 0],
		[0, 250, 0]
	],
	//colorbrewer2.org
	'red_blue_cmap': [
		[165,15,21],[222,45,38],[251,106,74],[252,174,145],[254,229,217],
		[239,243,255],[189,215,231],[107,174,214],[49,130,189],[8,81,156]
	],
}

//Clamp a value to a range
//i.e. clamp(2,0,1) = 1, clamp(-1,0,1) = 0
function clamp(value, min, max) {
	value = Math.max(value, min)
	value = Math.min(value, max)
	return value
}

//http://stackoverflow.com/questions/20792445/calculate-rgb-value-for-a-range-of-values-to-create-heat-map
//ported from Python version
//this function interpolates a value from a color range
function convert_to_rgb(minval, maxval, val, colors) {
	var result = {r:0,g:0,b:0}
	
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
	matrix_global = matrix
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
				var color_scale = color_scales['red_blue']
				var color = convert_to_rgb(-matrix_max, matrix_max, value, color_scale)
				context.fillStyle = convert_rgb_to_fillstyle(color, 'rgb')
			}
			
			//draw heatmap rectangle
			context.fillRect(col * width, row/sampling_interval, width, 1)
		}
	}
}

//load a matrix from a datafile then do callback(matrix)
function load_matrix(data) {
	//reset minval,maxval
	matrix_min = 1000000
	matrix_max = -1000000

	//future parameters
	var delimiter = '\t'
	var datatype = Number
	var marker = -100

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
				//Check for min/max
				if(value != marker) {
					if(Math.abs(value) > matrix_max)
						matrix_max = value
				}
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

//Resize the canvas with parameters
function resize_heatmap() {
	var canvas = document.getElementById('canvas')
	var width = Number(document.getElementById('canvas_width').value)
	var height = Number(document.getElementById('canvas_height').value)
	if(width && height) {
		canvas.width = width
		canvas.height = height
		draw_matrix(matrix_global)
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