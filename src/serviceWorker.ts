/**
 * This service worker handles AI playing
 */

export function register() {
    console.log('-> SW register called');
    if ('serviceWorker' in navigator) {
        console.log('-> SW features enabled in the browser');
        window.addEventListener('load', function() {
            console.log('-> window has loaded');
            navigator.serviceWorker.register('/sw.js').then(function(registration) {
                console.log('-> SW has been registered successfully');
                console.log('sw has been registered');
            }, function(err) {
                console.error('failed to register service worker');
                console.error(err);
            });
        })
    }
}

export default {
    register,
};