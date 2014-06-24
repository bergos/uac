var uac = function(rdf) {
	var ns = require('./lib/namespace.js');
	var AccessControl = require('./lib/access-control.js');
	var Parser = require('./lib/parser.js');
	var Store = require('./lib/store.js');

	AccessControl = AccessControl.bind(null, rdf);
	Parser = Parser.bind(null, rdf);
	Store = Store.bind(null, rdf);

	return {
		ns: ns,
		AccessControl: AccessControl,
		Parser: Parser,
		Store: Store
	};
};


module.exports = uac;