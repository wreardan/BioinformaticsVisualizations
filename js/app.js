function App() {
	this.scene = null
	this.camera = null
	this.renderer = null
	this.controls = null
	this.network = null
	this.draw_all = false
}

//get a javascript table from tab-seperated data
App.prototype.parse_tab_data = function(data) {
	//split by line
	var lines = data.split('\n')
	//split by tab
	var table = []
	for(var i = 0; i < lines.length; i++) {
		var row = lines[i].split("\t")
		if(row.length > 1) {
			table.push(row)
		}
	}
	return table
}

App.prototype.add_nodes_to_geometry = function(all_geometry, nodes, all_materials, material_index) {
	//Sphere Properties
	var sphere_size = 0.1
	var sphere_resolution = 6
	var sphere_geometry = new THREE.SphereGeometry(sphere_size, sphere_resolution, sphere_resolution)

	//Add Nodes
	for(var i = 0; i < nodes.length ; i++) {
		var node = nodes[i]
		//First, add a sphere to the scene
		var sphere_mesh = new THREE.Mesh(sphere_geometry, all_materials)
		THREE.GeometryUtils.setMaterialIndex(sphere_mesh.geometry, material_index)
		if(typeof node.position == 'undefined') //todo: REMOVE
			sphere_mesh.position = node.get_position(20.0)
		else
			sphere_mesh.position = node.position
		THREE.GeometryUtils.merge(all_geometry, sphere_mesh)
	}
}

App.prototype.build_spheres = function(network) {
	//Free existing Meshes
	if(this.sphere_mesh) {
		this.scene.remove(this.sphere_mesh)
	}

	var all_geometry = new THREE.Geometry()
	var materials_array = [
	//https://kuler.adobe.com/create/color-wheel/?base=2&rule=Triad&selected=2&name=My%20Kuler%20Theme&mode=rgb&rgbvalues=0.08418045607684588,0.41734359406654653,0.7,1,0.18727433882359856,0.15299668785889553,0.2202577943954941,0.6421043606594332,1,0.7646047552411358,0.8,0.09620623551639529,0.6707893832606259,0.7,0.11918045607684583&swatchOrder=0,1,2,3,4
		new THREE.MeshBasicMaterial({color: 0xFF3027}),
		new THREE.MeshBasicMaterial({color: 0x156AB2}),
		new THREE.MeshBasicMaterial({color: 0x38A4FF}),
		new THREE.MeshBasicMaterial({color: 0xC3CC19}),
		new THREE.MeshBasicMaterial({color: 0xABB21E}),
	]
	var all_materials = new THREE.MeshFaceMaterial(materials_array)

	//Add Regulatory nodes with first color
	var regulators = this.network.get_regulators()
	this.add_nodes_to_geometry(all_geometry, regulators, all_materials, 0)

	//Add Gene nodes with second color
	var genes = this.network.get_genes()
	this.add_nodes_to_geometry(all_geometry, genes, all_materials, 1)

	//Build Mesh and add to Scene
	this.sphere_mesh = new THREE.Mesh(all_geometry, all_materials)
	this.scene.add(this.sphere_mesh, 10.0)
}

App.prototype.build_lines = function(network) {
	//Free existing Meshes
	if(this.line_mesh) {
		this.scene.remove(this.line_mesh)
	}

	var edges = this.network.edges
	//New add lines with buffered geometry
	var num_points = edges.length * 2
	var line_geometry = new THREE.BufferGeometry()
	var material = new THREE.LineBasicMaterial({
		vertexColors: true,
		linewidth: 1,
	})

	var positions = new Float32Array(num_points * 3)
	var colors = new Float32Array(num_points * 3)
	line_geometry.attributes = {
		position: {
			itemSize: 3,
			array: positions,
		},
		color: {
			itemSize: 3,
			array: colors,
		},
	}

	var i = 0
	for(var index = 0; index < edges.length; index++) {
		var edge = edges[index]
		if(edge.regulator.highlighted || edge.gene.highlighted || this.draw_all) {

			positions[i + 0] = edge.gene.get_position(20.0).x
			positions[i + 1] = edge.gene.get_position(20.0).y
			positions[i + 2] = edge.gene.get_position(20.0).z

			positions[i + 3] = edge.regulator.get_position(20.0).x
			positions[i + 4] = edge.regulator.get_position(20.0).y
			positions[i + 5] = edge.regulator.get_position(20.0).z

			//console.log("edge.color: %s", edge.color.toString(16))
			if(edge.regulator.highlighted || edge.gene.highlighted) {
				var highlight_color = 0xFFFFFF
				set_rgb_color(colors, i, highlight_color)
				set_rgb_color(colors, i + 3, highlight_color)
			}
			else {
				set_rgb_color(colors, i, edge.color)
				set_rgb_color(colors, i + 3, edge.color)
			}
			i += 6
		}
	}

	this.line_mesh = new THREE.Line(line_geometry, material, THREE.LinePieces)
	this.scene.add(this.line_mesh)
}

App.prototype.highlight_node = function(node) {
	if(this.highlight_mesh) {
		this.scene.remove(this.highlight_mesh)
	}

	var material = new THREE.LineBasicMaterial({
		color: 0xFFFFFF,
		linewidth: 5,
	})

	var geometry = new THREE.Geometry()
	for(var i = 0; i < node.edges.length; i++) {
		var edge = node.edges[i]
		geometry.vertices.push(edge.regulator.position)
		geometry.vertices.push(edge.gene.position)
	}

	this.highlight_mesh = new THREE.Line(geometry, material)
	this.scene.add(this.highlight_mesh)
}

App.prototype.highlight_nodeset = function(nodeset) {
	if(this.highlight_mesh) {
		this.scene.remove(this.highlight_mesh)
	}

	var material = new THREE.LineBasicMaterial({
		color: 0xFFFFFF,
		linewidth: 5,
	})

	var geometry = new THREE.Geometry()
	for(var i = 0; i < nodeset.length; i++) {
		var node = nodeset[i]
		for(var j = 0; j < node.edges.length; j++) {
			var edge = node.edges[j]
			geometry.vertices.push(edge.regulator.position)
			geometry.vertices.push(edge.gene.position)
		}
	}

	this.highlight_mesh = new THREE.Line(geometry, material)
	this.scene.add(this.highlight_mesh)
}

App.prototype.build_node_tree = function(nodes) {
	var tree = {'core': 
		{'data':
			[]
		},
		'checkbox': {
			'keep_selected_style': false
		},
		'search': {
			'show_only_matches': true,
			'fuzzy': false,
		},
		'plugins': ['checkbox', 'search']
	}
	var data = tree.core.data
	//Add Regulators
	for(var i = 0; i < nodes.length; i++) {
		var node = nodes[i]
		var tree_node = {
			'id': node.name,
			'text': node.name,
			'state': {'opened': false, 'selected': false},
			'children': []
		}
		//Add connected Genes as child elements
		/*
		for(var j = 0; j < regulator.edges.length; j++) {
			var gene = regulator.edges[j].gene
			//node.children.push(gene.name)
		}
		*/
		data.push(tree_node)
	}
	return tree
}

App.prototype.setup_regulator_search = function() {
	//ahh the infamous this reference-keeper
	var self = this
	//Setup Regulator Search
	$('#jstree_regulators').on("changed.jstree", function (e, data) {
		//un-highlight all nodes
		self.network.clear_highlighted()
		var nodeset = []
		//console.log(data.selected)
		for(var i = 0; i < data.selected.length; i++) {
			var regulator_name = data.selected[i]
			var regulator = self.network.regulator_map[regulator_name]
			if(regulator) {
				console.log("Regulator '%s' selected", regulator_name)
				regulator.highlighted = true
				nodeset.push(regulator)
			}
		}
		//rebuild lines
		self.scene.remove(self.line_mesh)
		self.build_lines()
		self.highlight_nodeset(nodeset)
	})

	var to = false
	$('#regulator_search_box').keyup(function() {
		if(to) {
			clearTimeout(to)
		}
		to = setTimeout(function() {
			var v = $('#regulator_search_box').val()
			$('#jstree_regulators').jstree(true).search(v)
		})
	})
}

App.prototype.setup_gene_search = function() {
	//ahh the infamous this reference-keeper
	var self = this


	//Setup Gene Search
	$('#jstree_genes').on("changed.jstree", function (e, data) {
		//un-highlight all nodes
		self.network.clear_highlighted()
		var nodeset = []
		//console.log(data.selected)
		for(var i = 0; i < data.selected.length; i++) {
			var gene_name = data.selected[i]
			var gene = self.network.gene_map[gene_name]
			if(gene) {
				console.log("Gene '%s' selected", gene_name)
				gene.highlighted = true
				nodeset.push(gene)
			}
		}
		//rebuild lines
		self.scene.remove(self.line_mesh)
		self.build_lines()
		self.highlight_nodeset(nodeset)
	})

	var to2 = false
	$('#gene_search_box').keyup(function() {
		if(to2) {
			clearTimeout(to2)
		}
		to2 = setTimeout(function() {
			var v = $('#gene_search_box').val()
			$('#jstree_genes').jstree(true).search(v)
		})
	})
}

App.prototype.load_data = function(filename) {
	console.log("loading data from file '%s'", filename)

	//Load in data
	var self = this
	$.ajax({
		url: 'data/' + filename,
		data: {},
		success: function(data) {

			//Populate Network
			var table = self.parse_tab_data(data)
			self.network = new Network()
			self.network.init_from_table(table)

			console.log('score before: %f', self.network.score())
			self.network.reposition_regulators() //can optionally add self.scene for icosahedron display
			console.log('score after: %f', self.network.score())

			//self.network.iterate(100)
			//network.find_worst_regulator()
			//console.log('score after iterate: %f', self.network.score())

			//First add Spheres to the scene (nodes)
			self.build_spheres(self.network)

			//Next, add lines to the scene (edges)
			self.build_lines(self.network)

			//Fill search sidebar
			//self.set_table(self.network.get_regulators())

			//Setup jstree
			$('#jstree_regulators').empty().jstree('destroy')
			var regulators = self.network.get_regulators()
			var tree = self.build_node_tree(regulators)
			$('#jstree_regulators').jstree(tree)

			$('#jstree_genes').empty().jstree('destroy')
			var genes = self.network.get_genes()
			tree = self.build_node_tree(genes)
			$('#jstree_genes').jstree(tree)

			//setup search functionality
			self.setup_regulator_search()
			self.setup_gene_search()
		}
	})
}

App.prototype.init = function() {
	//http://threejs.org/docs/index.html#Manual/Introduction/Creating_a_scene
	this.scene = new THREE.Scene()
	camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000)
	camera.position.z = 30
	renderer = new THREE.WebGLRenderer({canvas: document.getElementById('canvas')} )
	renderer.setClearColor( 0x000000, 1)
	resize()
	//document.body.appendChild(renderer.domElement)

	//ahh the infamous this reference-keeper
	var self = this

	//Setup Search Tabs
	$(function() {
		$('#search_area').tabs()
	})

	this.load_data('UCEC.filtered.net')

	//add controls
	controls = new THREE.OrbitControls( camera );
	//controls.addEventListener( 'change', render );
}

App.prototype.resize = function() {

}

App.prototype.update = function() {

}

App.prototype.render = function() {
	renderer.render(this.scene, camera)
}