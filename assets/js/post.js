/* Admin script: manages posts with localStorage + import/export
   Features:
   - Load posts from posts.json (server) and merge with localStorage
   - Create / Edit / Delete posts (stored in localStorage)
   - Export posts as JSON file
   - Import posts from a JSON file (merge)
   - Simple search by title
*/

const postForm = document.getElementById( 'post-form' );
const postsContainer = document.getElementById( 'posts-container' );
const btnExport = document.getElementById( 'btn-export' );
const btnImport = document.getElementById( 'btn-import' );
const importFile = document.getElementById( 'import-file' );
const searchInput = document.getElementById( 'search' );
const btnClear = document.getElementById( 'btn-clear' );

let posts = [];

function uid () { return Date.now().toString( 36 ) + Math.random().toString( 36 ).slice( 2, 8 ); }

function saveLocal ()
{
  localStorage.setItem( 'posts', JSON.stringify( posts ) );
}

function loadLocal ()
{
  try
  {
    const raw = localStorage.getItem( 'posts' );
    return raw ? JSON.parse( raw ) : [];
  } catch ( e )
  {
    console.error( 'Error parsing local posts:', e );
    return [];
  }
}

async function loadInitial ()
{
  // try to load server posts.json
  let server = [];
  try
  {
    const res = await fetch( '../posts.json', { cache: 'no-cache' } );
    server = await res.json();
  } catch ( e )
  {
    console.warn( 'No server posts.json available, continuing with local posts.' );
  }

  const local = loadLocal();

  // merge: local overrides server by id
  const map = new Map();
  ( server || [] ).forEach( p => map.set( p.id, p ) );
  ( local || [] ).forEach( p => map.set( p.id, p ) );

  posts = Array.from( map.values() ).sort( ( a, b ) => new Date( b.date || 0 ) - new Date( a.date || 0 ) );
  renderPosts( posts );
}

function renderPosts ( list )
{
  postsContainer.innerHTML = '';
  if ( !list.length )
  {
    postsContainer.innerHTML = '<p>No hay articuloss.</p>';
    return;
  }
  list.forEach( post =>
  {
    const div = document.createElement( 'div' );
    div.className = 'post';
    div.innerHTML = `
      <h3>${ escapeHtml( post.title ) }</h3>
      <p>${ escapeHtml( post.content ) }</p>
      <p><strong>Autor:</strong> ${ escapeHtml( post.author || '' ) } <strong>Fecha:</strong> ${ escapeHtml( post.date || '' ) }</p>
      ${ post.image ? `<img src="${ escapeHtml( post.image ) }" alt="${ escapeHtml( post.title ) }" width="200">` : '' }
      <div class="actions">
        <button data-id="${ post.id }" class="edit">Editar</button>
        <button data-id="${ post.id }" class="delete">Eliminar</button>
      </div>
    `;
    postsContainer.appendChild( div );
  } );

  // attach handlers
  postsContainer.querySelectorAll( '.edit' ).forEach( b => b.addEventListener( 'click', e =>
  {
    const id = e.currentTarget.dataset.id;
    startEdit( id );
  } ) );
  postsContainer.querySelectorAll( '.delete' ).forEach( b => b.addEventListener( 'click', e =>
  {
    const id = e.currentTarget.dataset.id;
    if ( confirm( 'Eliminar este post?' ) )
    {
      posts = posts.filter( p => p.id !== id );
      saveLocal();
      renderPosts( filterBySearch( posts ) );
    }
  } ) );
}

function startEdit ( id )
{
  const p = posts.find( x => x.id === id );
  if ( !p ) return;
  document.getElementById( 'post-id' ).value = p.id;
  document.getElementById( 'title' ).value = p.title || '';
  document.getElementById( 'content' ).value = p.content || '';
  document.getElementById( 'author' ).value = p.author || '';
  document.getElementById( 'imaget' ).value = p.image || '';
  updateImagePreview( p.image || '' );
  window.scrollTo( { top: 0, behavior: 'smooth' } );
}

function filterBySearch ( list )
{
  const q = ( searchInput.value || '' ).toLowerCase().trim();
  if ( !q ) return list;
  return list.filter( p => ( p.title || '' ).toLowerCase().includes( q ) );
}

//document.getElementById( 'image' ).onselectionchange(
//  ;
function perpn () { document.getElementById( 'imaget' ).value = document.getElementById( 'image' ).value.trim() };
if ( document.getElementById( 'image' ).value.trim().length > 0 )
{
  document.getElementById( 'imaget' ).value = document.getElementById( 'image' ).value.trim();
}

postForm.addEventListener( 'submit', function ( ev )
{
  ev.preventDefault();
  const id = uid();
  const title = document.getElementById( 'title' ).value.trim();
  const content = document.getElementById( 'content' ).value.trim();
  const auimage = document.getElementById( 'auimage' ).value.trim();
  const author = document.getElementById( 'author' ).value.trim();
  const image = document.getElementById( 'image' ).value.trim();
  const date = new Date().toISOString().split( 'T' )[ 0 ];

  const obj = { id, title, content, author, image, date };

  const exists = posts.findIndex( p => p.id === id );
  if ( exists >= 0 ) posts[ exists ] = obj;
  else posts.unshift( obj );

  saveLocal();
  renderPosts( filterBySearch( posts ) );
  postForm.reset();
  document.getElementById( 'post-id' ).value = '';
} );

btnClear && btnClear.addEventListener( 'click', () => { postForm.reset(); document.getElementById( 'post-id' ).value = ''; } );

btnExport.addEventListener( 'click', () =>
{
  const data = JSON.stringify( posts, null, 2 );
  const blob = new Blob( [ data ], { type: 'application/json' } );
  const url = URL.createObjectURL( blob );
  const a = document.createElement( 'a' );
  a.href = url;
  a.download = 'posts.json';
  a.click();
  URL.revokeObjectURL( url );
} );

btnImport.addEventListener( 'click', () => importFile.click() );

importFile.addEventListener( 'change', async ( ev ) =>
{
  const file = ev.target.files && ev.target.files[ 0 ];
  if ( !file ) return;
  try
  {
    const text = await file.text();
    const imported = JSON.parse( text );
    if ( !Array.isArray( imported ) ) throw new Error( 'Formato inválido: se esperaba un array' );

    // merge by id
    const map = new Map( posts.map( p => [ p.id, p ] ) );
    imported.forEach( p => map.set( p.id || uid(), p ) );
    posts = Array.from( map.values() ).sort( ( a, b ) => new Date( b.date || 0 ) - new Date( a.date || 0 ) );
    saveLocal();
    renderPosts( filterBySearch( posts ) );
    alert( 'Importación completada' );
  } catch ( e )
  {
    alert( 'Error importando: ' + e.message );
  } finally
  {
    importFile.value = '';
  }
} );

searchInput.addEventListener( 'input', () => renderPosts( filterBySearch( posts ) ) );

function escapeHtml ( str )
{
  if ( !str ) return '';
  return String( str ).replace( /[&<>"']/g, function ( m )
  {
    return ( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;" } )[ m ];
  } );
}

// startup
loadInitial();

// image preview handling
const imageInput = document.getElementById( 'image' );
const imagePreview = document.getElementById( 'image-preview' );

function isLikelyUrl ( s )
{
  return /^(https?:)?\/\//i.test( s ) || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test( s );
}

function resolveLocalImage ( src )
{
  if ( !src ) return '';
  if ( /^(https?:)?\/\//i.test( src ) ) return src;
  if ( src.startsWith( '/' ) ) return src.slice( 1 );
  return src.replace( /^\.\/+/, '' );
}

function updateImagePreview ( src )
{
  const url = resolveLocalImage( src || '' );
  if ( !url )
  {
    imagePreview.innerHTML = '';
    imagePreview.setAttribute( 'aria-hidden', 'true' );
    return;
  }
  // show a small preview
  imagePreview.setAttribute( 'aria-hidden', 'false' );
  imagePreview.innerHTML = `<img src="${ escapeHtml( url ) }" alt="Vista previa" style="max-width:200px;max-height:120px;object-fit:cover;border:1px solid #ddd;padding:4px">`;
  console.log( url )
}

imageInput && imageInput.addEventListener( 'input', ( e ) => updateImagePreview( e.target.value ) );