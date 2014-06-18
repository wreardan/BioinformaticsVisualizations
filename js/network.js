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
}

//Undirected Weighted Network
function Network() {
	this.node_map = {}

	this.num_nodes = 0
	this.edges = []
	this.iso_positions = null
	this.radius = 20.0
	this.clusters = {}
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

//Reposition regulators randomly around an Icosahedron
Network.prototype.reposition_regulators = function(scene) {
	//Build iso positions if not already
	if(!this.iso_positions) { //todo: check length <
		this.build_iso_sphere_positions(this.radius, this.num_nodes, scene)
	}
	//set used flag to false
	var position_list = []
	for(var i = 0; i < this.iso_positions.length; i++) {
		//this.iso_positions[i].used = false
		position_list.push(i)
	}
	//randomly? assign regulators to iso_positions
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