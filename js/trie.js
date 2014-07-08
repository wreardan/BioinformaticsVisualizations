/*
(C) Wesley Reardan 2014, Personal Library
Trie data structure used for fast lookup of strings based on prefix.
Implemented using a sibling-list
Lookup: log(n)
Insertion: log(n)
 */
function Trie() {
	this.sibling = null
	this.child = null
	this.value = null
}

Trie.prototype.add = function(value) {
	//console.log('Trie.add(%s), this.value= %s', value, this.value)

	var first_char = value[0]
	if(!this.value) {
		this.value = first_char
	}

	if(this.value == first_char) {
		var suffix = value.slice(1)
		if(suffix) {
			if(!this.child) {
				this.child = new Trie()
			}
			this.child.add(suffix)
		}
	}

	else {
		if(!this.sibling) {
			this.sibling = new Trie()
		}
		this.sibling.add(value)
	}
}

Trie.prototype.under = function(prefix) {
	if(!prefix) { prefix = '' }

	var result = []
	if(!this.child) {
		result.push(prefix + this.value)
	}

	if(this.sibling) {
		util.array_extend(result, this.sibling.under(prefix))
	}

	if(this.child) {
		util.array_extend(result, this.child.under(prefix + this.value))
	}

	return result
}

Trie.prototype.get = function(search, prefix) {
	if(!prefix) { prefix = '' }

	if(!search) {
		return this.under(prefix)
	}

	var first_char = search[0]
	if(this.value == first_char) {
		var suffix = search.slice(1)
		if(this.child) {
			return this.child.get(suffix, prefix + this.value)
		}
		else {
			return [prefix + this.value]
		}
	}
	else {
		if(this.sibling) {
			return this.sibling.get(search, prefix)
		}
		else {
			return []
		}
	}
}

Trie.prototype.display = function(prefix) {
	if(!prefix) { prefix = '' }

	console.log(prefix + this.value)
	if(this.child) {
		this.child.display(prefix + ' ')
	}
	if(this.sibling) {
		this.sibling.display(prefix)
	}
}

