var assert = require('assert');
var fs = require('fs');
var jsonld = require('jsonld');
//var rdf = require('rdf-interfaces');
var rdf = new (require('rdf_js_interface')).RDFEnvironment();
var uac = require('uac')(rdf);

require('rdf-ext')(rdf, {replaceMerge:true});


var Utils = {};

Utils.parseTurtleFile = function(filename, callback) {
	try {
		rdf.parseTurtle(fs.readFileSync(filename).toString(), callback);
	} catch(e) {
		callback(null);
	}
};

Utils.parseTurtleAccessControlFile = function(filename, callback) {
	Utils.parseTurtleFile(filename, function(graph) {
		var parser = new uac.Parser();
		var options = parser.parse(graph);
		var accessControl = new uac.AccessControl(options);

		callback(accessControl);
	});
};

Utils.compareGraph = function(a, b, callback) {
	if(a == null) a = rdf.createGraph();
	if(b == null) b = rdf.createGraph();

	rdf.serializeJsonLd(a, function(aJsonLd) {
		jsonld.normalize(aJsonLd, {format: 'application/nquads'}, function(error, aNormalized) {
			rdf.serializeJsonLd(b, function(bJsonLd) {
				jsonld.normalize(bJsonLd, {format: 'application/nquads'}, function(error, bNormalized) {
					callback(aNormalized == bNormalized);
				});
			});
		});
	});
};

Utils.initContext = function(graphFilename, acFilename, callback) {
	Utils.parseTurtleFile(graphFilename, function(graph) {
		Utils.parseTurtleAccessControlFile(acFilename, function(ac) {
			callback(graph, ac);
		});
	});
};

Utils.runReadTestCase = function(ac, iri, graph, requestedFile, agent, application, expectedFile, done) {
	Utils.parseTurtleFile(__dirname + '/support/' + requestedFile, function(requested) {
		ac.hasReadAccess(iri, graph, requested, agent, application, function(granted) {
			Utils.parseTurtleFile(__dirname + '/support/' + expectedFile, function(expected) {
				Utils.compareGraph(granted, expected, function(equals) {
					assert.ok(equals);
					done();
				});
			});
		});
	});
};

Utils.runWriteTestCase = function(ac, iri, graph, requestedFile, agent, application, expectedFile, done) {
	Utils.parseTurtleFile(__dirname + '/support/' + requestedFile, function(requested) {
		ac.hasWriteAccess(iri, graph, requested, agent, application, function(granted) {
			Utils.parseTurtleFile(__dirname + '/support/' + expectedFile, function(expected) {
				Utils.compareGraph(granted, expected, function(equals) {
					assert.ok(equals);
					done();
				});
			});
		});
	});
};

Utils.runDeleteTestCase = function(ac, iri, graph, requestedFile, agent, application, expectedFile, done) {
	Utils.parseTurtleFile(__dirname + '/support/' + requestedFile, function(requested) {
		ac.hasDeleteAccess(iri, graph, requested, agent, application, function(granted) {
			Utils.parseTurtleFile(__dirname + '/support/' + expectedFile, function(expected) {
				Utils.compareGraph(granted, expected, function(equals) {
					assert.ok(equals);
					done();
				});
			});
		});
	});
};

//TODO: earl reports (jsonld projects contains one)

describe('card access control', function() {
	var graph = null;
	var ac = null;
	var agent = 'https://www.bergnet.org/people/bergi/card#test1';

	before(function(done) {
		Utils.initContext(__dirname + '/support/card.ttl', __dirname + '/support/card.ac.ttl', function(_graph, _ac) {
			graph = _graph;
			ac = _ac;
			done();
		});
	});

	// read
	it('should grant partial access for #test1 of the complete graph', function(done) {
		Utils.runReadTestCase(ac, null, graph, null, agent, null, 'card.get1.out.ttl', done);
	});

	it('should not grant access for unknown agent #test11', function(done) {
		Utils.runReadTestCase(ac, null, graph, null, agent+'1', null, null, done);
	});

	it('should grant partial access for #test1 of the requested graph', function(done) {
		Utils.runReadTestCase(ac, null, graph, 'card.get3.in.ttl', agent, null, 'card.get3.out.ttl', done);
	});

	// write
	it('should grant write access for #test1 for subgraph', function(done) {
		Utils.runWriteTestCase(ac, null, graph, 'card.post1.in.ttl', agent, null, 'card.post1.in.ttl', done);
	});

	it('should not grant write access for #test11 for subgraph', function(done) {
		Utils.runWriteTestCase(ac, null, graph, 'card.post2.in.ttl', agent+'1', null, null, done);
	});

	it('should not grant write access for #test1 for subgraph', function(done) {
		Utils.runWriteTestCase(ac, null, graph, 'card.post3.in.ttl', agent, null, null, done);
	});

	// delete
	it('should grant delete access for #test1 for subgraph', function(done) {
		Utils.runDeleteTestCase(ac, null, graph, 'card.delete1.in.ttl', agent, null, 'card.delete1.in.ttl', done);
	});

	it('should grant delete access for #test11 for subgraph', function(done) {
		Utils.runDeleteTestCase(ac, null, graph, 'card.delete2.in.ttl', agent+'1', null, null, done);
	});

	it('should grant delete access for #test1 for subgraph', function(done) {
		Utils.runDeleteTestCase(ac, null, graph, 'card.delete3.in.ttl', agent, null, null, done);
	});
});


describe('blog access control', function() {
	var graph = null;
	var ac = null;
	var agent = 'https://www.bergnet.org/people/bergi/card#test1';

	before(function(done) {
		Utils.initContext(__dirname + '/support/blog.ttl', __dirname + '/support/blog.ac.ttl', function(_graph, _ac) {
			graph = _graph;
			ac = _ac;
			done();
		});
	});

	// read
	it('should grant partial access for #test1 of the complete graph', function(done) {
		Utils.runReadTestCase(ac, null, graph, null, agent, null, 'blog.get1.out.ttl', done);
	});

	// write
	it('should grant write access for #test1 for subgraph', function(done) {
		Utils.runWriteTestCase(ac, null, graph, 'blog.post1.in.ttl', agent, null, 'blog.post1.out.ttl', done);
	});
});