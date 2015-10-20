#!/usr/bin/env node

var argv    = require( 'minimist' )( process.argv.slice( 2 ) )
  , chalk   = require( 'chalk' )
  , fs      = require( 'fs' )
  , Q       = require( 'q' )
  , path    = require( 'path' )
  , request = require( 'request' )
  , temp    = require( 'temp' ).track()

var successfulHttpCodes = [ 200, 201, 202, 203, 204, 205, 206, 304 ]


var sort     = !argv.nosort
  , argJsons = argv._

if ( argJsons.length > 2 )
  console.log( chalk.yellow( argJsons.length + ' jsons specified, but only 2 will be compared.' ) )


// Get folder path
var folder = argv.savelocal ? '' : temp.mkdirSync( 'diffajson' )
  , time   = Date.now()


var promises = argJsons.slice( 0, 2 ).map( function( arg, index ) {

  var deferred = Q.defer()
    , filepath = path.join( folder, ( index == 0 ? 'left' : 'right' ) + '-' + time + '.json' )

  /*
   * Parse URL argument
   */
  if ( isUrl( arg ) )
    request( arg, { json: true, gzip: true }, function( err, response, body ) {

      if ( err || successfulHttpCodes.indexOf( response.statusCode ) < 0 )
        deferred.reject( err ? err : response.statusCode )

      else
        sortAndStoreJson( body, filepath, deferred, sort )
    } )

  /*
   * Parse Filepath argument
   */
  else
    fs.readFile( arg, function( err, data ) {

      if ( err )
        deferred.reject( err )

      else
        sortAndStoreJson( data.toString(), filepath, deferred, sort )
    } )


  return deferred.promise
} )


/*
 * Once the files are both there
 */
Q.spread( promises, function( left, right ) {

  if ( argv.saveonly ) return

  var procArgs = [ left, right ]
  if ( argv.sidebyside ) procArgs.push( '-y', '--suppress-common-lines' )

  var diffProc = require( 'child_process' ).spawn( 'diff', procArgs )

  if ( argv.saveas ) {

    var file = fs.createWriteStream( argv.saveas )

    diffProc.stdout.pipe( file )
    diffProc.on( 'close', function() {

      file.end()
      console.log( chalk.green( 'Diff file saved as: ' + argv.saveas ) )
    } )

  }
  else {

    diffProc.stdout.on( 'data', function( data ) {

      console.log( data.toString() )
    } )
  }

}, abort )


/**
 * Checks naively if the string is URL-like
 *
 * @param {string} string
 * @returns {boolean}
 */
function isUrl( string ) {

  return ( new RegExp( '^(?:[a-z]+:)?//', 'i' ) ).test( string )
}

/**
 * Aborts process and prints out error
 *
 * @param {Error} err
 */
function abort( err ) {

  console.log( chalk.red( err ) )

  process.exit( 1 )
}

/**
 * Sorts data object and writes it to temporary file
 * Resolves/Rejects deferred appropriately
 *
 * @param {string}  data
 * @param {string}  filepath
 * @param {Q.defer} deferred
 * @param {boolean} [sort]   Defaults to true
 */
function sortAndStoreJson( data, filepath, deferred, sort ) {

  try {

    var parsed = ( typeof data == 'string' ) ? JSON.parse( data ) : data

    if ( sort ) parsed = sortObj( parsed )

    fs.writeFile( filepath, JSON.stringify( parsed, undefined, 2 ), function( err ) {

      if ( err ) throw err

      deferred.resolve( filepath )
    } )
  }
  catch ( err ) {

    deferred.reject( err )
  }
}

/**
 * Sorts an object tree alphabetically
 *
 * @param {object} object
 *
 * @returns {object}
 */
function sortObj( object ) {

  var newobj = Array.isArray( object ) ? [] : {}
  Object.keys( object ).sort().forEach( function( key ) {

    var value = object[ key ]

    newobj[ key ] = Array.isArray( value ) ? value.map( getSortedValue ) : getSortedValue( value )
  } )

  return newobj
}

/**
 * Re-order if object or return
 *
 * @param {*} value
 *
 * @returns {*}
 */
function getSortedValue( value ) {

  return ( value && typeof value == 'object' ) ? sortObj( value ) : value
}