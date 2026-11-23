import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  Menu,
  X,
  Loader2,
  FolderKanban,
  Sparkles,
} from 'lucide-react'
import { AppLayout } from '@/components/common/AppLayout'
import { ChatSidebar, ProjectChatRoom } from '@/components/chat'
import { Button } from '@/components/ui/Button'
import { getWorkspaceProjects } from '@/services/projects'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useAuth } from '@/hooks/useAuth'

export function ChatPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()

  const [projects, setProjects] = useState([])
  const [activeProject, setActiveProject] = useState(null)
  const [activeChannelName, setActiveChannelName] = useState('general')
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState({})

  // Load workspace projects
  const loadProjects = useCallback(async () => {
    if (!currentWorkspace?.id) return
    setIsLoadingProjects(true)
    try {
      const data = await getWorkspaceProjects(currentWorkspace.id)
      setProjects(data || [])

      // Select active project based on URL or first project
      if (projectId) {
        const found = data.find((p) => p.id === projectId)
        if (found) {
          setActiveProject(found)
          setActiveChannelName(null)
        } else {
          setActiveProject(null)
          setActiveChannelName('general')
        }
      } else if (data.length > 0) {
        setActiveProject(data[0])
        setActiveChannelName(null)
      } else {
        setActiveProject(null)
        setActiveChannelName('general')
      }
    } catch (err) {
      console.error('Failed to load workspace projects for chat:', err)
    } finally {
      setIsLoadingProjects(false)
    }
  }, [currentWorkspace?.id, projectId])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // Handle choosing a project
  const handleSelectProject = (project) => {
    setActiveProject(project)
    setActiveChannelName(null)
    setIsMobileSidebarOpen(false)
    navigate(`/chat/${project.id}`)
  }

  // Handle choosing a channel
  const handleSelectChannel = (channelName) => {
    setActiveProject(null)
    setActiveChannelName(channelName)
    setIsMobileSidebarOpen(false)
    navigate('/chat')
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-5.5rem)] flex flex-col rounded-lg border border-border bg-card shadow-subtle overflow-hidden">
        {/* Mobile Subheader Bar with Menu Toggle */}
        <div className="flex md:hidden items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/30">
          <Button
            type="button"
            variant="outline"
            size="xs"
            leftIcon={isMobileSidebarOpen ? X : Menu}
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          >
            {isMobileSidebarOpen ? 'Close Rooms' : 'All Rooms'}
          </Button>

          <span className="text-xs font-semibold text-foreground truncate max-w-[180px]">
            {activeProject ? activeProject.name : `#${activeChannelName}`}
          </span>
        </div>

        {/* Main Split Chat Layout */}
        <div className="relative flex-1 flex overflow-hidden">
          {/* Desktop Sidebar */}
          <div className="hidden md:block h-full">
            <ChatSidebar
              projects={projects}
              activeProjectId={activeProject?.id}
              activeChannelName={activeChannelName}
              onSelectProject={handleSelectProject}
              onSelectChannel={handleSelectChannel}
              unreadCounts={unreadCounts}
              className="h-full"
            />
          </div>

          {/* Mobile Slide-over Sidebar Drawer */}
          {isMobileSidebarOpen && (
            <div className="md:hidden fixed inset-0 z-40 flex">
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              <div className="relative z-50 w-72 max-w-[80vw] h-full bg-card shadow-modal">
                <ChatSidebar
                  projects={projects}
                  activeProjectId={activeProject?.id}
                  activeChannelName={activeChannelName}
                  onSelectProject={handleSelectProject}
                  onSelectChannel={handleSelectChannel}
                  unreadCounts={unreadCounts}
                  className="h-full border-r-0"
                />
              </div>
            </div>
          )}

          {/* Active Chat Room View */}
          <div className="flex-1 flex flex-col h-full min-w-0">
            {isLoadingProjects ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
                <span>Loading chat workspace...</span>
              </div>
            ) : (
              <ProjectChatRoom
                project={activeProject}
                channelName={activeChannelName || 'general'}
                workspaceId={currentWorkspace?.id}
                className="h-full"
              />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

