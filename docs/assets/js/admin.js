document.addEventListener('DOMContentLoaded', () => {
    const postList = document.getElementById('post-list');

    async function loadPosts() {
        try {
            // We add ?all=true to fetch all posts, including pending and drafts
            const response = await fetch('/api/posts?all=true');
            if (!response.ok) {
                throw new Error('Failed to fetch posts.');
            }
            const posts = await response.json();

            // Sort posts by date, newest first
            posts.sort((a, b) => new Date(b.date) - new Date(a.date));

            let html = '';
            posts.forEach(post => {
                html += `
                    <div class="post-card">
                        <img src="${post.image || 'assets/images/default-placeholder.png'}" alt="${post.title}" class="post-image">
                        <div class="post-content">
                            <h2>${post.title}</h2>
                            <p><strong>Autor:</strong> ${post.author}</p>
                            <p><strong>Estado:</strong> <span class="status status-${post.status}">${post.status}</span></p>
                            <p><strong>Vistas:</strong> ${post.views || 0}</p>
                            <div class="post-actions">
                                <button class="btn" onclick="editPost('${post.id}')">Editar</button>
                                <button class="btn btn-danger" onclick="deletePost('${post.id}')">Eliminar</button>
                                ${post.status !== 'published' ? `<button class="btn btn-success" onclick="approvePost('${post.id}')">Aprobar</button>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });

            postList.innerHTML = html || '<p>No hay posts para mostrar.</p>';
        } catch (error) {
            console.error('Error:', error);
            postList.innerHTML = '<p>Error al cargar los posts.</p>';
        }
    }

    // Make functions globally available for inline onclick handlers
    window.approvePost = async function(postId) {
        try {
            const response = await fetch(`/api/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'published' })
            });

            if (response.ok) {
                alert('Post aprobado con éxito!');
                loadPosts(); // Reload posts after approval
            } else {
                alert('Error al aprobar el post.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Ocurrió un error al aprobar el post.');
        }
    }

    window.deletePost = async function(postId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este post?')) {
            return;
        }

        try {
            const response = await fetch(`/api/posts/${postId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Post eliminado con éxito!');
                loadPosts(); // Reload posts
            } else {
                alert('Error al eliminar el post.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Ocurrió un error al eliminar el post.');
        }
    }
    
    window.editPost = function(postId) {
        // Redirect to an edit page, which you would need to create
        // For example: window.location.href = `/edit-post.html?id=${postId}`;
        alert(`Funcionalidad de editar para el post ${postId} no implementada aún.`);
    }


    // Initial load of posts
    loadPosts();
});