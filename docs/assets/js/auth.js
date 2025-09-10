import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import
    {
        getAuth,
        GoogleAuthProvider,
        signInWithPopup,
        onAuthStateChanged,
        signOut
    } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
// Removed premature auth initialization


// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBq-XkjsysviMyFDzUUGFJYrtoZzEqnvfE",
    authDomain: "antoniosyspro.firebaseapp.com",
    databaseURL: "https://antoniosyspro-default-rtdb.firebaseio.com",
    projectId: "antoniosyspro",
    storageBucket: "antoniosyspro.appspot.com",
    messagingSenderId: "784462788437",
    appId: "1:784462788437:web:5f225715f5dc25c6ada1dc",
    measurementId: "G-7V2WHRSRK3"
};

// Initialize Firebase
const app = initializeApp( firebaseConfig );
const auth = getAuth( app ); // Keep this as the primary auth instance
const provider = new GoogleAuthProvider();

document.addEventListener( 'DOMContentLoaded', () =>
{
    const googleLoginBtn = document.getElementById( 'google-login-btn' );

    if ( googleLoginBtn )
    {
        googleLoginBtn.addEventListener( 'click', () =>
        {
            signInWithPopup( auth, provider )
                .then( ( result ) =>
                {
                    // This gives you a Google Access Token. You can use it to access the Google API.
                    const credential = GoogleAuthProvider.credentialFromResult( result );
                    const token = credential.accessToken;
                    // The signed-in user info.
                    const user = result.user;

                    console.log( 'User signed in:', user );
                    // Store user info or token if needed
                    localStorage.setItem( 'firebaseUser', JSON.stringify( user ) );
                    window.location.href = '/admin.html'; // Redirect to a protected page

                } ).catch( ( error ) =>
                {
                    // Handle Errors here.
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    // The email of the user's account used.
                    const email = error.customData.email;
                    // The AuthCredential type that was used.
                    const credential = GoogleAuthProvider.credentialFromError( error );

                    console.error( 'Google sign-in error:', errorMessage );
                } );
        } );
    }
} );

// Check auth state and update UI accordingly
// Central auth state handler
onAuthStateChanged( auth, ( user ) =>
{
    {
        const loginLink = document.getElementById( 'login-link' );
        const userProfile = document.getElementById( 'user-profile' );
        const loginButton = document.getElementById( 'login-button' );
        const userProfileMobile = document.getElementById( 'user-profile-mobile' );

        if ( user )
        {
            // User is signed in.
            const profilePicUrl = user.photoURL;

            // Set profile picture in nav bar and hero image
            document.getElementById( 'user-profile-img' ).src = profilePicUrl || './assets/images/author.png';
            document.getElementById( 'user-profile-img-mobile' ).src = profilePicUrl || './assets/images/author.png';
            document.querySelector( '.hero-img' ).src = profilePicUrl || './assets/images/favicon.ico';

            // Show user profile, hide login link
            loginLink.style.display = 'none';
            userProfile.style.display = 'block';
            loginButton.style.display = 'none';
            userProfileMobile.style.display = 'block';

            // Setup profile dropdown toggle
            const profileToggle = document.getElementById( 'profile-toggle' );
            const dropdown = document.querySelector( '.profile-dropdown' );

            profileToggle.addEventListener( 'click', ( e ) =>
            {
                e.preventDefault();
                dropdown.classList.toggle( 'show' );
            } );

            // Close dropdown when clicking outside
            document.addEventListener( 'click', ( e ) =>
            {
                if ( !e.target.closest( '.profile-container' ) )
                {
                    dropdown.classList.remove( 'show' );
                }
            } );

            // Logout functionality
            // Add click handlers for profile toggles
            document.querySelectorAll( '[id^="profile-toggle"]' ).forEach( toggle =>
            {
                toggle.addEventListener( 'click', ( e ) =>
                {
                    e.preventDefault();
                    document.querySelector( '.profile-dropdown' ).classList.toggle( 'show' );
                } );
            } );

            // Ensure all UI elements exist before manipulating them
            const elements = [
                'login-link',
                'user-profile',
                'login-button',
                'user-profile-mobile',
                'logout-link',
                'profile-toggle',
                'profile-toggle-mobile'
            ].forEach( id =>
            {
                if ( !document.getElementById( id ) )
                {
                    console.warn( `Element ${ id } not found` );
                }
            } );

            document.getElementById( 'logout-link' ).addEventListener( 'click', ( e ) =>
            {
                e.preventDefault();
                signOut( auth ).then( () =>
                {
                    window.location.href = '/'; // Redirect to home after logout
                } ).catch( ( error ) =>
                {
                    console.error( 'Error signing out:', error );
                } );
            } );
        } else
        {
            // No user is signed in.
            // Hide user profile, show login link and reset hero image
            loginLink.style.display = 'block';
            userProfile.style.display = 'none';
            loginButton.style.display = 'block';
            userProfileMobile.style.display = 'none';
            document.querySelector( '.hero-img' ).src = './assets/images/favicon.ico';
        }
    }
} );