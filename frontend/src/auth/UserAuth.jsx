import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'

/**
 * Authentication wrapper component that ensures users are logged in
 * before accessing protected routes
 */
const UserAuth = ({ children }) => {
    const { user } = useContext(UserContext)
    const [loading, setLoading] = useState(true)
    const token = localStorage.getItem('token')
    const navigate = useNavigate()
    
    useEffect(() => {
        // If user exists, we're authenticated - stop loading
        if (user) {
            setLoading(false)
            return;
        }
        
        // If no token or no user, redirect to login
        if (!token || !user) {
            navigate('/login')
        }
    }, [user, token, navigate])
    
    if (loading) {
        return <div className="flex items-center justify-center h-screen">
            <p className="text-lg">Loading...</p>
        </div>
    }
    
    return <>{children}</>
}

export default UserAuth