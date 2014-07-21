//(c) 2014 Wesley Reardan
//UW-Madison Bioinformatics

//This file is to be run in node.js
//sudo apt-get install nodejs on Ubuntu
//Linux Packaged Example: nodejs ./node_force_directed.js network.tab clusters.tab output.tab
//Windows/Mac Example: node ./node_force_directed.js network.tab clusters.tab output.tab

//Include the FileSystem module
var fs = require('fs')

var THREE = require('three')

//Legacy style include
var util_script = fs.readFileSync('./js/util.js', 'utf8')
eval(util_script)
var network_script = fs.readFileSync('./js/network.js', 'utf8')
eval(network_script)

//Read Network
var network = new Network()

var network_filename = process.argv[2]
var network_data = fs.readFileSync(network_filename, 'utf8')
var network_table = parse_tab_data(network_data)
network.init_from_table(network_table)

//Get cluster assignments
var cluster_filename = process.argv[3]
var cluster_data = fs.readFileSync(cluster_filename, 'utf8')
var cluster_table = parse_tab_data(cluster_data)
network.init_clusters(cluster_table)

//Compute force-directed graph positions
network.reposition_clusters()
network.force_directed_layout()

//Dump positions
var output_filename = process.argv[4]
var positions = network.dump_positions()
fs.writeFileSync(output_filename, positions)

