'use strict';

// theme toggle variables
const themeBtn = document.querySelectorAll( '.theme-btn' );
// navbar variables
const nav = document.querySelector( '.mobile-nav' );
const navMenuBtn = document.querySelector( '.nav-menu-btn' );
const navCloseBtn = document.querySelector( '.nav-close-btn' );
// navToggle function
const navToggleFunc = function () { nav.classList.toggle( 'active' ); }

// Check for saved theme preference on page load
if ( localStorage.getItem( 'theme' ) == 'light' )
{
  document.body.classList.remove( 'light-theme' );
  document.body.classList.add( 'dark-theme' );

  themeBtn.forEach( btn =>
  {
    btn.classList.add( 'dark' );
    btn.classList.remove( 'light' );
  } );

} else
{
  document.body.classList.remove( 'dark-theme' );
  document.body.classList.add( 'light-theme' );
  themeBtn.forEach( btn =>
  {
    btn.classList.add( 'light' );
    btn.classList.remove( 'dark' );

  } );

}

navMenuBtn.addEventListener( 'click', navToggleFunc );
navCloseBtn.addEventListener( 'click', navToggleFunc );

for ( let i = 0; i < themeBtn.length; i++ )
{

  themeBtn[ i ].addEventListener( 'click', function ()
  {
    // Save the theme preference to localStorage
    localStorage.setItem( 'theme', document.body.classList.contains( 'light-theme' ) ? 'light' : 'dark' );
    // toggle `light-theme` & `dark-theme` class from `body`
    // when clicked `theme-btn`
    document.body.classList.toggle( 'light-theme' );
    document.body.classList.toggle( 'dark-theme' );

    for ( let i = 0; i < themeBtn.length; i++ )
    {
      // When the `theme-btn` is clicked,
      // it toggles classes between `light` & `dark` for all `theme-btn`.
      themeBtn[ i ].classList.toggle( 'light' );
      themeBtn[ i ].classList.toggle( 'dark' );
    }

  } );

}