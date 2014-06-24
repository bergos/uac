var AndFilter = function(rdf, filters) {
	var self = this;

	self.filters = filters;

	self.filter = function(t) {
		for(var i=0; i<self.filters.length; i++) {
			if(!self.filters[i].filter(t))
				return false;
		}

		return true;
	};
};


var SimpleFilter = function(rdf, subject, predicate, object) {
	var self = this;

	self.subject = subject;
	self.predicate = predicate;
	self.object = object;

	self.filter = function(t) {
		var nodeTest = function(node, nodes) {
			if(nodes.length == 0)
				return true;

			for(var i=0; i<nodes.length; i++) {
				if(node.equals(nodes[i]))
					return true;
			}

			return false;
		};

		if(!nodeTest(t.subject, self.subject)) return false;
		if(!nodeTest(t.predicate, self.predicate)) return false;
		if(!nodeTest(t.object, self.object)) return false;

		return true;
	};
};


module.exports.AndFilter = AndFilter;
module.exports.SimpleFilter = SimpleFilter;