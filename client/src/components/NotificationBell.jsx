import { useState, useEffect, useRef } from 'react';
import { Bell, MessageSquare, Tag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const NotificationBell = ({ onChatClick }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef(null);

    useEffect(() => {
        // Connect to socket
        socketRef.current = io('http://localhost:5000');

        // Join personal room for notifications
        if (user) {
            socketRef.current.emit('user_connected', user.id || user._id);
        }

        // Listen for price updates
        socketRef.current.on('priceUpdate', (data) => {
            addNotification({
                id: Date.now(),
                type: 'price',
                title: 'Price Drop Alert!',
                message: `${data.itemName || 'An item'} is now ₹${data.newUnitParam || data.newPrice}${data.unit ? '/' + data.unit : ''}!`,
                time: new Date(),
                read: false,
                data: data // contains listingId potentially
            });
        });

        // Listen for new messages (Standard chat event in case global emit)
        socketRef.current.on('receive_message', (msg) => {
            // Only notify if NOT sent by me
            const senderId = msg.sender._id || msg.sender;
            if (user && senderId !== user.id && senderId !== user._id) {
                // If we are currently chatting in this room, don't notify? 
                // For now, simple notification.
                addNotification({
                    id: Date.now(),
                    type: 'message',
                    title: `New message from ${msg.sender.name || 'User'}`,
                    message: msg.text,
                    time: new Date(),
                    read: false,
                    data: { listingId: msg.listingId }
                });
            }
        });

        // Listen for targeted notifications (new method)
        socketRef.current.on('new_message_notification', (data) => {
            addNotification({
                id: Date.now(),
                type: 'message',
                title: data.title,
                message: data.message,
                time: new Date(),
                read: false,
                data: { listingId: data.listingId }
            });
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [user]);

    const addNotification = (notif) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Optional: Play a sound
        // const audio = new Audio('/notification.mp3');
        // audio.play().catch(e => console.log(e));
    };

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            // Mark as read when opening? Or individually?
            // Let's keep unread count until dismissed or clicked
        }
    };

    const handleItemClick = (notif) => {
        if (notif.type === 'message' && onChatClick) {
            onChatClick(notif.data.listingId);
        }
        // Mark as read/remove
        setNotifications(prev => prev.filter(n => n.id !== notif.id));
        setUnreadCount(prev => Math.max(0, prev - 1));
        setIsOpen(false);
    };

    const handleDismiss = (e, id) => {
        e.stopPropagation();
        setNotifications(prev => prev.filter(n => n.id !== id));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    return (
        <div className="relative">
            <button
                onClick={handleToggle}
                className="relative p-2 text-brand-text hover:text-brand-primary transition-colors rounded-full hover:bg-brand-primary/10"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[100] cursor-default" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-brand-border z-[101] overflow-hidden"
                        >
                            <div className="p-4 bg-brand-bg border-b border-brand-border flex justify-between items-center">
                                <h3 className="font-bold text-brand-text">Notifications</h3>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={() => { setNotifications([]); setUnreadCount(0); }}
                                        className="text-xs text-brand-primary hover:underline"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-brand-text-secondary">
                                        <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No new notifications</p>
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            onClick={() => handleItemClick(notif)}
                                            className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors relative group"
                                        >
                                            <div className="flex items-start space-x-3">
                                                <div className={`p-2 rounded-full flex-shrink-0 ${notif.type === 'message' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                                    {notif.type === 'message' ? <MessageSquare size={16} /> : <Tag size={16} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-brand-text truncate">{notif.title}</p>
                                                    <p className="text-xs text-brand-text-secondary line-clamp-2">{notif.message}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{notif.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDismiss(e, notif.id)}
                                                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
