/*
General Utility Functions:
	Color:
		convert_int_to_bytes(int)
		set_rgb_color(colors, index, color)
	Spherical:
		point_on_circle(radians, radius, center_x, center_y)
		random_rgb_color()
		random_spherical_coords()
		perturb_spherical_coords(coords, scalar)
		spherical_to_cartesian(coords, radius)
		interpolate_spherical_coords(a, b, t)
		random_point_on_sphere(radius)
	Misc:
		random_int(max)
*/

//http://stackoverflow.com/questions/8482309/converting-javascript-integer-to-byte-array-and-back
var convert_int_to_bytes = function(/*long*/long) {
    // we want to represent the input as a 4-bytes array
    var byteArray = [0, 0, 0, 0];

    for ( var index = 0; index < byteArray.length; index ++ ) {
        var byte = long & 0xff;
        byteArray [ index ] = byte;
        long = (long - byte) / 256 ;
    }

    return byteArray;
};

var set_rgb_color = function(colors, index, color) {
	var bytes = convert_int_to_bytes(color)
	var r = bytes[0] / 255.0
	var g = bytes[1] / 255.0
	var b = bytes[2] / 255.0
	colors[index + 0] = r
	colors[index + 1] = g
	colors[index + 2] = b
	//console.log("r: %f, g: %f, b: %f", r, g, b)
}


//http://stackoverflow.com/questions/5300938/calculating-the-position-of-points-in-a-circle
//	sphere.position = point_on_circle(2 * Math.PI * i / (num_spheres - 1.0), 20.0)
var point_on_circle = function(radians, radius, center_x, center_y) {
	//default parameters
	radius = typeof radius !== 'undefined' ? radius : 1.0
	center_x = typeof center_x !== 'undefined' ? radius : 0.0
	center_y = typeof center_y !== 'undefined' ? radius : 0.0

	var position = {}
	position.x = radius * Math.cos(radians) + center_x
	position.y = radius * Math.sin(radians) + center_y
	position.z = 0.0
	return position
}
var random_rgb_color = function() {
	return Math.floor(Math.random()*0xffffff)
}
var random_spherical_coords = function() {
	//http://mathworld.wolfram.com/SpherePointPicking.html
	var u = Math.random()
	var v = Math.random()
	var theta = 2 * Math.PI * u
	var phi = Math.acos(2*v - 1)
	return {theta: theta, phi: phi}
}
var perturb_spherical_coords_crap = function(coords, scalar) {
	var u = Math.random()
	var v = 1.0 - u
	u -= 0.5
	v -= 0.5
	var theta = coords.theta + u * scalar
	var phi = coords.phi + v * scalar
	return {theta: theta, phi: phi}
}
var perturb_spherical_coords = function(coords, scalar) {
	var offset = random_spherical_coords()
	offset.theta -= Math.PI
	offset.phi -= Math.PI/2
	offset.theta *= scalar
	offset.phi *= scalar
	offset.theta += coords.theta
	offset.phi += coords.phi
	return offset
}
var spherical_to_cartesian = function(coords, radius) {
	radius = typeof radius !== 'undefined' ? radius : 1.0

	var theta = coords.theta
	var phi = coords.phi
	//http://mathworld.wolfram.com/SphericalCoordinates.html
	var x = radius * Math.cos(theta) * Math.sin(phi)
	var y = radius * Math.sin(theta) * Math.sin(phi)
	var z = radius * Math.cos(phi)
	return new THREE.Vector3(x, y, z)
}
//this function may be wrong!!!!!!
var cartesian_to_spherical = function(vector) {
	var x = vector.x, y = vector.y, z = vector.z

	var result = {}
	result.radius = Math.sqrt(x*x + y*y + z*z)
	result.theta = Math.atan(y * 1.0 / x)
	result.phi = Math.acos(z * 1.0 / result.radius)
	return result
}
//Interpolate from spherical coordinates a to b over [0.0 to 1.0]
var interpolate_spherical_coords = function(a, b, t) {
	var theta = a.theta + (b.theta - a.theta) * t
	var phi = a.phi + (b.phi - a.phi) * t
	return {theta: theta, phi: phi}
}
/*
var coord1 = {theta: -1.0, phi: -1.0}
var coord2 = {theta: 1.0, phi: 2.0}
var r1 = interpolate_spherical_coords(coord1, coord2, 0.0)
console.log(r1)
var r2 = interpolate_spherical_coords(coord1, coord2, 0.5)
console.log(r2)
var r3 = interpolate_spherical_coords(coord1, coord2, 1.0)
console.log(r3)
*/
//pick a random point on a (radius)-sized sphere
var random_point_on_sphere = function(radius) {
	//default value for radius
	radius = typeof radius !== 'undefined' ? radius : 1.0

	var coords = random_spherical_coords()
	return spherical_to_cartesian(coords, radius)
}
//picks a random point from -scale/2 to scale/2 for x,y,z
var random_point = function(scale) {
	if(!scale) scale = 1.0
	var x = Math.floor(Math.random() * scale) - scale/2.0
	var y = Math.floor(Math.random() * scale) - scale/2.0
	var z = Math.floor(Math.random() * scale) - scale/2.0
	var point = new THREE.Vector3(x,y,z)
	return point
}
//Random integer
var random_int = function(max) {
	return Math.floor(Math.random() * max)
}
//Convert an object to a list
var object_to_list = function(object) {
	var result = []
	for(var key in object) {
		result.push(object[key])
	}
	return result
}
//Remove object from array
Array.prototype.remove = function(object) {
	do {
		var index = this.indexOf(object)
		if(index > -1) {
			this.splice(index, 1)
		}
	} while(index > -1)
}
Array.prototype.extend = function(other) {
	for(var i = 0; i < other.length; i++) {
		var element = other[i]
		this.push(element)
	}
}