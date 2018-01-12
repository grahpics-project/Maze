
THREE.MTLLoader = function ( manager ) {
    this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;
};
THREE.MTLLoader.prototype = {  //mtlloader的方法
    constructor: THREE.MTLLoader,
    load: function ( url, onLoad, onProgress, onError ) {
        var scope = this;
        var loader = new THREE.FileLoader( this.manager );
        loader.setPath( this.path );
        loader.load( url, function ( text ) {
            onLoad( scope.parse( text ) );
        }, onProgress, onError );
    },
    setPath: function ( path ) {  //赋值path
        this.path = path;
    },
    setTexturePath: function ( path ) {  //赋值
        this.texturePath = path;
    },
    setBaseUrl: function ( path ) {
        console.warn( 'THREE.MTLLoader: .setBaseUrl() is deprecated. Use .setTexturePath( path ) for texture path or .setPath( path ) for general base path instead.' );
        this.setTexturePath( path );
    },
    setCrossOrigin: function ( value ) {
        this.crossOrigin = value;
    },
    parse: function ( text ) {
        var lines = text.split( '\n' );
        var info = {};
        var delimiter_pattern = /\s+/;
        var materialsInfo = {};
        for ( var i = 0; i < lines.length; i ++ ) {
            var line = lines[ i ];
            line = line.trim();
            if ( line.length === 0 || line.charAt( 0 ) === '#' ) {  //跳过注释和空行
                continue;
            }
            var pos = line.indexOf( ' ' ); //找到一行中空格的位置
            var key = ( pos >= 0 ) ? line.substring( 0, pos ) : line;
            key = key.toLowerCase();
            var value = ( pos >= 0 ) ? line.substring( pos + 1 ) : '';
            value = value.trim();
            if ( key === 'newmtl' ) {   //如果是新的mtl
                info = { name: value };
                materialsInfo[ value ] = info;
            } else if ( info ) {
                if ( key === 'ka' || key === 'kd' || key === 'ks' ) {
                    var ss = value.split( delimiter_pattern, 3 );
                    info[ key ] = [ parseFloat( ss[ 0 ] ), parseFloat( ss[ 1 ] ), parseFloat( ss[ 2 ] ) ];
                } else {
                    info[ key ] = value;
                }
            }
        }
        var materialCreator = new THREE.MTLLoader.MaterialCreator( this.texturePath || this.path, this.materialOptions );
        materialCreator.setCrossOrigin( this.crossOrigin );
        materialCreator.setManager( this.manager );
        materialCreator.setMaterials( materialsInfo );
        return materialCreator;
    }
};
THREE.MTLLoader.MaterialCreator = function ( baseUrl, options ) {  //创建材质
    this.baseUrl = baseUrl;
    this.options = options;
    this.materialsInfo = {};
    this.materials = {};
    this.nameLookup = {};
    this.side = ( this.options && this.options.side ) ? this.options.side : THREE.FrontSide;
    this.wrap = ( this.options && this.options.wrap ) ? this.options.wrap : THREE.RepeatWrapping;
};
THREE.MTLLoader.MaterialCreator.prototype = {
    constructor: THREE.MTLLoader.MaterialCreator,
    crossOrigin: 'Anonymous',
    setCrossOrigin: function ( value ) {
        this.crossOrigin = value;
    },
    setManager: function ( value ) {
        this.manager = value;
    },
    setMaterials: function ( materialsInfo ) {
        this.materialsInfo = this.convert( materialsInfo );
        this.materials = {};
        this.nameLookup = {};
    },
    convert: function ( materialsInfo ) {
        if ( ! this.options ) return materialsInfo;
        var converted = {};
        for ( var mn in materialsInfo ) {
            var mat = materialsInfo[ mn ];
            var covmat = {};
            converted[ mn ] = covmat;
            for ( var prop in mat ) {
                var save = true;
                var value = mat[ prop ];
                var lprop = prop.toLowerCase();
                switch ( lprop ) {
                    case 'kd':
                    case 'ka':
                    case 'ks':
                        if ( this.options && this.options.normalizeRGB ) {  //原来的值是0-1,这里把它转换成rgb
                            value = [ value[ 0 ] / 255, value[ 1 ] / 255, value[ 2 ] / 255 ];
                        }
                        if ( this.options && this.options.ignoreZeroRGBs ) {
                            if ( value[ 0 ] === 0 && value[ 1 ] === 0 && value[ 2 ] === 0 ) {
                                save = false;
                            }
                        }
                        break;
                    default:
                        break;
                }
                if ( save ) {
                    covmat[ lprop ] = value;
                }
            }
        }
        return converted;
    },
    preload: function () {
        for ( var mn in this.materialsInfo ) {
            this.create( mn );
        }
    },
    getIndex: function ( materialName ) {
        return this.nameLookup[ materialName ];
    },
    create: function ( materialName ) {
        if ( this.materials[ materialName ] === undefined ) {
            this.createMaterial_( materialName );
        }
        return this.materials[ materialName ];
    },
    createMaterial_: function ( materialName ) {   //创建材质
        var scope = this;
        var mat = this.materialsInfo[ materialName ];
        var params = {
            name: materialName,
            side: this.side
        };
        function resolveURL( baseUrl, url ) { //对传入的url进行处理，使其标准化
            if ( typeof url !== 'string' || url === '' )
                return '';
            if ( /^https?:\/\//i.test( url ) ) return url;
            return baseUrl + url;
        }
        function setMapForType( mapType, value ) {
            if ( params[ mapType ] ) return;
            var texParams = {
                scale: new THREE.Vector2( 1, 1 ),
                offset: new THREE.Vector2( 0, 0 )
            };
            var items = value.split( /\s+/ );
            var pos;
            pos = items.indexOf( '-bm' );
            if ( pos >= 0 ) {
                matParams.bumpScale = parseFloat( items[ pos + 1 ] );
                items.splice( pos, 2 );
            }
            pos = items.indexOf( '-s' );
            if ( pos >= 0 ) {
                texParams.scale.set( parseFloat( items[ pos + 1 ] ), parseFloat( items[ pos + 2 ] ) );
                items.splice( pos, 4 );
            }
            pos = items.indexOf( '-o' );
            if ( pos >= 0 ) {
                texParams.offset.set( parseFloat( items[ pos + 1 ] ), parseFloat( items[ pos + 2 ] ) );
                items.splice( pos, 4 );
            }
            texParams.url = items.join( ' ' ).trim();
            var map = scope.loadTexture( resolveURL( scope.baseUrl, texParams.url ) );
            map.repeat.copy( texParams.scale );
            map.offset.copy( texParams.offset );
            map.wrapS = scope.wrap;
            map.wrapT = scope.wrap;
            params[ mapType ] = map;
        }
        for ( var prop in mat ) {
            var value = mat[ prop ];
            var n;
            if ( value === '' ) continue;
            switch ( prop.toLowerCase() ) {
                case 'kd': //漫反射光
                    params.color = new THREE.Color().fromArray( value );
                    break;
                case 'ks': //镜面反射光
                    params.specular = new THREE.Color().fromArray( value );
                    break;
                case 'map_kd':
                    setMapForType( "map", value );
                    break;
                case 'map_ks':
                    // Specular map
                    setMapForType( "specularMap", value );
                    break;
                case 'norm':
                    setMapForType( "normalMap", value );
                    break;
                case 'ns': //高光
                    params.shininess = parseFloat( value );
                    break;
                default:
                    break;
            }
        }
        this.materials[ materialName ] = new THREE.MeshPhongMaterial( params );
        return this.materials[ materialName ];
    },
    loadTexture: function ( url, mapping, onLoad, onProgress, onError ) {
        var texture;
        var loader = THREE.Loader.Handlers.get( url );
        var manager = ( this.manager !== undefined ) ? this.manager : THREE.DefaultLoadingManager;
        if ( loader === null ) {
            loader = new THREE.TextureLoader( manager );
        }
        if ( loader.setCrossOrigin ) loader.setCrossOrigin( this.crossOrigin );
        texture = loader.load( url, onLoad, onProgress, onError );
        if ( mapping !== undefined ) texture.mapping = mapping;
        return texture;
    }
};
/*

 obj

*/
THREE.OBJLoader = ( function () {
	var object_pattern = /^[og]\s*(.+)?/;  //o 和 g的匹配
	var material_library_pattern = /^mtllib /;  //mtllib的匹配
	var material_use_pattern = /^usemtl /;  //usemtl的匹配
	function ParserState() {
		var state = {
			objects: [],
			object: {},
			vertices: [],
			normals: [],
			colors: [],
			uvs: [],
			materialLibraries: [],
			startObject: function ( name, fromDeclaration ) {
				/*
				if ( this.object && this.object.fromDeclaration === false ) {
					this.object.name = name;
					this.object.fromDeclaration = ( fromDeclaration !== false );
					return;
				}*/
				if ( this.object && typeof this.object._finalize === 'function' ) {
					this.object._finalize( true );
				}
				this.object = {
					name: name || '',
					fromDeclaration: ( fromDeclaration !== false ),
					geometry: {
						vertices: [],
						normals: [],
						colors: [],
						uvs: []
					},
					materials: [],
					smooth: true,
					startMaterial: function ( name, libraries ) {
						var previous = this._finalize( false );
						if ( previous && ( previous.inherited || previous.groupCount <= 0 ) ) {
							this.materials.splice( previous.index, 1 );
						}
						var material = {
							index: this.materials.length,
							name: name || '',
							mtllib: ( Array.isArray( libraries ) && libraries.length > 0 ? libraries[ libraries.length - 1 ] : '' ),
							groupStart: ( previous !== undefined ? previous.groupEnd : 0 ),
							groupEnd: - 1,
							groupCount: - 1,
							inherited: false,
							clone: function ( index ) {
								var cloned = {
									index: ( typeof index === 'number' ? index : this.index ),
									name: this.name,
									mtllib: this.mtllib,
									groupStart: 0,
									groupEnd: - 1,
									groupCount: - 1,
									inherited: false
								};
								cloned.clone = this.clone.bind( cloned );
								return cloned;
							}
						};
						this.materials.push( material );
						return material;
					},
					currentMaterial: function () {
						if ( this.materials.length > 0 ) {
							return this.materials[ this.materials.length - 1 ];
						}
						return undefined;
					},
					_finalize: function () {
						var lastMultiMaterial = this.currentMaterial();
						if ( lastMultiMaterial && lastMultiMaterial.groupEnd === - 1 ) {
							lastMultiMaterial.groupEnd = this.geometry.vertices.length / 3;
							lastMultiMaterial.groupCount = lastMultiMaterial.groupEnd - lastMultiMaterial.groupStart;
							lastMultiMaterial.inherited = false;
						}
						return lastMultiMaterial;
					}
				};
				this.objects.push( this.object );
			},
			finalize: function () {
				if ( this.object && typeof this.object._finalize === 'function' ) {
					this.object._finalize( true );
				}
			},
			parseVertexIndex: function ( value, len ) {
				var index = parseInt( value, 10 ); //字符串转int
				return ( index >= 0 ? index - 1 : index + len / 3 ) * 3;
			},
			parseNormalIndex: function ( value, len ) {
				var index = parseInt( value, 10 );
				return ( index >= 0 ? index - 1 : index + len / 3 ) * 3;
			},
			parseUVIndex: function ( value, len ) {
				var index = parseInt( value, 10 );
				return ( index >= 0 ? index - 1 : index + len / 2 ) * 2;
			},
			addVertex: function ( a, b, c ) {
				var src = this.vertices;
				var dst = this.object.geometry.vertices;
				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );
				dst.push( src[ b + 0 ], src[ b + 1 ], src[ b + 2 ] );
				dst.push( src[ c + 0 ], src[ c + 1 ], src[ c + 2 ] );
			},
			addVertexLine: function ( a ) {
				var src = this.vertices;
				var dst = this.object.geometry.vertices;
				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );
			},
			addNormal: function ( a, b, c ) {
				var src = this.normals;
				var dst = this.object.geometry.normals;
				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );
				dst.push( src[ b + 0 ], src[ b + 1 ], src[ b + 2 ] );
				dst.push( src[ c + 0 ], src[ c + 1 ], src[ c + 2 ] );
			},
			addColor: function ( a, b, c ) {
				var src = this.colors;
				var dst = this.object.geometry.colors;
				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );
				dst.push( src[ b + 0 ], src[ b + 1 ], src[ b + 2 ] );
				dst.push( src[ c + 0 ], src[ c + 1 ], src[ c + 2 ] );
			},
			addUV: function ( a, b, c ) {
				var src = this.uvs;
				var dst = this.object.geometry.uvs;
				dst.push( src[ a + 0 ], src[ a + 1 ] );
				dst.push( src[ b + 0 ], src[ b + 1 ] );
				dst.push( src[ c + 0 ], src[ c + 1 ] );
			},
			addUVLine: function ( a ) {
				var src = this.uvs;
				var dst = this.object.geometry.uvs;
				dst.push( src[ a + 0 ], src[ a + 1 ] );
			},
			addFace: function ( a, b, c, ua, ub, uc, na, nb, nc ) {
				var vLen = this.vertices.length;
				var ia = this.parseVertexIndex( a, vLen );
				var ib = this.parseVertexIndex( b, vLen );
				var ic = this.parseVertexIndex( c, vLen );
				this.addVertex( ia, ib, ic );
				if ( ua !== undefined ) {
					var uvLen = this.uvs.length;
					ia = this.parseUVIndex( ua, uvLen );
					ib = this.parseUVIndex( ub, uvLen );
					ic = this.parseUVIndex( uc, uvLen );
					this.addUV( ia, ib, ic );
				}
				if ( na !== undefined ) {
					// Normals are many times the same. If so, skip function call and parseInt.
					var nLen = this.normals.length;
					ia = this.parseNormalIndex( na, nLen );
					ib = na === nb ? ia : this.parseNormalIndex( nb, nLen );
					ic = na === nc ? ia : this.parseNormalIndex( nc, nLen );
					this.addNormal( ia, ib, ic );
				}
				if ( this.colors.length > 0 ) {
					this.addColor( ia, ib, ic );
				}
			},
			addLineGeometry: function ( vertices, uvs ) {
				this.object.geometry.type = 'Line';
				var vLen = this.vertices.length;
				var uvLen = this.uvs.length;
				for ( var vi = 0, l = vertices.length; vi < l; vi ++ ) {
					this.addVertexLine( this.parseVertexIndex( vertices[ vi ], vLen ) );
				}
				for ( var uvi = 0, l = uvs.length; uvi < l; uvi ++ ) {
					this.addUVLine( this.parseUVIndex( uvs[ uvi ], uvLen ) );
				}
			}
		};
		state.startObject( '', false );
		return state;
	}
	function OBJLoader( manager ) {
		this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;
		this.materials = null;
	}
	OBJLoader.prototype = { //objloader的一些方法
		constructor: OBJLoader,
		load: function ( url, onLoad, onProgress, onError ) {
			var scope = this;
			var loader = new THREE.FileLoader( scope.manager );
			loader.setPath( this.path );
			loader.load( url, function ( text ) {
				onLoad( scope.parse( text ) );
			}, onProgress, onError );
		},
		setPath: function ( value ) {
			this.path = value;
		},
		setMaterials: function ( materials ) {
			this.materials = materials;
			return this;
		},
		parse: function ( text ) { //解析字符串
			console.time( 'OBJLoader' );
			var state = new ParserState();
			if ( text.indexOf( '\r\n' ) !== - 1 ) {
				text = text.replace( /\r\n/g, '\n' );
			}
			if ( text.indexOf( '\\\n' ) !== - 1 ) {
				text = text.replace( /\\\n/g, '' );
			}
			var lines = text.split( '\n' );
			var line = '', lineFirstChar = '';
			var lineLength = 0;
			var result = [];
			var trimLeft = ( typeof ''.trimLeft === 'function' );
			for ( var i = 0; i < lines.length; i ++ ) {
				line = lines[ i ];
				line = trimLeft ? line.trimLeft() : line.trim();
				lineLength = line.length;
				if ( lineLength === 0 ) continue;
				lineFirstChar = line.charAt( 0 );
				if ( lineFirstChar === '#' ) continue;
				if ( lineFirstChar === 'v' ) {
					var data = line.split( /\s+/ );
					switch ( data[ 0 ] ) {
						case 'v':
							state.vertices.push(
								parseFloat( data[ 1 ] ),
								parseFloat( data[ 2 ] ),
								parseFloat( data[ 3 ] )
							);
							break;
						case 'vn':
							state.normals.push(
								parseFloat( data[ 1 ] ),
								parseFloat( data[ 2 ] ),
								parseFloat( data[ 3 ] )
							);
							break;
						case 'vt':
							state.uvs.push(
								parseFloat( data[ 1 ] ),
								parseFloat( data[ 2 ] )
							);
							break;
					}
				} else if ( lineFirstChar === 'f' ) {
					var lineData = line.substr( 1 ).trim();
					var vertexData = lineData.split( /\s+/ );
					var faceVertices = [];
					for ( var j = 0; j < vertexData.length; j ++ ) {
						var vertex = vertexData[ j ];
						if ( vertex.length > 0 ) {
							var vertexParts = vertex.split( '/' );
							faceVertices.push( vertexParts );
						}
					}
					// 在第一个点和其他点之间画线,形成边
					var v1 = faceVertices[ 0 ];
					for ( var j = 1; j < faceVertices.length - 1; j ++ ) {
						var v2 = faceVertices[ j ];
						var v3 = faceVertices[ j + 1 ];
						state.addFace(
							v1[ 0 ], v2[ 0 ], v3[ 0 ],
							v1[ 1 ], v2[ 1 ], v3[ 1 ],
							v1[ 2 ], v2[ 2 ], v3[ 2 ]
						);
					}
				} else if ( lineFirstChar === 'l' ) {
					var lineParts = line.substring( 1 ).trim().split( " " );
					var lineVertices = [], lineUVs = [];
					if ( line.indexOf( "/" ) === - 1 ) {
						lineVertices = lineParts;
					} else {
						for ( var li = 0; li < lineParts.length; li ++ ) {
							var parts = lineParts[ li ].split( "/" );
							if ( parts[ 0 ] !== "" ) lineVertices.push( parts[ 0 ] );
							if ( parts[ 1 ] !== "" ) lineUVs.push( parts[ 1 ] );
						}
					}
					state.addLineGeometry( lineVertices, lineUVs );
				} else if ( ( result = object_pattern.exec( line ) ) !== null ) {
					var name = ( " " + result[ 0 ].substr( 1 ).trim() ).substr( 1 );
					state.startObject( name );
				} else if ( material_use_pattern.test( line ) ) { //材料
					state.object.startMaterial( line.substring( 7 ).trim(), state.materialLibraries );
				} else if ( material_library_pattern.test( line ) ) { //mtl文件
					state.materialLibraries.push( line.substring( 7 ).trim() );
				} else if ( lineFirstChar === 's' ) {
					result = line.split( ' ' );
					if ( result.length > 1 ) {
						var value = result[ 1 ].trim().toLowerCase();
						state.object.smooth = ( value !== '0' && value !== 'off' );
					} else {
						state.object.smooth = true;
					}
					var material = state.object.currentMaterial();
					if ( material ) material.smooth = state.object.smooth;
				} else {  //处理异常情况
					if ( line === '\0' ) continue;
					throw new Error( 'THREE.OBJLoader: Unexpected line: "' + line + '"' );
				}
			}
			state.finalize();
			var container = new THREE.Group();
			container.materialLibraries = [].concat( state.materialLibraries );
			for ( var i = 0, l = state.objects.length; i < l; i ++ ) {
				var object = state.objects[ i ];
				var geometry = object.geometry;
				var materials = object.materials;
				var isLine = ( geometry.type === 'Line' );
				if ( geometry.vertices.length === 0 ) continue;
				var buffergeometry = new THREE.BufferGeometry();
				buffergeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( geometry.vertices, 3 ) );
				if ( geometry.normals.length > 0 ) {
					buffergeometry.addAttribute( 'normal', new THREE.Float32BufferAttribute( geometry.normals, 3 ) );
				} else {
					buffergeometry.computeVertexNormals();
				}
				if ( geometry.colors.length > 0 ) {
					buffergeometry.addAttribute( 'color', new THREE.Float32BufferAttribute( geometry.colors, 3 ) );
				}
				if ( geometry.uvs.length > 0 ) {
					buffergeometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( geometry.uvs, 2 ) );
				}
				var createdMaterials = [];
				for ( var mi = 0; mi < materials.length; mi ++ ) {
					sourceMaterial = materials[ mi ];
					material = undefined;
					if ( this.materials !== null ) {
						material = this.materials.create( sourceMaterial.name );
						if ( isLine && material && ! ( material instanceof THREE.LineBasicMaterial ) ) {
							var materialLine = new THREE.LineBasicMaterial();
							materialLine.copy( material );
							material = materialLine;
						}
					}
					if ( ! material ) {
						material = ( ! isLine ? new THREE.MeshPhongMaterial() : new THREE.LineBasicMaterial() );
						material.name = sourceMaterial.name;
					}
					createdMaterials.push( material );
				}
				var mesh;
				if ( createdMaterials.length > 1 ) {
					for ( var mi = 0, miLen = materials.length; mi < miLen; mi ++ ) {
						var sourceMaterial = materials[ mi ];
						buffergeometry.addGroup( sourceMaterial.groupStart, sourceMaterial.groupCount, mi );
					}
					mesh = ( ! isLine ? new THREE.Mesh( buffergeometry, createdMaterials ) : new THREE.LineSegments( buffergeometry, createdMaterials ) );
				} else {
					mesh = ( ! isLine ? new THREE.Mesh( buffergeometry, createdMaterials[ 0 ] ) : new THREE.LineSegments( buffergeometry, createdMaterials[ 0 ] ) );
				}
				mesh.name = object.name;
				container.add( mesh );
			}
			console.timeEnd( 'OBJLoader' );
			return container;
		}
	};
	return OBJLoader;
} )();