/**
 * This service worker handles AI playing
 */

export function register() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js').then((function(registration) {
                console.log('sw has been registered');
            }))
        })
    }
}

export default {
    register,
};