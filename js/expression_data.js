//Color scales used to draw Matrix
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

/*
This class is used to represent the expression data
displayed in the right sidebar in the model
*/
function ExpressionData() {
	//this variable maps gene_name -> [expression_data]
	this.gene_map = {}
	this.num_genes = 0

	//minimum and maximum values of expression data
	this.min = 1000000.0
	this.max = -this.min
}

//Load expression data from a string
//Format: gene_name TAB expr1 TAB expr2 TAB ...
ExpressionData.prototype.load = function(data) {
	var delimiter = '\t'
	var lines = data.split('\n')
	//split into columns
	for(var i = 0; i < lines.length; i++) {
		var line = lines[i]
		var columns = line.split(delimiter)

		//Parse gene name and expression data (floats)
		var gene_name = columns[0]
		var expression = []
		for(var j = 1; j < columns.length; j++) {
			var value = parseFloat(columns[j])
			expression.push(value)
		}
		//Associate with gene_map data structure
		this.gene_map[gene_name] = expression
		this.num_genes++
	}
}

//Load in expression data from a file
ExpressionData.prototype.load_file = function(filename, callback) {
	var request = new XMLHttpRequest()

	var self = this

	request.onload = function() {
		var data = this.responseText
		self.load(data)
		callback()
	}
	request.open('get', filename, true)
	request.send()
}

//Draw expression data for a list of genes to a Canvas element
ExpressionData.prototype.draw = function(canvas, context, gene_names) {
	console.assert(gene_names.length > 0)
	//Calculate width per column, and height per row
	var first_gene = gene_names[0]
	var num_columns = this.gene_map[first_gene].length
	var cell_width = canvas.width / num_columns

	var cell_height = canvas.height / gene_names.length


	//setup color scale
	var color_scale = color_scales['red_blue']

	//Loop through Matrix
	for(var row = 0; row < gene_names.length; row++) {
		var name = gene_names[row]
		var expression_data = this.gene_map[name]
		if(!expression_data) {
			console.log("gene '%s' not found in expression data", name)
			continue
		}
		for(var column = 0; column < num_columns; column++) {
			var value = expression_data[column]
			var color = convert_to_rgb(-5, 5, value, color_scale)
			context.fillStyle = convert_rgb_to_fillstyle(color, 'rgb')
			var x = column * cell_width
			var y = row*cell_height
			context.fillRect(x, y, cell_width, cell_height)
		}
	}
}