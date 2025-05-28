import socket from 'socket.io-client';


let socketInstance = null;


export const initializeSocket = (projectId) => {
    // Always use the full backend URL for socket connections, not relative paths
    // Netlify redirects don't work with WebSockets
    const backendUrl = import.meta.env.VITE_API_URL || 'https://chatndev.onrender.com';

    socketInstance = socket(backendUrl, {
        auth: {
            token: localStorage.getItem('token')
        },
        query: {
            projectId
        }
    });

    return socketInstance;

}

export const receiveMessage = (eventName, cb) => {
    socketInstance.on(eventName, cb);
}

export const sendMessage = (eventName, data) => {
    socketInstance.emit(eventName, data);
}