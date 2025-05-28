import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import axios from "../config/axios"
import { useNavigate } from 'react-router-dom'

const Home = () => {

    const { user } = useContext(UserContext)
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    const [ projectName, setProjectName ] = useState('')
    const [ projects, setProjects ] = useState([])
    const [ welcomeVisible, setWelcomeVisible ] = useState(false)
    const [ loading, setLoading ] = useState(false)
    const [ errorMessage, setErrorMessage ] = useState('')
    
    const navigate = useNavigate()

    const fetchProjects = () => {
        setLoading(true)
        axios.get('/projects/all')
            .then((res) => {
                setProjects(res.data.projects)
                setLoading(false)
            })
            .catch(err => {
                console.log(err)
                setLoading(false)
                setErrorMessage('Failed to load projects')
            })
    }

    function createProject(e) {
        e.preventDefault()
        if (!projectName.trim()) {
            setErrorMessage('Project name cannot be empty')
            return
        }
        
        setLoading(true)
        setErrorMessage('')
        
        axios.post('/projects/create', {
            name: projectName,
        })
            .then((res) => {
                setIsModalOpen(false)
                setProjectName('')
                fetchProjects() // Refresh the project list
            })
            .catch((error) => {
                console.log(error)
                setErrorMessage(error.response?.data?.message || 'Failed to create project')
                setLoading(false)
            })
    }

    const deleteProject = (e, projectId) => {
        e.stopPropagation() // Prevent navigation to project details
        
        setLoading(true)
        setErrorMessage('')
        
        // Using a POST-based endpoint for deletion (more reliable than DELETE)
        axios.post(`/projects/remove-project/${projectId}`)
            .then((res) => {
                console.log('Project deleted successfully')
                fetchProjects() // Refresh the project list
            })
            .catch((error) => {
                console.log(error)
                setErrorMessage(error.response?.data?.error || 'Failed to delete project')
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchProjects()
        
        // Show welcome message with animation delay
        setTimeout(() => {
            setWelcomeVisible(true)
        }, 300)
    }, [])

    return (
        <main className='min-h-screen bg-gradient-to-r from-blue-50 to-indigo-100 p-6'>
            {/* Animated welcome message */}
            <div className={`fixed top-0 left-0 right-0 bg-blue-500 text-white p-3 text-center transform transition-all duration-700 ease-in-out ${welcomeVisible ? 'translate-y-0' : '-translate-y-full'}`}>
                <p className="font-medium">Welcome! Let's create new projects</p>
            </div>
            
            <div className="container mx-auto mt-16 max-w-6xl">
                <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Your Projects</h1>
                
                {errorMessage && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <p>{errorMessage}</p>
                    </div>
                )}
                
                <div className="projects grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="project flex flex-col justify-center items-center p-6 border border-gray-300 rounded-xl min-h-[180px] bg-white shadow-sm hover:shadow-md transition duration-200 transform hover:scale-[1.02]">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                            <span className="text-2xl text-blue-500">+</span>
                        </div>
                        <p className="text-lg font-medium text-gray-700">New Project</p>
                    </button>

                    {loading && projects.length === 0 ? (
                        <div className="col-span-full text-center py-8">
                            <p className="text-gray-600">Loading projects...</p>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="col-span-full text-center py-8">
                            <p className="text-gray-600">No projects yet. Create your first project!</p>
                        </div>
                    ) : (
                        projects.map((project) => (
                            <div key={project._id}
                                className="project relative flex flex-col gap-2 p-6 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition duration-200 cursor-pointer">
                                {/* Delete button */}
                                <button 
                                    onClick={(e) => deleteProject(e, project._id)}
                                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition duration-200"
                                    title="Delete project"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                
                                <div 
                                    onClick={() => {
                                        navigate(`/project`, {
                                            state: { project }
                                        })
                                    }}
                                    className="flex-grow"
                                >
                                    <h2 className='text-xl font-semibold text-gray-800 mb-4'>{project.name}</h2>

                                    <div className="flex items-center text-gray-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        <span>Collaborators: {project.users.length}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Create Project Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md relative overflow-hidden">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Project</h2>
                        
                        {errorMessage && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                <p>{errorMessage}</p>
                            </div>
                        )}
                        
                        <form onSubmit={createProject} className="space-y-4">
                            <div className="mb-4">
                                <label className="block text-gray-700 font-medium mb-2">Project Name</label>
                                <input
                                    onChange={(e) => setProjectName(e.target.value)}
                                    value={projectName}
                                    type="text" 
                                    className="w-full p-3 rounded-lg border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" 
                                    placeholder="Enter project name"
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <button 
                                    type="button" 
                                    className="mr-4 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200" 
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 transform hover:scale-[1.02]"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating...' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Home