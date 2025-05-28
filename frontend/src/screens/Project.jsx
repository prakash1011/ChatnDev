import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js';
import { getWebContainer } from '../config/webContainer'

function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)
            ref.current.removeAttribute('data-highlighted')
        }
    }, [ props.className, props.children ])

    return <code {...props} ref={ref} />
}

const Project = () => {
    const location = useLocation()
    const navigate = useNavigate()

    const [ isSidePanelOpen, setIsSidePanelOpen ] = useState(false)
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    const [ selectedUserId, setSelectedUserId ] = useState(new Set())
    const [ project, setProject ] = useState(location.state.project)
    const [ message, setMessage ] = useState('')
    const { user, setUser } = useContext(UserContext)
    const messageBox = useRef()
    const [ welcomeVisible, setWelcomeVisible ] = useState(false)
    const [ isDeletingFile, setIsDeletingFile ] = useState(false)

    const [ users, setUsers ] = useState([])
    const [ messages, setMessages ] = useState([]) 
    const [ fileTree, setFileTree ] = useState({})

    const [ currentFile, setCurrentFile ] = useState(null)
    const [ openFiles, setOpenFiles ] = useState([])

    const [ webContainer, setWebContainer ] = useState(null)
    const [ iframeUrl, setIframeUrl ] = useState(null)

    const [ runProcess, setRunProcess ] = useState(null)
    const [ isServerVisible, setIsServerVisible ] = useState(true)

    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }
            return newSelectedUserId;
        });
    }

    function addCollaborators() {
        axios.put("/projects/add-user", {
            projectId: location.state.project._id,
            users: Array.from(selectedUserId)
        }).then(res => {
            console.log(res.data)
            setIsModalOpen(false)
        }).catch(err => {
            console.log(err)
        })
    }

    const send = () => {
        if (!message || message.trim() === '') {
            return;
        }
        
        const messageContent = message.trim();
        
        setMessages(prevMessages => [ ...prevMessages, { sender: user, message: messageContent } ])
        setMessage("")
        
        sendMessage('project-message', {
            message: messageContent,
            sender: user
        })
        
        setTimeout(scrollToBottom, 100);
    }
    
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    }

    function WriteAiMessage(message) {
        let messageObject;
        
        try {
            messageObject = typeof message === 'string' ? JSON.parse(message) : message;
        } catch (error) {
            return <p className="text-gray-800">{message}</p>;
        }
        
        if (messageObject.type === 'code') {
            return (
                <div className="code-block">
                    <pre>
                        <SyntaxHighlightedCode className={`lang-${messageObject.language || 'javascript'}`}>
                            {messageObject.content}
                        </SyntaxHighlightedCode>
                    </pre>
                </div>
            );
        } else if (messageObject.type === 'markdown') {
            return <Markdown>{messageObject.content}</Markdown>;
        } else {
            return <p className="text-gray-800">{message}</p>;
        }
    }

    function handleLogout() {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/');
    }

    useEffect(() => {
        setTimeout(() => {
            setWelcomeVisible(true)
        }, 1000)
    }, [])
    
    useEffect(() => {
        const socket = initializeSocket(project._id)
        
        function handleProjectMessage(data) {
            console.log('Received project message:', data);
            
            if (!data || !data.sender) {
                console.error('Invalid message format received');
                return;
            }
            
            setMessages(prevMessages => [...prevMessages, data]);
            
            setTimeout(() => {
                scrollToBottom();
            }, 100);
        }
        
        receiveMessage('project-message', handleProjectMessage)
        
        if (!webContainer) {
            getWebContainer().then(container => {
                setWebContainer(container);
            }).catch(err => {
                console.error('Error initializing WebContainer:', err);
            });
        }
        
        return () => {
            socket.off('project-message', handleProjectMessage);
            console.log('Socket listener removed for project-message');
        };
    }, [project._id, webContainer]);
    
    useEffect(() => {
        const projectId = location.state.project._id;
        
        axios.get(`/projects/get-project/${projectId}`)
            .then(res => {
                setProject(res.data.project);
                setFileTree(res.data.project.fileTree || {});
            })
            .catch(err => console.log('Error loading project:', err));

        axios.get(`/messages/${projectId}`)
            .then(res => {
                console.log('API response for messages:', res.data);
                console.log('Raw messages from API:', JSON.stringify(res.data.messages));
                
                const messagesArray = res.data.messages || [];
                console.log('Messages count:', messagesArray.length);
                
                const processedMessages = messagesArray.map(msg => {
                    console.log('Processing message:', JSON.stringify(msg));
                    
                    if (!msg || !msg.sender) {
                        console.error('Invalid message format:', msg);
                        return null;
                    }
                    
                    if (msg.sender._id === 'ai') {
                        try {
                            console.log('Processing AI message:', typeof msg.message, msg.message);
                            
                            if (typeof msg.message === 'string') {
                                try {
                                    JSON.parse(msg.message);
                                } catch (error) {
                                    console.log('AI message is not JSON, keeping as string');
                                }
                            }
                        } catch (error) {
                            console.error('Error processing AI message:', error);
                        }
                    }
                    return msg;
                }).filter(msg => msg !== null);
                
                console.log('Setting messages state with:', processedMessages.length, 'messages');
                setMessages(processedMessages);
                
                setTimeout(() => {
                    console.log('Attempting to scroll to bottom');
                    scrollToBottom();
                }, 500);
            })
            .catch(err => {
                console.error('Error loading messages from API:', err);
                if (err.response) {
                    console.error('Error response:', err.response.data);
                }
            });

        axios.get('/users/all')
            .then(res => {
                setUsers(res.data.users || res.data);
            })
            .catch(err => console.log('Error loading users:', err));
    }, [location.state.project._id]);
    
    function saveFileTree(ft) {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => {
            console.log(res.data)
        }).catch(err => {
            console.log(err)
        })
    }
    
    function deleteFile(filename, e) {
        e.stopPropagation()
        setIsDeletingFile(true)
        
        const newFileTree = { ...fileTree }
        delete newFileTree[filename]
        
        setFileTree(newFileTree)
        setOpenFiles(openFiles.filter(file => file !== filename))
        
        if (currentFile === filename) {
            const remainingFiles = Object.keys(newFileTree)
            setCurrentFile(remainingFiles.length > 0 ? remainingFiles[0] : null)
        }
        
        saveFileTree(newFileTree)
        setIsDeletingFile(false)
    }

    function scrollToBottom() {
        if (messageBox && messageBox.current) {
            messageBox.current.scrollTop = messageBox.current.scrollHeight;
        }
    }
    
    return (
        <main className="flex h-screen overflow-hidden">
            <section className="left bg-white h-full w-72 min-w-72 border-r border-gray-200 shadow-md flex flex-col overflow-hidden">
                <div className="top-panel p-4 bg-white border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                            className="text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition duration-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                            </svg>
                        </button>
                        <h1 className='font-semibold text-lg text-gray-800 truncate'>{project.name}</h1>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        title="Add collaborators"
                        className="text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition duration-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </button>
                </div>
                
                <div className="chat-container relative flex flex-col h-full">
                    <div className="message-box flex-grow overflow-y-auto p-4" ref={messageBox}>
                        {messages && messages.length > 0 ? (
                            messages.map((msg, index) => (
                                <div key={index} className={`${msg.sender._id === 'ai' ? 'max-w-3xl' : 'max-w-xs md:max-w-sm'} ${msg.sender._id === user?._id?.toString() ? 'ml-auto bg-blue-100 border-blue-200' : 'bg-white border-gray-200'} message flex flex-col p-3 shadow-sm border w-fit rounded-lg mb-4`}>
                                    <small className='text-gray-600 text-xs font-medium mb-1'>{msg.sender.email}</small>
                                    <div className={`${msg.sender._id === 'ai' ? 'text-sm overflow-auto max-h-96' : 'text-base'}`}>
                                        {msg.sender._id === 'ai' ?
                                            WriteAiMessage(msg.message)
                                            : <p className="text-gray-800">{msg.message}</p>}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 my-4">
                                <p>No messages yet. Start a conversation!</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="inputField w-full flex absolute bottom-0 p-2 bg-white border-t border-gray-200 shadow-md">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            className='p-3 px-4 border border-gray-300 rounded-l-lg outline-none focus:ring-2 focus:ring-blue-500 flex-grow transition duration-200' 
                            type="text" 
                            placeholder='Type @ai to ask AI a question...' />
                        <button
                            onClick={send}
                            className='px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg transition duration-200'>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>
                </div>
            </section>
            
            <section className="right bg-white flex-grow h-full flex shadow-md">
                <div className="explorer h-full max-w-64 min-w-52 bg-gray-50 border-r border-gray-200">
                    <div className="p-3 border-b border-gray-200 bg-white">
                        <h2 className="text-gray-700 font-medium text-sm uppercase tracking-wider">Files</h2>
                    </div>
                    <div className="file-tree w-full overflow-y-auto">
                        {Object.keys(fileTree).length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                <p>No files yet</p>
                            </div>
                        ) : (
                            Object.keys(fileTree).map((file, index) => (
                                <div key={index} className="group relative tree-element hover:bg-gray-100 w-full transition-colors duration-150 border-b border-gray-100">
                                    <button
                                        onClick={() => {
                                            setCurrentFile(file)
                                            setOpenFiles([ ...new Set([ ...openFiles, file ]) ])
                                        }}
                                        className="w-full p-3 flex items-center gap-2 text-left">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className='font-medium text-gray-700 truncate'>{file}</p>
                                    </button>
                                    <button
                                        title="Delete file"
                                        disabled={isDeletingFile}
                                        onClick={(e) => deleteFile(file, e)}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all duration-200"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="code-editor flex flex-col flex-grow h-full shrink">
                    <div className="top flex justify-between items-center p-3 border-b border-gray-700 bg-gray-800">
                        <div className="files flex-grow overflow-hidden">
                            {openFiles.length === 0 ? (
                                <div className="p-3 text-gray-500 text-sm">No open files</div>
                            ) : (
                                openFiles.map((file, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentFile(file)}
                                        className={`px-3 py-2 rounded-t-md transition-colors duration-200 ${currentFile === file ? 'bg-gray-700 text-gray-100' : 'text-gray-300 hover:bg-gray-700 hover:text-gray-200'}`}
                                    >
                                        {file}
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="actions flex gap-2 p-2">
                            <button
                                onClick={async () => {
                                    try {
                                        let container = webContainer;
                                        if (!container) {
                                            container = await getWebContainer();
                                            setWebContainer(container);
                                            console.log("WebContainer initialized");
                                        }

                                        if (!container) {
                                            console.error('WebContainer not available');
                                            return;
                                        }

                                        // Create a simple index.js file to test the server
                                        const files = {
                                            ...fileTree
                                        };

                                        // Reset any previous URL
                                        setIframeUrl(null);

                                        // Write all files to the container filesystem
                                        for (const [filename, fileData] of Object.entries(files)) {
                                            await container.fs.writeFile(
                                                filename,
                                                fileData.file.contents
                                            );
                                            console.log(`Wrote file: ${filename}`);
                                        }

                                        console.log('All files written to container');

                                        // Install dependencies if package.json exists
                                        if (files['package.json']) {
                                            console.log('Installing dependencies...');
                                            const installProcess = await container.spawn('npm', ['install']);
                                            setRunProcess(installProcess);

                                            installProcess.output.pipeTo(
                                                new WritableStream({
                                                    write(data) {
                                                        console.log(data);
                                                    }
                                                })
                                            );

                                            // Wait for install to complete
                                            await installProcess.exit;
                                            console.log('Dependencies installed');
                                        }

                                        // Start the server
                                        console.log('Starting server...');
                                        const serverProcess = await container.spawn('npm', ['start']);
                                        setRunProcess(serverProcess);

                                        // Log output
                                        serverProcess.output.pipeTo(
                                            new WritableStream({
                                                write(data) {
                                                    console.log(data);
                                                }
                                            })
                                        );

                                        // Get WebContainer URL
                                        const url = await container.iframe.getUrl();
                                        console.log('Server running at:', url);
                                        setIframeUrl(url);
                                        setIsServerVisible(true);
                                    } catch (error) {
                                        console.error('Error running server:', error);
                                    }
                                }}
                                className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors duration-200 flex items-center gap-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                </svg>
                                Run Server
                            </button>
                        </div>
                    </div>
                    <div className="bottom flex flex-grow max-w-full shrink overflow-auto">
                        {
                            fileTree[ currentFile ] && (
                                <div className="code-editor-area h-full overflow-auto flex-grow bg-gray-900">
                                    <pre
                                        className="hljs h-full">
                                        <code
                                            className="hljs h-full outline-none"
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const updatedContent = e.target.innerText;
                                                const ft = {
                                                    ...fileTree,
                                                    [ currentFile ]: {
                                                        file: {
                                                            contents: updatedContent
                                                        }
                                                    }
                                                }
                                                setFileTree(ft)
                                                saveFileTree(ft)
                                            }}
                                            dangerouslySetInnerHTML={{ __html: hljs.highlight('javascript', fileTree[ currentFile ].file.contents).value }}
                                            style={{
                                                whiteSpace: 'pre-wrap',
                                                paddingBottom: '25rem',
                                                counterSet: 'line-numbering',
                                                padding: '1rem',
                                                color: '#e2e8f0'  // Light gray text for dark mode readability
                                            }}
                                        />
                                    </pre>
                                </div>
                            )
                        }
                    </div>
                </div>

                {iframeUrl && webContainer && isServerVisible && (
                    <div className="flex min-w-96 flex-col h-full relative">
                        <div className="address-bar flex items-center justify-between bg-slate-200">
                            <input type="text"
                                onChange={(e) => setIframeUrl(e.target.value)}
                                value={iframeUrl} 
                                className="flex-grow p-2 px-4 bg-slate-200 outline-none" />
                            <button 
                                onClick={() => setIsServerVisible(false)}
                                className="p-2 hover:bg-slate-300 transition-colors duration-150">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <iframe src={iframeUrl} className="w-full h-full"></iframe>
                    </div>)}
                
                {iframeUrl && webContainer && !isServerVisible && (
                    <button 
                        onClick={() => setIsServerVisible(true)}
                        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors duration-200 z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                )}
            </section>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-md w-96 max-w-full relative">
                        <header className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-semibold'>Select User</h2>
                            <button onClick={() => setIsModalOpen(false)} className='p-2'>
                                <i className="ri-close-fill"></i>
                            </button>
                        </header>
                        <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
                            {users.map(user => (
                                <div key={user._id || user.id} className={`user cursor-pointer hover:bg-slate-200 ${Array.from(selectedUserId).indexOf(user._id) != -1 ? 'bg-slate-200' : ""} p-2 flex gap-2 items-center`} onClick={() => handleUserClick(user._id)}>
                                    <div className='aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
                                        <i className="ri-user-fill absolute"></i>
                                    </div>
                                    <h1 className='font-semibold text-lg'>{user.email}</h1>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addCollaborators}
                            className='absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-md'>
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Project
