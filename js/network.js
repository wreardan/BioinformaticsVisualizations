/*
Networking Utilities
	used to build a network from a list of edges
	basically a graph
		weights associated with some cases

Contains the following classes:
	Network
		Gene
		Regulator
		Edge

A refactor is proposed to look like this:
	Network:
		Edge
		NetworkNode (parent)
			Gene
			Regulator

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
}

//Gene Class
function Gene(name) {
	this.name = name
	this.index = Gene.index++
	this.position = random_point_on_sphere(20.0)
	this.edges = []
	this.cluster = null
}
Gene.index = 0

Gene.prototype.add_edge = function(edge) {
	this.edges.push(edge)
}

Gene.prototype.get_random_regulator = function() {
	var index = random_int(this.edges.length)
	var edge = this.edges[index]
	
}

Gene.prototype.get_highest_regulator = function() {
	//find the highest regulator
	var highest_regulator = null
	var highest_weight = 0.0
	for(var i = 0; i < this.edges.length; i++) {
		var edge = this.edges[i]
		if(edge.weight > highest_weight) {
			highest_regulator = edge.regulator
			highest_weight = edge.weight
		}
	}
	return highest_regulator
}

Gene.prototype.get_position = function(radius) {
	//convert spherical to regular coords
	//return spherical_to_cartesian(this.spherical_coords, radius)
	return this.position
}

//reposition gene according to highest regulator
Gene.prototype.reposition = function(changed_regulator) {
	var regulator = this.get_highest_regulator()
	if(changed_regulator && changed_regulator !== regulator) {
		return
	}
	var new_coords = random_point_on_sphere(0.5)
	this.position.addVectors(regulator.position, new_coords)
}

//Regulator Class
function Regulator(name) {
	this.name = name
	this.index = Regulator.index++
	//this.spherical_coords = random_spherical_coords()
	this.position = random_point_on_sphere(20.0)
	this.edges = []
	this.color = random_rgb_color()
}
Regulator.index = 0

Regulator.prototype.get_position = function(radius) {
	//convert spherical to regular coords
	//return spherical_to_cartesian(this.spherical_coords, radius)
	return this.position
}

Regulator.prototype.add_edge = function(edge) {
	this.edges.push(edge)
}

//reposition genes associated with this Regulator
Regulator.prototype.reposition_genes = function() {
	for(var i = 0; i < this.edges.length; i++) {
		var gene = this.edges[i].gene
		gene.reposition(this)
	}
}

Regulator.prototype.get_genes = function() {
	var genes = []
	for(var i = 0; i < this.edges.length; i++) {
		var edge = this.edges[i]
		genes.push(edge.gene)
	}
	return genes
}

//return a list of unique regulators associated with this.genes
Regulator.prototype.get_regulators = function() {
	var regulators = []
	//Travel through edges
	for(var i = 0; i < this.edges.length; i++) {
		var gene = this.edges[i].gene
		for(var j = 0; j < gene.edges.length; j++) {
			var regulator = gene.edges[j].regulator
			if(regulators.indexOf(regulator.name) == -1) {
				regulators.push(regulator.name)
			}
		}
	}
	return regulators
}

Regulator.prototype.get_common_regulator = function() {
	var regulators = {}
	//Count number of regulators found in genes
	//associated with this Regulator
	for(var i = 0; i < this.edges.length; i++) {
		var gene = this.edges[i].gene
		for(var j = 0; j < gene.edges.length; j++) {
			var regulator = gene.edges[j].regulator
			var name = regulator.name
			if(!regulators[name]) {
				regulators[name] = 0
			}
			var distance = gene.position.distanceTo(regulator.position)
			regulators[name] += distance
		}
	}
	//Find the highest count
	var max_count = 0
	var highest = null
	for(var name in regulators) {
		var count = regulators[name]
		if(count > max_count) {
			highest = name
		}
	}
	return highest
}

//Score regulator based on edge distances
Regulator.prototype.score = function() {
	var total_distance = 0.0
	for(var i = 0; i < this.edges.length; i++) {
		var edge = this.edges[i]
		var gene_pos = edge.gene.position
		var distance = this.position.distanceTo(gene_pos)
		total_distance += distance
	}
	return total_distance
}

//Edge Class
function Edge(regulator, gene, weight, color) {
	this.regulator = regulator
	this.gene = gene
	this.weight = weight
	this.color = color
}

//Network Class
function Network() {
	this.gene_map = {}
	this.num_genes = 0
	this.regulator_map = {}
	this.num_regulators = 0
	this.edges = []
	this.iso_positions = null
	this.radius = 20.0
}

Network.prototype.init_from_table = function(table) {

	for(var i = 0; i < table.length; i++) {
		var row = table[i]
		var regulator_name = row[0]
		var gene_name = row[1]
		var weight = row[2]

		this.add(gene_name, regulator_name, weight)
	}
}

Network.prototype.build_iso_sphere_positions = function(radius, elements, scene) {
	//Build an icosahedron sphere by subdivision with a minimum number of vertices
	var iso_sphere_geometry
	var detail = 0
	do {
		iso_sphere_geometry = new THREE.IcosahedronGeometry(radius, detail)
		detail++
	} while(iso_sphere_geometry.vertices.length < elements)

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

Network.prototype.reposition_regulators = function(scene) {
	//Build iso positions if not already
	if(!this.iso_positions) { //todo: check length <
		this.build_iso_sphere_positions(this.radius, this.num_regulators, scene)
	}
	//set used flag to false
	var position_list = []
	for(var i = 0; i < this.iso_positions.length; i++) {
		//this.iso_positions[i].used = false
		position_list.push(i)
	}
	//randomly? assign regulators to iso_positions
	for(var key in this.regulator_map) {
		var regulator = this.regulator_map[key]
		var position_list_index = random_int(position_list.length)
		var position_index = position_list[position_list_index]
		var position = this.iso_positions[position_index]
		position_list.splice(position_list_index, 1)
		regulator.position.copy(position)
	}
	//reposition associated genes
	this.reposition_genes()
}

Network.prototype.swap_positions = function(reg1, reg2) {
	//swap positions
	var temp = reg1.position
	reg1.position = reg2.position
	reg2.position = temp

	//update genes
	reg1.reposition_genes()
	reg2.reposition_genes()
}

Network.prototype.swap_regulators = function(regulators, num) {
	var swaps = []
	for(var i = 0; i < num; i++) {
		var pos1 = random_int(this.num_regulators)
		var reg1 = regulators[pos1]
		var pos2 = random_int(this.num_regulators)
		var reg2 = regulators[pos2]

		this.swap_positions(reg1, reg2)

		swaps.push([reg1, reg2])
	}
	return swaps
}

Network.prototype.do_swaps = function(swaps) {
	for(var i = 0; i < swaps.length; i++) {
		var swap = swaps[i]
		this.swap_positions(swap[0], swap[1])
	}
}

Network.prototype.reposition_genes = function() {
	//for each gene
	for(var key in this.gene_map) {
		var gene = this.gene_map[key]
		gene.reposition()
	}
}

/*
Score the network according to the distance
lower is better
sum(edge_distances)
edge_distance = sqrt(gene, regulator)
*/
Network.prototype.score = function() {
	var distance_sum = 0.0
	for(var i = 0; i < this.edges.length; i++) {
		var edge = this.edges[i]
		var gene_pos = edge.gene.position
		var reg_pos = edge.regulator.position
		var edge_distance = gene_pos.distanceTo(reg_pos)
		distance_sum += edge_distance
	}
	return distance_sum
}

Network.prototype.find_worst_regulator = function(regulators) {
	var worst = null
	var high_score = 0
	for(var i = 0; i < regulators.length; i++) {
		var regulator = regulators[i]
		var score = regulator.score()
		if(score > high_score) {
			worst = regulator
			high_score = score
		}
	}
	//console.log('worst regulator: %s, score: %f', worst.name, high_score)
	return worst
}

Network.prototype.find_closest_regulator = function(target) {
	var closest = null
	var min_distance = 1000000
	for(var key in this.regulator_map) {
		var regulator = this.regulator_map[key]
		if(regulator != target) {
			var distance = target.position.distanceTo(regulator.position)
			if(distance < min_distance) {
				min_distance = distance
				closest = regulator
			}
		}
	}
	return closest
}

function ps(p) {
	var x = Math.floor(p.x)
	var y = Math.floor(p.y)
	var z = Math.floor(p.z)
	return '(' + x + ',' + y + ',' + z + ')'
}

Network.prototype.iterate_slow = function(num_iterations) {
	var low_score = this.score()
	for(var i = 0; i < num_iterations; i++) {
		for(var key in this.regulator_map) {
			var regulator = this.regulator_map[key]
			var closest = this.find_closest_regulator(regulator)
			var common_name = regulator.get_common_regulator()
			var common = this.regulator_map[common_name]
			this.swap_positions(common, closest)
/*
			console.log("closing '%s': swapping '%s' and '%s'",
				regulator.name, closest.name, common_name)
			console.log('positions: %s,%s,%s', ps(regulator.position), 
				ps(closest.position), ps(common.position))
*/
			var score = this.score()
			if(score < low_score) {
				low_score = score
			}
			else {
				this.swap_positions(common, closest)
			}
		}
	}
}

Network.prototype.iterate = function(num_iterations) {
	var regulators = this.get_regulators()
	var swapped = {}

	for(var i = 0; i < num_iterations; i++) {
		var worst = this.find_worst_regulator(regulators)
		var common_name = worst.get_common_regulator()
		var common = this.regulator_map[common_name]
		//console.log('score before swap: %f', worst.score())
		if(swapped[common_name]) {
			var closest = this.find_closest_regulator(common)
			this.swap_positions(worst, closest)
			swapped[worst.name] = true
		}
		else {
			var closest = this.find_closest_regulator(worst)
			this.swap_positions(common, closest)
			swapped[common_name] = true
		}
		console.log('%s: %s, %s', worst.name, common_name, closest.name)
		//console.log('score after swap: %f', worst.score())
		regulators.remove(worst)
	}
}

Network.prototype.iterate_simple = function(num_iterations) {
	var regulators = this.get_regulators()
	//todo: use hueristic
	var score = this.score()
	for(var i = 0; i < num_iterations; i++) {
		//randomly swap two regulators and see if it improved score
		var swaps = this.swap_regulators(regulators, 1)
		var new_score = this.score()
		if(new_score > score) {
			this.do_swaps(swaps) // undo the swaps if it raises the score
		}
	}
}

Network.prototype.add = function(gene_name, regulator_name, weight) {

	//Add Regulator to Gene
	var gene = this.gene_map[gene_name]
	if(!gene) {
		gene = new Gene(gene_name)
		this.gene_map[gene_name] = gene
		this.num_genes++
	}

	//Add gene to regulator
	var regulator = this.regulator_map[regulator_name]
	if(!regulator) {
		regulator = new Regulator(regulator_name)
		this.regulator_map[regulator_name] = regulator
		this.num_regulators++
	}

	//Add Edge
	var edge = new Edge(regulator, gene, weight, regulator.color)
	this.edges.push(edge)

	gene.add_edge(edge)
	regulator.add_edge(edge)
}

Network.prototype.get_genes = function() {
	var genes = []

	//add gene nodes
	for(var key in this.gene_map) {
		var gene = this.gene_map[key]
		genes.push(gene)
	}

	return genes
}

Network.prototype.clear_highlighted = function() {
	for(var key in this.regulator_map) {
		var regulator = this.regulator_map[key]
		regulator.highlighted = false
	}
	for(var key in this.gene_map) {
		var gene = this.gene_map[key]
		gene.highlighted = false
	}
}

Network.prototype.get_regulators = function() {
	var regulators = []
	//add gene nodes
	for(var key in this.regulator_map) {
		var regulator = this.regulator_map[key]
		regulators.push(regulator)
	}

	return regulators

}

Network.prototype.assign_gene_to_cluster = function(gene_name, cluster_id) {
	var gene = this.gene_map[gene_name]
	if(gene) {
		gene.cluster = cluster_id
	}
	else {
		throw("Cannot assign gene to cluster: Gene Not Found in Network: " + gene_name)
	}
}