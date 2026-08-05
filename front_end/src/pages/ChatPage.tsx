import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { socket } from '../services/socket';

export default function ChatPage() {
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  const [friends, setFriends] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]); 
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  
  const [blockedByMe, setBlockedByMe] = useState<string[]>([]); 
  const [hiddenUsers, setHiddenUsers] = useState<string[]>([]); 

  const [messages, setMessages] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null); 
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [addError, setAddError] = useState('');
  
  const [showRequests, setShowRequests] = useState(false);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [groupError, setGroupError] = useState('');

  const [showGroupSettings, setShowGroupSettings] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token || !currentUser) {
      navigate('/login');
      return;
    }

    fetchFriends();
    fetchGroups(); 
    fetchFriendRequests();
    fetchSentRequests(); 
    fetchBlockedUsers();

    socket.auth = { userId: currentUser.id };
    socket.connect();
    
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    socket.on('receive_message', (newMsg: any) => {
      if (newMsg.conversationId === conversationId) {
        setMessages((prev) => {
          // 1. منع التكرار: إذا الرسالة وصلتنا بنفس الـ ID الأصلي، نتجاهلها
          if (prev.some((msg) => msg.id === newMsg.id)) return prev;
          
          // 2. إزالة الرسالة المؤقتة اللي عرضناها قبل شوي عشان ما تتكرر الشوفة
          const filtered = prev.filter(msg => {
            const isTemp = String(msg.id).startsWith('temp-');
            const isMatch = isTemp && msg.content === newMsg.content && msg.senderId === newMsg.senderId;
            return !isMatch; // نحذفها إذا تطابقت مع الرسالة الوهمية
          });
          
          return [...filtered, newMsg];
        });
      } else {
        setFriends((prev) => prev.map(f => f.id === newMsg.senderId ? { ...f, hasUnread: true } : f));
      }
    });

    socket.on('user_status_changed', ({ userId, isOnline }) => {
      setFriends((prev) => 
        prev.map(f => f.id === userId ? { ...f, isOnline } : f)
      );
      setActiveChat((prev: any) => prev && prev.id === userId && !prev.isGroup ? { ...prev, isOnline } : prev);
    });

    return () => {
      socket.off('receive_message');
      socket.off('user_status_changed');
    };
  }, [conversationId]);

  const fetchFriends = async () => {
    try {
      const res = await axiosClient.get('/friends');
      setFriends(res.data || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await axiosClient.get('/groups');
      setGroups(res.data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const res = await axiosClient.get('/friends/requests');
      setFriendRequests(res.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchSentRequests = async () => {
    try {
      const res = await axiosClient.get('/friends/requests/sent');
      setSentRequests(res.data || []);
    } catch (error) {
      console.error('Error fetching sent requests:', error);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const res = await axiosClient.get('/blocks');
      setBlockedByMe(res.data.blockedByMe || []);
      setHiddenUsers(res.data.allHidden || []);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  };

  const handleToggleBlock = async (targetUserId: string) => {
    try {
      const res = await axiosClient.post('/blocks/toggle', { targetUserId });
      fetchBlockedUsers(); 
      alert(res.data.message);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error blocking user');
    }
  };

  const fetchMessages = async (chat: any) => {
    try {
      const convId = chat.conversationId;
      if (!convId) return;

      const res = await axiosClient.get(`/chats/${convId}/messages`);
      
      const fetchedMessages = Array.isArray(res.data) 
        ? res.data 
        : (res.data.data || res.data.messages || []);

      setMessages(fetchedMessages);
      setConversationId(convId);

      socket.emit('join_conversation', convId);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };
  
  const handleSelectChat = (chat: any) => {
    setActiveChat(chat);
    setShowGroupSettings(false); 
    if (!chat.isGroup) {
      setFriends((prev) => prev.map(f => f.id === chat.id ? { ...f, hasUnread: false } : f));
    }
    fetchMessages(chat);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !activeChat || !conversationId) return;

    const msgData = {
      conversationId,
      senderId: currentUser.id,
      content: message
    };

    // 🆕 عرض الرسالة فوراً محلياً بـ ID مؤقت عشان تحس بالسرعة وما تستنى السيرفر
    setMessages((prev) => [...prev, { ...msgData, id: `temp-${Date.now()}` }]);

    socket.emit('send_message', msgData);
    setMessage('');
  };

  const handleAddFriend = async (usernameToAdd?: string) => {
    const targetName = usernameToAdd || newFriendName;
    if (!targetName.trim()) return;
    try {
      await axiosClient.post('/friends/request', { username: targetName });
      alert('Request sent!');
      setAddError('');
      setShowAddFriend(false);
      setNewFriendName('');
      fetchSentRequests(); 
    } catch (err: any) {
      setAddError(err.response?.data?.message || 'User not found');
      if (usernameToAdd) alert(err.response?.data?.message || 'Error sending request');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupTitle.trim()) {
      setGroupError('Please enter a group title');
      return;
    }
    
    if (selectedFriends.length < 2) {
      setGroupError('Please select at least TWO friends to form a group');
      return;
    }

    try {
      await axiosClient.post('/groups/create', { 
        title: groupTitle, 
        participantIds: selectedFriends 
      });
      alert('Group created successfully!');
      setGroupError('');
      setShowCreateGroup(false);
      setGroupTitle('');
      setSelectedFriends([]);
      fetchGroups(); 
    } catch (err: any) {
      setGroupError(err.response?.data?.message || 'Error creating group');
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
    );
  };

  const handleAddMemberToGroup = async (friendId: string, friendUsername: string) => {
    try {
      await axiosClient.post('/groups/add-member', { groupId: activeChat.id, userId: friendId });
      setActiveChat((prev: any) => ({
        ...prev,
        participants: [...prev.participants, { id: friendId, username: friendUsername, role: 'MEMBER' }],
        participantsCount: prev.participantsCount + 1
      }));
      fetchGroups();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error adding member');
    }
  };

  const handleRemoveMemberFromGroup = async (memberId: string) => {
    try {
      await axiosClient.post('/groups/remove-member', { groupId: activeChat.id, userId: memberId });
      if (memberId === currentUser.id) {
        setActiveChat(null);
        setShowGroupSettings(false);
      } else {
        setActiveChat((prev: any) => ({
          ...prev,
          participants: prev.participants.filter((p: any) => p.id !== memberId),
          participantsCount: prev.participantsCount - 1
        }));
      }
      fetchGroups();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error removing member');
    }
  };

  const handleAcceptRequest = async (id: string) => {
    try {
      await axiosClient.post('/friends/accept', { requestId: id });
      setFriendRequests((prev) => prev.filter((req) => req.id !== id));
      fetchFriends(); 
    } catch (error) {
      console.error('Error accepting request', error);
    }
  };
  
  const handleRejectRequest = async (id: string) => {
    try {
      await axiosClient.post('/friends/reject', { requestId: id });
      setFriendRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (error) {
      console.error('Error rejecting request', error);
    }
  };

  const allChats = [...friends, ...groups];

  const filteredChats = allChats.filter((chat) => {
    const matchesSearch = chat.username?.toLowerCase().includes(searchQuery.toLowerCase()) || chat.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUnread = showUnreadOnly && !chat.isGroup ? chat.hasUnread : true;
    return matchesSearch && matchesUnread;
  });

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', fontFamily: 'Arial, sans-serif', backgroundColor: '#f0f2f5', direction: 'ltr' }}>
      
      <div style={{ width: '320px', backgroundColor: '#ffffff', borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ height: '70px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid #ddd', position: 'relative' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>Chats</h2>
          
          <button 
            onClick={() => { setShowRequests(!showRequests); fetchSentRequests(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', color: '#555', padding: '5px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {friendRequests.length > 0 && (
              <span style={{ position: 'absolute', top: '0', right: '0', backgroundColor: 'red', color: 'white', borderRadius: '50%', fontSize: '10px', width: '16px', height: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
                {friendRequests.length}
              </span>
            )}
          </button>

          {showRequests && (
            <div style={{ position: 'absolute', top: '65px', right: '15px', zIndex: 10, backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)', width: '280px', maxHeight: '400px', overflowY: 'auto' }}>
              <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px', color: '#007bff' }}>Inbox Requests</h4>
              {friendRequests.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#888', margin: '10px 0' }}>No new requests.</p>
              ) : (
                friendRequests.map((req) => (
                  <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{req.username || req.name}</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => handleAcceptRequest(req.id)} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px' }}>✓</button>
                      <button onClick={() => handleRejectRequest(req.id)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                    </div>
                  </div>
                ))
              )}

              <h4 style={{ margin: '20px 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px', color: '#6c757d' }}>Sent Requests</h4>
              {sentRequests.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#888', margin: '10px 0' }}>No pending requests.</p>
              ) : (
                sentRequests.map((req) => (
                  <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '14px' }}>{req.username}</span>
                    <span style={{ 
                      fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px',
                      backgroundColor: req.status === 'PENDING' ? '#fff3cd' : '#f8d7da',
                      color: req.status === 'PENDING' ? '#856404' : '#721c24'
                    }}>
                      {req.status === 'PENDING' ? '⏳ Pending' : '❌ Rejected'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '15px', borderBottom: '1px solid #ddd', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Search chats..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, padding: '10px 15px', borderRadius: '20px', border: '1px solid #ccc', outline: 'none' }}
          />
          <button 
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            title="Filter Unread"
            style={{ 
              padding: '8px 12px', borderRadius: '20px', border: '1px solid #ccc', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px',
              backgroundColor: showUnreadOnly ? '#007bff' : '#e9ecef', color: showUnreadOnly ? 'white' : '#555', transition: '0.2s'
            }}
          >
            {showUnreadOnly ? 'All' : 'Unread'}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredChats.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>No chats found.</p>
          ) : (
            filteredChats.map((chat) => (
              <div 
                key={chat.id} 
                onClick={() => handleSelectChat(chat)}
                style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '15px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
                  backgroundColor: activeChat?.id === chat.id ? '#e9ecef' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>
                    {chat.username || chat.name} {chat.isGroup && <span style={{ fontSize: '11px', color: '#888', marginLeft: '5px' }}>(Group)</span>}
                  </span>
                  {!chat.isGroup && chat.isTyping && <span style={{ fontSize: '12px', color: '#007bff', fontStyle: 'italic' }}>Typing...</span>}
                </div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: chat.isOnline || chat.isGroup ? '#28a745' : '#ccc' }}></div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ height: '70px', backgroundColor: '#ffffff', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', position: 'relative' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeChat ? (
              <>
                <h3 style={{ margin: 0 }}>
                  {activeChat.username || activeChat.name}
                  {activeChat.isGroup && <span style={{ fontSize: '14px', color: '#888', marginLeft: '10px' }}>({activeChat.participantsCount} members)</span>}
                </h3>
                {!activeChat.isGroup && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: activeChat.isOnline ? '#28a745' : '#ccc' }}></div>}
              </>
            ) : (
              <h3 style={{ margin: 0, color: '#888' }}>Select a chat</h3>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
            
            {activeChat && !activeChat.isGroup && (
              <button 
                onClick={() => handleToggleBlock(activeChat.id)}
                style={{ 
                  backgroundColor: blockedByMe.includes(activeChat.id) ? '#28a745' : '#dc3545', 
                  color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' 
                }}
              >
                {blockedByMe.includes(activeChat.id) ? 'Unblock' : 'Block'}
              </button>
            )}

            {activeChat && activeChat.isGroup && (
              <button 
                onClick={() => setShowGroupSettings(!showGroupSettings)}
                title="Group Settings"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', backgroundColor: '#e9ecef' }}
              >
                ⚙️
              </button>
            )}

            {showGroupSettings && activeChat && activeChat.isGroup && (
              <div style={{ position: 'absolute', top: '50px', right: '50px', zIndex: 10, backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)', width: '310px' }}>
                <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Group Members</h4>
                
                <div style={{ maxHeight: '160px', overflowY: 'auto', marginBottom: '15px' }}>
                  {activeChat.participants?.map((p: any) => {
                    const isFriend = friends.some(f => f.id === p.id) || p.id === currentUser.id;
                    const isBlocked = blockedByMe.includes(p.id);

                    return (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ fontSize: '13px' }}>
                            {p.username} {p.id === currentUser.id ? '(You)' : ''}
                          </span>
                          {p.role === 'ADMIN' && <span style={{ fontSize: '9px', backgroundColor: '#ffd700', padding: '1px 4px', borderRadius: '4px' }}>ADMIN</span>}
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          {p.id !== currentUser.id && (
                            <button 
                              onClick={() => handleToggleBlock(p.id)} 
                              style={{ background: isBlocked ? '#28a745' : '#6c757d', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                            >
                              {isBlocked ? 'Unblock' : 'Block'}
                            </button>
                          )}

                          {!isFriend && p.id !== currentUser.id && (
                            <button 
                              onClick={() => handleAddFriend(p.username)} 
                              style={{ background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                            >
                              + Add
                            </button>
                          )}

                          {(activeChat.participants.find((u: any) => u.id === currentUser.id)?.role === 'ADMIN' || p.id === currentUser.id) && p.role !== 'ADMIN' && (
                            <button onClick={() => handleRemoveMemberFromGroup(p.id)} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}>
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {activeChat.participants?.find((p: any) => p.id === currentUser.id)?.role === 'ADMIN' && (
                  <>
                    <h5 style={{ margin: '0 0 10px 0', color: '#6c757d' }}>Add Friends to Group</h5>
                    <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                      {friends.filter(f => !activeChat.participants.some((p: any) => p.id === f.id)).length === 0 ? (
                        <p style={{ fontSize: '12px', color: '#888' }}>All friends are in this group</p>
                      ) : (
                        friends.filter(f => !activeChat.participants.some((p: any) => p.id === f.id)).map(friend => (
                          <div key={friend.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <span style={{ fontSize: '13px' }}>{friend.username}</span>
                            <button onClick={() => handleAddMemberToGroup(friend.id, friend.username)} style={{ background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer' }}>
                              Add
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            <button 
              onClick={() => { setShowCreateGroup(!showCreateGroup); setShowAddFriend(false); setShowGroupSettings(false); }}
              title="Create Group"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '50%', backgroundColor: '#e9ecef' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </button>

            {showCreateGroup && (
              <div style={{ position: 'absolute', top: '50px', right: '50px', zIndex: 10, backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)', width: '250px' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>New Group</h4>
                <input 
                  type="text" 
                  placeholder="Group Title..." 
                  value={groupTitle}
                  onChange={(e) => { setGroupTitle(e.target.value); setGroupError(''); }}
                  style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', outline: 'none' }}
                />
                <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '10px', border: '1px solid #eee', padding: '5px', borderRadius: '4px' }}>
                  {friends.length === 0 ? <p style={{ fontSize: '12px', color: '#888' }}>No friends available</p> : 
                    friends.map(friend => (
                      <div key={friend.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                        <input type="checkbox" id={`friend-${friend.id}`} checked={selectedFriends.includes(friend.id)} onChange={() => toggleFriendSelection(friend.id)} />
                        <label htmlFor={`friend-${friend.id}`} style={{ fontSize: '14px', cursor: 'pointer' }}>{friend.username}</label>
                      </div>
                    ))
                  }
                </div>
                {groupError && <p style={{ color: 'red', fontSize: '12px', margin: '0 0 10px 0' }}>{groupError}</p>}
                <button onClick={handleCreateGroup} style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Create</button>
              </div>
            )}

            <button 
              onClick={() => { setShowAddFriend(!showAddFriend); setShowCreateGroup(false); setShowGroupSettings(false); }}
              title="Add new friend"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '50%', backgroundColor: '#e9ecef' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
            </button>

            {showAddFriend && (
              <div style={{ position: 'absolute', top: '50px', right: '0', zIndex: 10, backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)', width: '250px' }}>
                <input 
                  type="text" 
                  placeholder="Type exact username..." 
                  value={newFriendName}
                  onChange={(e) => { setNewFriendName(e.target.value); setAddError(''); }}
                  style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', outline: 'none' }}
                />
                {addError && <p style={{ color: 'red', fontSize: '12px', margin: '0 0 10px 0' }}>{addError}</p>}
                <button onClick={() => handleAddFriend()} style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Add Friend</button>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#e5ddd5' }}>
          {!activeChat ? (
            <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: '#888' }}>
              <h2>Welcome {currentUser?.username}! Select a chat to start messaging.</h2>
            </div>
          ) : (
            messages.map((msg, index) => {
              const contentText = msg.content || msg.text || '';
              const isSystemMessage = contentText.startsWith('system:');

              if (isSystemMessage) {
                return (
                  <div key={msg.id || index} style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
                    <span style={{ backgroundColor: '#e2e8f0', color: '#4a5568', fontSize: '12px', padding: '4px 12px', borderRadius: '10px', textAlign: 'center' }}>
                      {contentText.replace('system:', '')}
                    </span>
                  </div>
                );
              }

              const isBlocked = hiddenUsers.includes(msg.senderId);

              if (isBlocked) {
                return (
                  <div key={msg.id || index} style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                    <span style={{ fontSize: '11px', color: '#666', fontStyle: 'italic', backgroundColor: '#f1f1f1', padding: '3px 10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                      ⚠️ Message hidden due to a block between users.
                    </span>
                  </div>
                );
              }

              const sender = activeChat.isGroup ? activeChat.participants?.find((p: any) => p.id === msg.senderId) : null;
              const senderName = sender ? sender.username : 'Unknown';

              return (
                <div key={msg.id || index} style={{ 
                  display: 'flex', 
                  justifyContent: msg.senderId === currentUser.id ? 'flex-end' : 'flex-start', 
                  marginBottom: '10px'
                }}>
                  <div style={{ 
                    padding: '10px 15px', borderRadius: '15px', maxWidth: '60%',
                    backgroundColor: msg.senderId === currentUser.id ? '#dcf8c6' : 'white',
                    borderBottomRightRadius: msg.senderId === currentUser.id ? '0' : '15px',
                    borderBottomLeftRadius: msg.senderId !== currentUser.id ? '0' : '15px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    display: 'flex', flexDirection: 'column'
                  }}>
                    {activeChat.isGroup && msg.senderId !== currentUser.id && (
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#007bff', marginBottom: '3px' }}>
                        {senderName}
                      </span>
                    )}
                    <p style={{ margin: 0 }}>{contentText}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {activeChat && (
          <div style={{ padding: '15px', backgroundColor: '#f0f0f0', display: 'flex', gap: '10px', borderTop: '1px solid #ddd' }}>
            <input 
              type="text" 
              placeholder={!activeChat.isGroup && blockedByMe.includes(activeChat.id) ? "You blocked this user. Cannot send messages." : "Type a message..."} 
              disabled={!activeChat.isGroup && blockedByMe.includes(activeChat.id)}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              style={{ 
                flex: 1, 
                padding: '12px', 
                borderRadius: '25px', 
                border: '1px solid #ccc', 
                outline: 'none',
                backgroundColor: !activeChat.isGroup && blockedByMe.includes(activeChat.id) ? '#e9ecef' : 'white',
                cursor: !activeChat.isGroup && blockedByMe.includes(activeChat.id) ? 'not-allowed' : 'text',
                color: '#000' // 👈👈 السر هون: فرضنا اللون الأسود عشان ما يختفي الخط
              }}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!activeChat.isGroup && blockedByMe.includes(activeChat.id)}
              style={{ 
                padding: '0 25px', 
                borderRadius: '25px', 
                border: 'none', 
                backgroundColor: !activeChat.isGroup && blockedByMe.includes(activeChat.id) ? '#ccc' : '#007bff', 
                color: 'white', 
                fontWeight: 'bold', 
                cursor: !activeChat.isGroup && blockedByMe.includes(activeChat.id) ? 'not-allowed' : 'pointer' 
              }}
            >
              Send
            </button>
          </div>
        )}

      </div>
    </div>
  );
}