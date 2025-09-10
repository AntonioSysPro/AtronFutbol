const express = require( 'express' );
const fs = require( 'fs' );
const path = require( 'path' );
const multer = require( 'multer' );
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use( express.json() );
app.use( express.static( path.join( __dirname, 'docs' ) ) );
app.use( '/assets', express.static( path.join( __dirname, 'docs', 'assets' ) ) );
// Serve admin page
app.get( '/admin', ( req, res ) =>
{
  res.sendFile( path.join( __dirname, 'docs', 'admin.html' ) );
} );

// Serve index page
app.get( '/', ( req, res ) =>
{
  res.sendFile( path.join( __dirname, 'docs', 'index.html' ) );
} );

// Data storage (posts.json & comments.json)
const POSTS_FILE = path.join( __dirname, 'posts.json' );
const COMMENTS_FILE = path.join( __dirname, 'comments.json' );

let posts = [];
let comments = [];

function loadData ()
{
  try
  {
    const data = fs.readFileSync( POSTS_FILE, 'utf8' );
    posts = JSON.parse( data || '[]' );
    posts.forEach( post =>
    {
      if ( !post.views )
      {
        post.views = 0;
      }
    } );
  } catch ( err )
  {
    console.error( 'Error reading posts.json:', err );
    posts = [];
  }

  try
  {
    const data = fs.readFileSync( COMMENTS_FILE, 'utf8' );
    comments = JSON.parse( data || '[]' );
  } catch ( err )
  {
    // If comments file missing or empty, initialize as empty array
    console.warn( 'comments.json missing or invalid, initializing empty comments store' );
    comments = [];
  }
}

function savePosts ()
{
  try
  {
    fs.writeFileSync( POSTS_FILE, JSON.stringify( posts, null, 2 ) );
    console.log( 'Posts saved successfully to posts.json', posts );
  } catch ( error )
  {
    console.error( 'Error saving posts to posts.json:', error );
  }
}

function saveComments ()
{
  fs.writeFileSync( COMMENTS_FILE, JSON.stringify( comments, null, 2 ) );
}

loadData();

// API Routes
// List posts. By default only return published posts. Add ?all=1 to return all (for admin).
app.get( '/api/posts', ( req, res ) =>
{
  loadData(); // Reload posts data before sending the response
  const includeAll = req.query.all === '1' || req.query.all === 'true';
  const page = parseInt( req.query.page ) || 0; // Default to page 0
  const limit = parseInt( req.query.limit ) || 10; // Default to 10 posts per page
  const startIndex = page * limit;
  const endIndex = startIndex + limit;

  let published = posts.filter( p => p.status === 'published' );

  if ( includeAll )
  {
    published = posts;
  }

  const paginatedPosts = published.slice( startIndex, endIndex );
  res.json( paginatedPosts );
} );

// Get single post
app.get( '/api/posts/:id', ( req, res ) =>
{
  const post = posts.find( p => p.id === req.params.id );
  if ( !post ) return res.status( 404 ).json( { error: 'Post not found' } );
  res.json( post );
} );

// Increment post views
app.post( '/api/posts/:id/views', ( req, res ) =>
{
  const postId = req.params.id;
  const post = posts.find( p => p.id === postId );
  if ( !post ) return res.status( 404 ).json( { error: 'Post not found' } );

  post.views++;
  savePosts();

  res.json( { views: post.views } );
} );


const storage = multer.diskStorage( {
  destination: function ( req, file, cb )
  {
    cb( null, path.join( __dirname, 'docs', 'assets', 'images' ) );
  },
  filename: function ( req, file, cb )
  {
    const uniqueSuffix = Date.now() + '-' + Math.round( Math.random() * 1E9 )
    cb( null, file.fieldname + '-' + uniqueSuffix + path.extname( file.originalname ) )
  }
} )

const upload = multer( { storage: storage, limits: { fieldSize: 25 * 1024 * 1024 } } )

// Create post (submitted for moderation)
app.post( '/api/posts', ( req, res, next ) =>
{
  upload.single( 'image' )( req, res, ( err ) =>
  {
    if ( err )
    {
      console.error( 'Error uploading image:', err );
      return res.status( 500 ).json( { error: 'Error uploading image' } );
    }
    console.log( 'Received post data:', req.body );
    console.log( 'Received file data:', req.file );
    const { title, content, author, category } = req.body;
    if ( !title || !content || !author || !category ) return res.status( 400 ).json( { error: 'Missing fields' } );

    loadData(); // Reload posts data before adding a new post

    const newPost = {
      category,
      category,
      id: Date.now().toString(),
      title,
      content,
      author,
      image: req.file ? `/assets/images/${ req.file.filename }` : '',
      status: 'pending',
      date: new Date().toISOString()
    };
    console.log( 'Before adding new post, posts array:', posts );
    posts.push( newPost );
    console.log( 'After adding new post, posts array:', posts );
    savePosts();
    console.log( 'New post with image path:', newPost.image );
    res.status( 201 ).json( newPost );
  } );
} );

// Update post (title/content/author/image/status)
app.put( '/api/posts/:id', ( req, res ) =>
{
  const postId = req.params.id;
  const postIndex = posts.findIndex( p => p.id === postId );
  if ( postIndex === -1 ) return res.status( 404 ).json( { error: 'Post not found' } );
  const allowed = [ 'title', 'content', 'author', 'image', 'status', 'date' ];
  for ( const key of allowed )
  {
    if ( req.body[ key ] !== undefined ) posts[ postIndex ][ key ] = req.body[ key ];
  }
  savePosts();
  res.json( posts[ postIndex ] );
} );

// Delete post
app.delete( '/api/posts/:id', ( req, res ) =>
{
  const postId = req.params.id;
  const before = posts.length;
  posts = posts.filter( p => p.id !== postId );
  if ( posts.length === before ) return res.status( 404 ).json( { error: 'Post not found' } );
  savePosts();
  res.sendStatus( 204 );
} );

// Comments endpoints
app.get( '/api/comments', ( req, res ) =>
{
  const postId = req.query.postId;
  if ( postId ) return res.json( comments.filter( c => c.postId === postId ) );
  res.json( comments );
} );

app.post( '/api/comments', ( req, res ) =>
{
  const { author, text, postId } = req.body;
  if ( !author || !text || !postId ) return res.status( 400 ).json( { error: 'Missing fields' } );
  const newComment = {
    id: Date.now().toString(),
    author,
    text,
    postId,
    date: new Date().toISOString()
  };
  comments.push( newComment );
  saveComments();
  res.status( 201 ).json( newComment );
} );

// Start server
app.listen( PORT, () =>
{
  console.log( `Server running at http://localhost:${ PORT }` );
} );
