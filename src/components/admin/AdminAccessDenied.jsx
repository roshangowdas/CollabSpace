import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldX, ArrowLeft, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export function AdminAccessDenied({ currentRole = 'Member', workspaceName = 'Workspace' }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border/80 shadow-lg text-center">
        <CardContent className="py-12 px-6 flex flex-col items-center">
          <div className="w-14 h-14 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
            <ShieldX className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold tracking-tight text-foreground mb-1.5">
            Administration Access Restricted
          </h2>

          <div className="flex items-center justify-center gap-1.5 my-2">
            <span className="text-xs text-muted-foreground">Your role in {workspaceName}:</span>
            <Badge variant="secondary" className="text-xs font-semibold">
              {currentRole}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
            The workspace administration panel is restricted to workspace <strong>Owners</strong> and <strong>Admins</strong>.
            Developers, designers, testers, and regular members cannot modify workspace settings or member roles.
          </p>

          <Link to="/dashboard">
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
