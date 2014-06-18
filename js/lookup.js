function Lookup() {
	this.table = {}
}

Lookup.prototype = {
	add: function(value) {
		for(var i = 0; i < value.length; i++) {
			var substring = value.substring(0, i + 1)
			var list = this.table[substring]
			if(!list) {
				list = []
				this.table[substring] = list
			}
			if(list.indexOf(value) == -1) {
				list.push(value)
			}
		}
	}
	,
	get: function(value) {
		var list = this.table[value]
		if(list) {
			return list.sort() //necessary?
		}
	}
	,
	remove: function(value) {
		for(var i = 0; i < value.length; i++) {
			var substring = value.substring(0, i + 1)
			var list = this.table[substring]
			if(list) {
				var index = list.indexOf(value)
				if(index == 1) {
					list.remove(value)
				}
			}
		}
	}
	,
}

function test_Lookup() {
	var L = new Lookup()
	L.add('asdf')
	L.add('as')
	L.add('asd')
	L.add('das')
	L.add('dasd')
	L.remove('as')

	var actual = L.get('a')
	var expected = ['das']
	console.log(actual)
}
//test_Lookup()