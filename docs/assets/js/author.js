document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const authorId = urlParams.get('authorId');

  if (!authorId) {
    document.getElementById('post-content').innerHTML = '<p>Author not found.</p>';
    return;
  }

  fetch('./authors.json')
    .then(response => response.json())
    .then(authors => {
      const author = authors.find(author => author.authorId === authorId);

      if (!author) {
        document.getElementById('post-content').innerHTML = '<p>Author not found.</p>';
        return;
      }

      document.getElementById('post-content').innerHTML = `
        <h1>${author.name}</h1>
        <img src="${author.image}" alt="${author.name}" />
        <p>${author.bio}</p>
      `;
    })
    .catch(error => {
      console.error('Error fetching authors:', error);
      document.getElementById('post-content').innerHTML = '<p>Failed to load author data.</p>';
    });
});