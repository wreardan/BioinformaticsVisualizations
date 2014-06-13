/*
An application for the visual display of Network Models

 */

//Global variables
var camera, scene, renderer, controls
var spheres, splines, lines

var resize = function() {
	var width = Math.ceil(window.innerWidth * 0.80)
	camera.aspect = width / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize( width, window.innerHeight )

}

var onWindowResize = function () {
	resize()
	render()
}

var search_list = function() {
	app.search_list()
}

var init = function() {
	app = new App()
	app.init()

	window.addEventListener( 'resize', onWindowResize, false );
}

init()

var render = function () {
	requestAnimationFrame(render)

	//sphere.position.z -= 0.01
	app.render()
}

render()
