import {Notification, NotificationContainer} from './index';

let queue: Notification[] = [];
let notificationsRef: NotificationContainer | null = null;

export function setNotificationsRef(ref: NotificationContainer) {
    notificationsRef = ref;
    if (notificationsRef && queue.length > 0) {
        queue.forEach((item) => {
            notificationsRef && notificationsRef.open(item);
        });
    }
}

export function openNotifications(notifications: Notification[]) {
    if (notificationsRef) {
        notifications.forEach((item) => {
            notificationsRef && notificationsRef.open(item);
        });
    } else {
        queue.push(...notifications);
    }
}

export function openNotification(notification: Notification) {
    if (notificationsRef) {
        notificationsRef.open(notification);
    } else {
        queue.push(notification);
    }
}

export function closeNotification() {
    if (notificationsRef) {
        notificationsRef.close();
    }
}

export function closeAllNotifications() {
    if (notificationsRef) {
        notificationsRef.closeAll();
    }
    queue = [];
}
