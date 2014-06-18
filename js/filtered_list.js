function FilteredList() {
	this.parent_div = null
	this.search_box = null
	this.list = null
	this.elements = null
	this.subset = null
	this.lookup_table = null
}

FilteredList.prototype.set_subset = function(num_elements) {
	this.subset = []
	var N = Math.min(num_elements, this.elements.length)
	for(var i = 0; i < N; i++) {
		var element = this.elements[i]
		this.subset.push(element)
	}
}

FilteredList.prototype.init = function(parent_id, elements) {
	//Save element list
	this.elements = elements
	this.set_subset(100)

	//Get parent tag and create div
	this.parent_div = document.getElementById(parent_id)

	//Create search box and option list
	this.search_box = document.createElement('input')
	this.search_box.type = 'text'
	this.parent_div.appendChild(this.search_box)

	this.list = document.createElement('form')
	this.parent_div.appendChild(this.list)

	this.build_lookup_table()
	this.update_list()

	//Add event handler for search_box
	var self = this
	$(this.search_box).keyup(function() {
		var query = $(self.search_box).val().toUpperCase()
		console.log("filtering list based on '%s'", query)
		self.filter(query)
	})
}

FilteredList.prototype.build_lookup_table = function() {
	this.lookup_table = new Lookup()
	for(var i = 0; i < this.elements.length; i++) {
		var element = this.elements[i].toUpperCase()
		this.lookup_table.add(element)
	}
}

FilteredList.prototype.update_list = function() {
	$(this.list).empty()

	for(var i = 0; i < this.subset.length; i++) {
		var element = this.subset[i]
		var checkbox = document.createElement('input')
		checkbox.type = 'checkbox'
		checkbox.name = 'name'
		checkbox.value = 'value'
		checkbox.id = 'id'
		this.list.appendChild(checkbox)
		var gene_name_text = document.createTextNode(element)
		this.list.appendChild(gene_name_text)
		this.list.appendChild(document.createElement('br'))
	}
}

FilteredList.prototype.filter = function(query) {
	if(!query) {
		this.set_subset(100)
	}
	else {
		this.subset = this.lookup_table.get(query)
		this.update_list()
	}
}

FilteredList.prototype.search_list = function(search_query) {
	var results = []
	for(var i = 0; i < this.elements.length; i++) {
		var element = this.elements[i]
		if(element.indexOf(search_query) > -1) {
			results.push(element)
		}
	}
	return results
}