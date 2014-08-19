/*
Networking Utilities
	used to build a network from a list of edges
	basically a graph
		weights associated with some cases

Contains the following classes:
	Network:
		Edge
		NetworkNode (with type 'gene' or 'regulator')

(c) 2014 Wesley Reardan
UW-Madison Bioinformatics
*/

//This will be the parent class of Gene and Regulator
function NetworkNode(name, type) {
	this.name = name
	this.position = random_point_on_sphere(20.0)
	this.velocity = new THREE.Vector3()
	this.edges = []
	this.type = type
	this.cluster = null
	this.color = null
	this.highlighted = false
}

NetworkNode.prototype.add_edge = function(edge) {
	this.edges.push(edge)
}

//how to use:
//node.highest('gene')
//node.highest('regulator')
NetworkNode.prototype.highest = function(type) {
	//find the highest regulator
	var highest = null
	var highest_weight = 0.0
	for(var i = 0; i < this.edges.length; i++) {
		var edge = this.edges[i]
		if(edge.weight > highest_weight) {
			highest = edge[type]
			highest_weight = edge.weight
		}
	}
	return highest
}

NetworkNode.prototype.reposition = function(type) {
	var node = this.highest(type)
	var offset = random_point_on_sphere(0.5)
	this.position.addVectors(node.position, offset)
}

//An Edge in the Network
function NetworkEdge(regulator, gene, weight) {
	this.regulator = regulator
	this.gene = gene
	this.weight = weight
	this.color = 0xFFFFFF
}

//Undirected Weighted Network
function Network() {
	this.node_map = {}

	this.num_nodes = 0
	this.edges = []
	this.iso_positions = null
	this.radius = 20.0
	this.clusters = {}

	this.expression_data = null
}

//Initialize a Network from parsed data, each row is an edge in the network
Network.prototype.init_from_table = function(table) {

	for(var i = 0; i < table.length; i++) {
		var row = table[i]
		var regulator_name = row[0]
		var gene_name = row[1]
		var weight = row[2]

		this.add(gene_name, regulator_name, weight)
	}
}

//Initialize clusters from a data table: [gene_name, cluster_id]
Network.prototype.init_clusters = function(table) {
	for(var i = 0; i < table.length; i++) {
		var row = table[i]
		var gene_name = row[0]
		var cluster_id = row[1]
		this.assign_gene_to_cluster(gene_name, cluster_id)
	}
}

//Create a list of icosahedron postions that satisfies the constraint of
//being able to fit 'num_elements'
Network.prototype.build_iso_sphere_positions = function(radius, num_elements, scene) {
	//Build an icosahedron sphere by subdivision with a minimum number of vertices
	var iso_sphere_geometry
	var detail = 0
	do {
		iso_sphere_geometry = new THREE.IcosahedronGeometry(radius, detail)
		detail++
	} while(iso_sphere_geometry.vertices.length < num_elements)

	this.iso_positions = iso_sphere_geometry.vertices
	//console.log("detail: %d, length: %d",detail - 1,iso_sphere_geometry.vertices.length)
	//optionally add to Scene
	if(scene) {
		var material = new THREE.MeshBasicMaterial({
			wireframe: true,
			color: 'blue'
		})
		var mesh = new THREE.Mesh(iso_sphere_geometry, material)
		scene.add(mesh)
	}
}

Network.prototype.sphere_points = function(radius, N) {
	var width_segments = Math.ceil(Math.sqrt(N))
	var height_segments = Math.ceil(Math.sqrt(N))
	var difference = Math.PI / 16
	var sphere = new THREE.SphereGeometry(radius, width_segments, height_segments,
		0, Math.PI * 2, difference, Math.PI - 2 * difference)
	return sphere.vertices
}

function find_closest_position(position_list, position) {
	var min_distance = 100000000
	var min_position = null
	for(var i = 0; i < position_list.length; i++) {
		var distance = position.distanceTo(position_list[i])
		if(distance < min_distance) {
			min_distance = distance
			min_position = i
		}
	}
	return min_position
}

//Reposition genes into module formation
Network.prototype.reposition_clusters = function() {
	//var positions = this.sphere_points(this.radius, this.num_nodes)
	this.get_iso_positions()
	var positions = this.iso_positions

	for(var cluster in this.clusters) {
		var node_list = this.clusters[cluster]
		//position first node
		var first_node = node_list[0]
		var random_index = random_int(positions.length)
		first_node.position.copy(positions[random_index])
		positions.splice(random_index, 1)

		//position other nodes around first node
		for(var i = 1; i < node_list.length; i++) {
			var node = node_list[i]
			var position_index = find_closest_position(positions, first_node.position)
			var position = positions[position_index]
//			console.log('first_position: (%f,%f,%f), position: (%f,%f,%f), distance: %f',
//				first_node.position.x, first_node.position.y, first_node.position.z,
//				position.x, position.y, position.z,
//			console.log('%s:%s:%s: %f', cluster, node.name, node.type,
//				position.distanceTo(first_node.position)
//			)
			node.position.copy(position)
			positions.splice(position_index, 1)
		}
	}
}

//view-source:http://www.aaronvose.net/phytree3d/
/*
var FORCE_SCALE = 50.0
var GRAV_STRENGTH = 10.0
var BAND_STRENGTH = 0.001
*/
//http://en.wikipedia.org/wiki/Hooke's_law
//http://en.wikipedia.org/wiki/Coulomb%27s_law
var COULUMBS_CONSTANT = 8987551787.3681764

function hookes_law(node, BAND_STRENGTH, FORCE_SCALE) {
	var v = new THREE.Vector3()
	//Apply Hooke's Law (Spring) on edges
	for(var j = 0; j < node.edges.length; j++) {
		var edge = node.edges[j]
		//short hand for gene/regulator positions
		var rp = edge.regulator.position
		var gp = edge.gene.position
		//hooke's law
		//normalized vector from edge
		v.subVectors(gp, rp)
		v.normalize()
		//add to velocity
		var d = rp.distanceTo(gp)
		//Force = distance * constant (k)
		v.multiplyScalar(d*BAND_STRENGTH*FORCE_SCALE)
		node.velocity.add(v)
	}
}

Network.prototype.coulumbs_law = function(node, GRAV_STRENGTH, FORCE_SCALE) {
	var v = new THREE.Vector3()
	var total = new THREE.Vector3()
	//console.log('before %s', vec_to_string(node.velocity))
	//Apply Colulomb's Law against all OTHER nodes
	for(var other_name in this.node_map) {
		var other = this.node_map[other_name]
		//dont apply to ourself
		if(node.name != other.name) {
			//coulumb's law
			//get normalized vector between node and other
			v.subVectors(node.position, other.position)
			v.normalize()
			var d = node.position.distanceTo(other.position)
			//force = 1/distance^2 * k
			v.multiplyScalar(1.0 / (d*d) * GRAV_STRENGTH*FORCE_SCALE)
			total.add(v)
		}
	}
	//Normalize velocity by number of nodes
	total.divideScalar(this.num_nodes)
	node.velocity.add(total)
	//console.log('after %s', vec_to_string(node.velocity))
}

function vec_to_string(vector) {
	var result = '(' + vector.x + ', ' + vector.y + ', ' + vector.z + ')'
	return result
}

Network.prototype.apply_velocity = function() {
	for(var node_name in this.node_map) {
		var node = this.node_map[node_name]
		node.position.add(node.velocity)
		//console.log('position: ' + vec_to_string(node.position))
		//console.log('velocity: ' + vec_to_string(node.velocity))
	}
}

//Lay out the network as a Force-Directed Model
Network.prototype.force_directed_layout = function(num_iterations, force_scale, gravity_strength, band_strength) {
	//Multiple Iterations
	for(var i = 0; i < num_iterations; i++) {
		//For each Node in Graph:
		for(var name in this.node_map) {
			var node = this.node_map[name]
			hookes_law(node, band_strength, force_scale)
			this.coulumbs_law(node, gravity_strength, force_scale)
		}
		this.apply_velocity()
	}
}

Network.prototype.get_iso_positions = function(scene) {
	//Build iso positions if not already
	if(!this.iso_positions) { //todo: check length <
		var num_nodes = this.num_nodes * 2
		this.build_iso_sphere_positions(this.radius, num_nodes, scene)
	}
	var position_list = []
	for(var i = 0; i < this.iso_positions.length; i++) {
		position_list.push(i)
	}
	return position_list
}

//Reposition regulators randomly around an Icosahedron
Network.prototype.reposition_regulators = function(scene) {
	//randomly assign regulators to iso_positions
	var position_list = this.get_iso_positions(scene)
	for(var key in this.node_map) {
		var node = this.node_map[key]
		if(node.type == 'regulator') {
			var position_list_index = random_int(position_list.length)
			var position_index = position_list[position_list_index]
			var position = this.iso_positions[position_index]
			position_list.splice(position_list_index, 1)
			node.position.copy(position)
		}
	}
	//reposition associated genes
	this.reposition_genes()
}

//Reposition genes around the highest weight regulator
Network.prototype.reposition_genes = function() {
	for(var key in this.node_map) {
		var node = this.node_map[key]
		if(node.type == 'gene') {
			node.reposition('regulator')
		}
	}
}

//Add an edge to the network
Network.prototype.add = function(gene_name, regulator_name, weight) {
	//Add node to map
	var gene2 = this.node_map[gene_name]
	if(!gene2) {
		gene2 = this.node_map[gene_name] = new NetworkNode(gene_name, 'gene')
		this.num_nodes++
	}
	var regulator2 = this.node_map[regulator_name]
	if(regulator2) {
		regulator2.type = 'regulator'
	}
	else {
		regulator2 = this.node_map[regulator_name] = new NetworkNode(regulator_name, 'regulator')
		this.num_nodes++
	}
	//Add Edge
	var edge2 = new NetworkEdge(regulator2, gene2, weight)
	regulator2.add_edge(edge2)
	gene2.add_edge(edge2)
	this.edges.push(edge2)
}

//Get nodes of 'type' from Network
Network.prototype.get = function(type) {
	var nodes = []

	//add gene nodes
	for(var key in this.node_map) {
		var node = this.node_map[key]
		if(node.type == type) {
			nodes.push(node)
		}
	}

	return nodes
}

Network.prototype.get_node_names = function() {
	var node_names = []
	for(var key in this.node_map) {
		node_names.push(key)
	}
	return node_names
}

//Clear the highlighted flag from all nodes
Network.prototype.clear_highlighted = function() {
	for(var key in this.node_map) {
		var node = this.node_map[key]
		node.highlighted = false
	}
}

//Assigns a gene a cluster id
Network.prototype.assign_gene_to_cluster = function(gene_name, cluster_id) {
	//Change cluster id of gene/regulator
	var node = this.node_map[gene_name]
	if(node) {
		node.cluster = cluster_id

		//Add into cluster
		var cluster = this.clusters[cluster_id]
		if(!cluster) {
			cluster = this.clusters[cluster_id] = []
		}
		cluster.push(node)
	}
}

Network.prototype.get_cluster_ids = function(minimum_genes) {
	if(!minimum_genes) minimum_genes = 0

	var clusters = []

	for(var id in this.clusters) {
		var cluster = this.clusters[id]
		if(cluster.length > minimum_genes) {
			clusters.push(id)
		}
	}

	return clusters
}

Network.prototype.get_cluster = function(cluster_id) {
	return this.clusters[cluster_id]
}

Network.prototype.get_gene_names_in_cluster = function(cluster_id) {
	var nodes = this.clusters[cluster_id]
	var names = []
	for(var i = 0; i < nodes.length; i++) {
		var name = nodes[i].name
		names.push(name)
	}
	return names
}

Network.prototype.highlight_cluster = function(cluster_id) {
	var cluster = this.clusters[cluster_id]
	if(!cluster) {
		throw('cluster not found: ' + cluster_id)
	}

	for(var i = 0; i < cluster.length; i++) {
		var node = cluster[i]
		node.highlighted = true
	}
}

//output Network positions to tab-seperated string
//Gene	X_Position	Y_Position	Z_Position
Network.prototype.dump_positions = function() {
	var result = []
	for(var key in this.node_map) {
		var node = this.node_map[key]
		var row = node.name + '\t' + node.position.x + '\t' + node.position.y + '\t' + node.position.z
		result.push(row)
	}
	return result.join('\n')
}

//Load in positions from a table
//Gene	X_Position	Y_Position	Z_Position
Network.prototype.load_positions = function(table) {
	for(var i = 0; i < table.length; i++) {
		var row = table[i]
		var name = row[0]
		var x = new Number(row[1])
		var y = new Number(row[2])
		var z = new Number(row[3])

		var gene = this.node_map[name]
		gene.position.set(x, y, z)
	}
}

//Load expression data for the network in from a file
//TODO: move to App (more appropriate location)
Network.prototype.load_expression_data = function(filename) {
	//Load in expression data
	var expression_data = new ExpressionData()

	var self = this
	expression_data.load_file(filename, function() {
		self.update_expression(1)
	})

	this.expression_data = expression_data
}

Network.prototype.update_expression = function(cluster_id) {
	var canvas = document.getElementById('expression_canvas')
	var context = canvas.getContext('2d')
	var gene_names = this.get_gene_names_in_cluster(cluster_id)
	this.expression_data.draw(canvas, context, gene_names)
}