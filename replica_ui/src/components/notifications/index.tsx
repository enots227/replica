import React, { useState, useContext } from 'react';
import { Toast, ToastContainer } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons'
import { Variant } from 'react-bootstrap/esm/types';

// Context
export type INotifierContext = {
    notifications: JSX.Element[];
    pushNotification: (notification: JSX.Element) => void;
    removeNotification: (idx: number) => void;
}

const DEFAULT_NOTIFICATIONS: JSX.Element[] = [];

const defaultContext: INotifierContext = {
    notifications: DEFAULT_NOTIFICATIONS,
    pushNotification: () => {},
    removeNotification: () => {},
}

const NotificerContext = React.createContext<INotifierContext>(defaultContext);

export const useNotifier = () => {
    return useContext(NotificerContext);
}

export type INotifierProps = {
    children: React.ReactNode;
}

export function Notifier(props: INotifierProps) {
    const [notifications, setNotifications] = useState<JSX.Element[]>(DEFAULT_NOTIFICATIONS);

    function pushNotification(notification: JSX.Element) {
        setNotifications([
            ...notifications,
            notification
        ]);
    }

    function removeNotification(idx: number) {
        setNotifications(notifications.filter((item, i) => {
            return i !== idx;
        }));
    }

    return (
        <NotificerContext.Provider value={{notifications, pushNotification, removeNotification}}>
            {props.children}
            <Notifications notifications={notifications} pushNotification={pushNotification} removeNotification={removeNotification} />
        </NotificerContext.Provider>
    );
}

// Base Notification
export type INotification = {
    title: string;
    children: React.ReactNode;
    icon?: IconProp;
    color?: Variant;
    onClose?: () => void;
}

export function Notification(props: INotification) {
    const iconElem = typeof props.icon !== "undefined" ? <FontAwesomeIcon icon={props.icon} /> : null;
    const colorClass = typeof props.color !== "undefined" ? "text-" + props.color : ""

    return (
        <Toast onClose={props.onClose}>
            <Toast.Header className={colorClass}>
                {iconElem}
                <strong className="ms-1 me-auto">{props.title}</strong>
                {/* <small className="text-muted">just now</small> */}
            </Toast.Header>
            <Toast.Body>{props.children}</Toast.Body>
        </Toast>
    )
}

// Pre-configured Notification
// # Success #####
const DefaultSuccessNotification = {
    icon: faCheckCircle,
    color: 'success'
}

export function SuccessNotification(props: INotification) {
    return Notification(props)
}

SuccessNotification.defaultProps = DefaultSuccessNotification;

// # Danger ######
const DefaultDangerNotification = {
    icon: faTimesCircle,
    color: 'danger'
}

export function DangerNotification(props: INotification) {
    return Notification(props)
}

DangerNotification.defaultProps = DefaultDangerNotification;

// Notications
function Notifications(props: INotifierContext) {
    const notifier  = useNotifier();
    
    const handleClose = (idx: number) => {
        notifier.removeNotification(idx);
    }
    
    return (
        <ToastContainer position="top-end" className="p-3">
            {notifier.notifications.map((notification, idx) => {
                return React.cloneElement(notification, {
                    key: idx,
                    onClose: () => { handleClose(idx); } 
                });
            })}
        </ToastContainer>
    )
}
