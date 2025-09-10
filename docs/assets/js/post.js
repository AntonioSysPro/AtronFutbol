document.addEventListener( 'DOMContentLoaded', async function ()
{
    const backToBlogButton = document.getElementById( 'back-to-blog' );
    const postContentDiv = document.getElementById( 'post-content' );

    // Function to get post ID from URL parameters
    function getPostIdFromUrl ()
    {
        const urlParams = new URLSearchParams( window.location.search );
        return urlParams.get( 'id' );
    }

    // Function to get post data from the server
    async function getPostFromServer ( postId )
    {
        const response = await fetch( `/api/posts/${ postId }` );
        const post = await response.json();
        return post;
    }

    // Function to display post content
    function displayPost ( post )
    {
        if ( post )
        {
            postContentDiv.innerHTML = `
                <h2>${ post.title }</h2>
                <img src="${ post.image }" alt="${ post.title }">
                <p>${ post.content }</p>
            `;
        } else
        {
            postContentDiv.innerHTML = '<p>⚠ El post no existe o fue eliminado</p>';
        }
    }

    // Get post ID from URL
    const postId = getPostIdFromUrl();

    // Get post data from the server
    let post = await getPostFromServer( postId );

    // Display post content
    displayPost( post );

    // Back to Blog button functionality
    backToBlogButton.addEventListener( 'click', function ()
    {
        window.location.href = 'index.html';
    } );
} );