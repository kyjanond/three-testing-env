function createBlob() {
	var geometry = new THREE.IcosahedronGeometry( 10, 5 );
	var n = new THREE.Vector3( 0, 0, 0 );
	for( var j = 0; j < geometry.vertices.length; j++ ) {
		var v = geometry.vertices[ j ];
		n.copy( v );
		n.normalize();
		var d = 10 + 3 * noise.noise( .1 * v.x, .1 * v.y, .1 * v.z ) + 5 * crinkly( .25 * v.x, .25 * v.y, .25 * v.z );
		n.multiplyScalar( d );
		v.copy( n );
	}
	
	geometry.verticesNeedUpdate = true;
    geometry.normalsNeedUpdate = true;
   	geometry.uvsNeedUpdate = true;
   	geometry.computeCentroids();
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    geometry.computeMorphNormals();
    geometry.computeTangents();
	return geometry;
}