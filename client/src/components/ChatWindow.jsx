import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { Send, X, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

import { useNavigate } from 'react-router-dom'; // Add useNavigate

const ChatWindow = ({ listingId, onClose }) => {
    const { user } = useAuth();
    const navigate = useNavigate(); // Hook for navigation
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);
    const [listingDetails, setListingDetails] = useState(null);

    useEffect(() => {
        // Fetch listing details for header
        axios.get(`http://localhost:5000/api/listings?id=${listingId}`) // This might return all, need specific endpoint or filter
            .then(res => {
                const item = res.data.find(i => i._id === listingId);
                setListingDetails(item);
            });

        // Fetch Chat History
        const token = localStorage.getItem('token');
        axios.get(`http://localhost:5000/api/chat/${listingId}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
            setMessages(res.data);
            scrollToBottom();
        });

        // Initialize Socket
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.emit('join_chat', listingId);

        newSocket.on('receive_message', (message) => {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
        });

        return () => newSocket.disconnect();
    }, [listingId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!user) return; // Prevent if not logged in
        if (!newMessage.trim() || !socket) return;

        const messageData = {
            listingId,
            senderId: user.id || user._id, // Handle both ID formats
            text: newMessage
        };

        await socket.emit('send_message', messageData);
        setNewMessage('');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-brand-border z-[2000] flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="bg-brand-primary p-4 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <MessageSquare size={20} />
                    <div>
                        <h3 className="font-bold text-sm">Chat</h3>
                        <p className="text-xs opacity-80">{listingDetails?.name || 'Loading...'}</p>
                    </div>
                </div>
                <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                    <X size={18} />
                </button>
            </div>

            {/* Login Prompt Overlay if not logged in */}
            {!user && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                    <p className="text-brand-text font-bold mb-4">Please log in to chat with the donor.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-brand-primary text-white py-2 px-6 rounded-xl font-bold hover:bg-brand-primary-dark transition-colors mb-3 w-full"
                    >
                        Log In
                    </button>
                    <button
                        onClick={() => navigate('/register')}
                        className="text-brand-primary font-bold hover:underline text-sm"
                    >
                        Create Account
                    </button>
                </div>
            )}

            {/* Messages Area */}
            {messages.map((msg, idx) => {
                const myId = user?.id || user?._id;
                const msgSenderId = msg.sender?._id || msg.sender;
                // Force string comparison to avoid type mismatches (ObjectId vs String)
                const isMe = String(msgSenderId) === String(myId);

                // Console log for debugging (remove in production)
                console.log(`Msg ${idx}:`, { myId, msgSenderId, isMe, msgText: msg.text });

                return (
                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe
                                ? 'bg-brand-primary text-white rounded-br-none'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                }`}
                        >
                            <p className="font-semibold text-xs mb-1 opacity-70">
                                {isMe ? 'You' : (msg.sender?.role === 'organization' ? (msg.sender?.name || 'NGO') : (msg.sender?.name || msg.sender?.email?.split('@')[0] || 'User'))}
                            </p>
                            <p>{msg.text}</p>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>

            {/* Input Area */ }
    <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex items-center space-x-2">
        <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none"
        />
        <button
            type="submit"
            className="bg-brand-primary text-white p-2 rounded-xl hover:bg-brand-primary-dark transition-colors"
        >
            <Send size={18} />
        </button>
    </form>
        </motion.div >
    );
};

export default ChatWindow;
