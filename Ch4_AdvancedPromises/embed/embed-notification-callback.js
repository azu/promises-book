function notifyMessage(message, options, callback) {
    if (typeof Notification === "undefined") {
        callback(new Error("doesn't support Notification API"));
        return;
    }
    if (Notification.permission === "granted") {
        const notification = new Notification(message, options);
        callback(null, notification);
    } else {
        Notification.requestPermission((status) => {
            if (Notification.permission !== status) {
                Notification.permission = status;
            }
            if (status === "granted") {
                const notification = new Notification(message, options);
                callback(null, notification);
            } else {
                callback(new Error("user denied"));
            }
        });
    }
}

